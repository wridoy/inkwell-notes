'use strict';
/* Inkwell sync: notes stay on the device and work offline. When online and connected,
   they are copied to the user's own Dropbox (an "Apps/<app name>" folder) and changes
   from other devices are brought back. Nothing here holds a secret: the Dropbox app key
   is public by design (PKCE sign-in), and sign-in tokens are kept only on this device. */
window.InkwellSync = function InkwellSync(host) {
  const API = 'https://api.dropboxapi.com/2/';
  const CONTENT = 'https://content.dropboxapi.com/2/';
  const AUTH_URL = 'https://www.dropbox.com/oauth2/authorize';
  const TOKEN_URL = 'https://api.dropboxapi.com/oauth2/token';
  // A built-in app key can be filled in here once one is registered; otherwise the user enters theirs.
  const BUILT_IN_KEY = '';

  let auth = null; // { appKey, refresh, access, exp, account }
  let st = { cursor: null, synced: {}, revs: {}, blobs: {}, foldersSynced: 0, last: 0 };
  let status = 'off', detail = '';
  let running = null, again = false, timer = 0, backoff = 0;
  const deferred = new Map(); // remote notes waiting until the user stops writing on them

  const redirectUri = () => location.origin + location.pathname;
  const appKey = () => (auth && auth.appKey) || host.pref('dropboxKey', '') || BUILT_IN_KEY;
  const setStatus = (s, d = '') => { status = s; detail = d; host.onStatus(s, d); };
  const saveState = () => host.metaPut({ key: 'sync-state', ...st }).catch(() => {});
  const saveAuth = () => (auth ? host.metaPut({ key: 'sync-auth', ...auth }) : host.metaDel('sync-auth')).catch(() => {});

  /* ---------- sign-in (OAuth 2 with PKCE, no secret) ---------- */
  const b64url = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  function randomString(n) {
    const a = new Uint8Array(n);
    crypto.getRandomValues(a);
    return b64url(a).slice(0, n);
  }
  async function connect(key) {
    key = (key || appKey() || '').trim();
    if (!key) throw new Error('Enter your Dropbox app key first.');
    if (!navigator.onLine) throw new Error("You're offline. Connect to the internet to sign in.");
    if (!crypto.subtle) throw new Error('Sign-in needs a secure (https) page.');
    host.prefSet('dropboxKey', key);
    const verifier = randomString(64);
    const state = randomString(24);
    const challenge = b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
    sessionStorage.setItem('inkwell-oauth', JSON.stringify({ verifier, state, key }));
    host.beforeLeave();
    const q = new URLSearchParams({
      client_id: key, response_type: 'code', code_challenge: challenge, code_challenge_method: 'S256',
      redirect_uri: redirectUri(), token_access_type: 'offline', state,
    });
    location.assign(`${AUTH_URL}?${q}`);
  }
  async function finishSignIn() {
    const q = new URLSearchParams(location.search);
    const code = q.get('code'), state = q.get('state'), err = q.get('error');
    if (!code && !err) return false;
    let saved = null;
    try { saved = JSON.parse(sessionStorage.getItem('inkwell-oauth') || 'null'); } catch (e) { saved = null; }
    sessionStorage.removeItem('inkwell-oauth');
    history.replaceState(null, '', redirectUri() + location.hash);
    if (err) { host.toast(err === 'access_denied' ? 'Dropbox sign-in was cancelled.' : 'Dropbox sign-in failed.'); return true; }
    if (!saved || saved.state !== state) { host.toast('Dropbox sign-in could not be checked. Please try again.'); return true; }
    const body = new URLSearchParams({ code, grant_type: 'authorization_code', code_verifier: saved.verifier, client_id: saved.key, redirect_uri: redirectUri() });
    const r = await fetch(TOKEN_URL, { method: 'POST', body });
    if (!r.ok) { host.toast('Dropbox sign-in failed. Check the app key and the redirect address.'); return true; }
    const t = await r.json();
    auth = { appKey: saved.key, refresh: t.refresh_token, access: t.access_token, exp: Date.now() + (t.expires_in || 14400) * 1000 };
    st = { cursor: null, synced: {}, revs: {}, blobs: {}, foldersSynced: 0, last: 0 };
    try {
      const acc = await rpc('users/get_current_account', null);
      auth.account = acc.name ? acc.name.display_name : '';
    } catch (e) { /* the name is only shown in the menu */ }
    await saveAuth();
    await saveState();
    host.toast('Dropbox connected. Your notes will now sync.');
    return true;
  }
  async function token() {
    if (!auth) throw Object.assign(new Error('Not connected'), { code: 'auth' });
    if (auth.access && auth.exp > Date.now() + 60000) return auth.access;
    const body = new URLSearchParams({ grant_type: 'refresh_token', refresh_token: auth.refresh, client_id: auth.appKey });
    const r = await fetch(TOKEN_URL, { method: 'POST', body });
    if (r.status === 400 || r.status === 401) throw Object.assign(new Error('Sign-in expired'), { code: 'auth' });
    if (!r.ok) throw new Error('Dropbox is not answering');
    const t = await r.json();
    auth.access = t.access_token;
    auth.exp = Date.now() + (t.expires_in || 14400) * 1000;
    saveAuth();
    return auth.access;
  }
  async function disconnect() {
    if (auth) {
      try { const tk = await token(); await fetch(API + 'auth/token/revoke', { method: 'POST', headers: { Authorization: 'Bearer ' + tk } }); } catch (e) { /* offline: forget anyway */ }
    }
    auth = null;
    st = { cursor: null, synced: {}, revs: {}, blobs: {}, foldersSynced: 0, last: 0 };
    await saveAuth();
    await host.metaDel('sync-state').catch(() => {});
    setStatus('off');
  }

  /* ---------- Dropbox calls ---------- */
  // Dropbox-API-Arg must be plain ASCII
  const argHeader = (o) => JSON.stringify(o).replace(/[\u007f-￿]/g, (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
  async function call(url, opts, retry = 0) {
    const tk = await token();
    opts.headers = Object.assign({ Authorization: 'Bearer ' + tk }, opts.headers || {});
    const r = await fetch(url, opts);
    if (r.status === 401 && retry < 1) { auth.exp = 0; return call(url, opts, retry + 1); }
    if (r.status === 429 || r.status >= 500) {
      if (retry < 3) {
        const wait = Number(r.headers.get('Retry-After')) || 2 ** retry;
        await new Promise((res) => setTimeout(res, wait * 1000));
        return call(url, opts, retry + 1);
      }
      throw new Error('Dropbox is busy. Will try again soon.');
    }
    return r;
  }
  async function rpc(path, args) {
    const r = await call(API + path, args == null ? { method: 'POST' } : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(args) });
    const text = await r.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (e) { data = { error_summary: text }; }
    if (!r.ok) throw Object.assign(new Error((data && data.error_summary) || 'Dropbox error'), { status: r.status, data });
    return data;
  }
  async function upload(path, body, mode = 'overwrite') {
    const r = await call(CONTENT + 'files/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream', 'Dropbox-API-Arg': argHeader({ path, mode, mute: true, autorename: false }) },
      body,
    });
    const text = await r.text();
    if (r.status === 409 && mode === 'add' && /conflict/.test(text)) return { exists: true };
    if (!r.ok) throw Object.assign(new Error('Upload failed: ' + text.slice(0, 120)), { status: r.status });
    return JSON.parse(text);
  }
  async function download(path) {
    const r = await call(CONTENT + 'files/download', { method: 'POST', headers: { 'Dropbox-API-Arg': argHeader({ path }) } });
    if (r.status === 409) return null; // not found
    if (!r.ok) throw new Error('Download failed');
    return r.blob();
  }
  async function listChanges() {
    const out = [];
    let res;
    if (st.cursor) {
      try { res = await rpc('files/list_folder/continue', { cursor: st.cursor }); }
      catch (e) { if (e.status === 409) { st.cursor = null; return listChanges(); } throw e; }
    } else {
      res = await rpc('files/list_folder', { path: '', recursive: true, include_deleted: false });
    }
    out.push(...res.entries);
    while (res.has_more) {
      res = await rpc('files/list_folder/continue', { cursor: res.cursor });
      out.push(...res.entries);
    }
    return { entries: out, cursor: res.cursor };
  }
  async function pool(items, n, fn) {
    let i = 0;
    const work = async () => { while (i < items.length) { const it = items[i++]; await fn(it); } };
    await Promise.all(Array.from({ length: Math.min(n, items.length) }, work));
  }

  /* ---------- one sync pass ---------- */
  async function pass() {
    // 1. bring in changes from other devices
    const { entries, cursor } = await listChanges();
    const noteFiles = entries.filter((e) => e['.tag'] === 'file' && /^\/notes\/[^/]+\.json$/.test(e.path_lower) && st.revs[e.path_lower] !== e.rev);
    const folderFile = entries.find((e) => e['.tag'] === 'file' && e.path_lower === '/meta/folders.json' && st.revs[e.path_lower] !== e.rev);
    let changed = 0;
    await pool(noteFiles, 4, async (e) => {
      const b = await download(e.path_lower);
      if (!b) return;
      let n;
      try { n = JSON.parse(await b.text()); } catch (err) { return; }
      st.revs[e.path_lower] = e.rev;
      if (!host.validNote(n)) return;
      if (applyRemote(n)) changed++;
    });
    if (folderFile) {
      const b = await download(folderFile.path_lower);
      if (b) {
        try {
          const f = JSON.parse(await b.text());
          st.revs[folderFile.path_lower] = folderFile.rev;
          if (Array.isArray(f.list) && f.updated > host.foldersUpdated()) { host.setFolders(f.list, f.updated); st.foldersSynced = f.updated; changed++; }
        } catch (err) { /* ignore a damaged file */ }
      }
    }
    st.cursor = cursor;
    // pictures and recordings that other devices added
    const missing = new Set();
    for (const n of host.notes()) {
      if (n.deleted) continue;
      for (const id of host.blobIdsOf(n)) if (!(await host.hasBlob(id))) missing.add(id);
    }
    await pool([...missing], 3, async (id) => {
      const b = await download('/blobs/' + id);
      if (b) { await host.putBlob(id, b); st.blobs[id] = 1; changed++; }
    });
    if (changed) host.refresh();

    // 2. send this device's changes
    const dirty = host.notes().filter((n) => n.updated > (st.synced[n.id] || 0));
    for (const n of dirty) {
      if (!n.deleted) {
        for (const id of host.blobIdsOf(n)) {
          if (st.blobs[id]) continue;
          const b = await host.getBlob(id);
          if (!b) continue;
          await upload('/blobs/' + id, b, 'add');
          st.blobs[id] = 1;
        }
      }
      const snap = host.serialize(n);
      const res = await upload(`/notes/${n.id}.json`, new Blob([JSON.stringify(snap)], { type: 'application/json' }));
      if (res && res.rev) st.revs[res.path_lower] = res.rev;
      st.synced[n.id] = snap.updated;
    }
    const fu = host.foldersUpdated();
    if (fu > st.foldersSynced) {
      const res = await upload('/meta/folders.json', new Blob([JSON.stringify({ list: host.folders(), updated: fu })], { type: 'application/json' }));
      if (res && res.rev) st.revs[res.path_lower] = res.rev;
      st.foldersSynced = fu;
    }
    st.last = Date.now();
    await saveState();
    return { pulled: changed, pushed: dirty.length };
  }

  function applyRemote(r) {
    const l = host.notes().find((x) => x.id === r.id);
    if (!l) { host.addNote(r); st.synced[r.id] = r.updated; return true; }
    if (r.updated <= l.updated) return false; // this device has the same or a newer copy
    if (host.isEditing(l)) { deferred.set(r.id, r); return false; }
    const localUnsynced = l.updated > (st.synced[l.id] || 0);
    if (localUnsynced && !l.deleted && !r.deleted) host.keepConflictCopy(l);
    host.replaceNote(l, r);
    st.synced[r.id] = r.updated;
    return true;
  }
  function applyDeferred() {
    let any = false;
    for (const [id, r] of deferred) {
      const l = host.notes().find((x) => x.id === id);
      if (l && host.isEditing(l)) continue;
      deferred.delete(id);
      if (applyRemote(r)) any = true;
    }
    if (any) host.refresh();
  }

  async function syncNow(manual) {
    if (!auth) { setStatus('off'); return; }
    if (!navigator.onLine) { setStatus('offline', 'Changes are saved on this device and will sync when you are back online.'); return; }
    if (running) { again = true; return running; }
    setStatus('syncing');
    running = (async () => {
      try {
        host.flush();
        applyDeferred();
        const r = await pass();
        backoff = 0;
        setStatus('ok', '');
        if (manual) host.toast(r.pulled || r.pushed ? `Synced: ${r.pushed} sent, ${r.pulled} received` : 'Everything is up to date');
      } catch (e) {
        if (e.code === 'auth') setStatus('auth', 'Dropbox needs you to sign in again.');
        else if (!navigator.onLine) setStatus('offline', 'Changes are saved on this device and will sync when you are back online.');
        else { setStatus('error', e.message || 'Sync failed'); backoff = Math.min(300000, (backoff || 15000) * 2); schedule(backoff); }
        if (manual && e.code !== 'auth') host.toast('Sync failed: ' + (e.message || 'unknown error'));
      } finally {
        running = null;
        if (again) { again = false; schedule(1500); }
      }
    })();
    return running;
  }
  function schedule(ms) {
    clearTimeout(timer);
    timer = setTimeout(() => syncNow(false), ms);
  }

  async function start() {
    try {
      const a = await host.metaGet('sync-auth');
      if (a && a.refresh) auth = { appKey: a.appKey, refresh: a.refresh, access: a.access, exp: a.exp, account: a.account };
      const s = await host.metaGet('sync-state');
      if (s) st = Object.assign(st, s, { key: undefined });
      delete st.key;
    } catch (e) { /* storage unavailable: sync stays off */ }
    try { await finishSignIn(); } catch (e) { host.toast('Dropbox sign-in failed: ' + e.message); }
    if (!auth) { setStatus('off'); return; }
    setStatus(navigator.onLine ? 'ok' : 'offline');
    window.addEventListener('online', () => syncNow(false));
    window.addEventListener('offline', () => setStatus('offline', 'Changes are saved on this device and will sync when you are back online.'));
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') schedule(500); });
    setInterval(() => { if (document.visibilityState === 'visible') syncNow(false); }, 60000);
    schedule(800);
  }

  return {
    start, connect, disconnect,
    syncNow: () => syncNow(true),
    noteChanged: () => { if (auth && status !== 'auth') schedule(5000); },
    idle: () => { if (deferred.size) applyDeferred(); },
    info: () => ({ connected: !!auth, status, detail, last: st.last, account: auth && auth.account, key: appKey(), redirect: redirectUri() }),
  };
};
