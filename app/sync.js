'use strict';
/* Inkwell sync: notes stay on the device and work offline. When online and connected,
   they are copied to the user's own Google Drive (the app's private, hidden app-data
   folder) and changes from other devices are brought back.
   Nothing here holds a secret: the Google client ID is public by design, and the
   sign-in token is kept only on this device. */
window.InkwellSync = function InkwellSync(host) {
  const DRIVE = 'https://www.googleapis.com/drive/v3/';
  const UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files';
  const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
  const SCOPE = 'https://www.googleapis.com/auth/drive.appdata email';
  // A built-in client ID can be filled in here once one is registered; otherwise the user enters theirs.
  const BUILT_IN_CLIENT_ID = '';

  let auth = null; // { clientId, email, access, exp }
  const fresh = () => ({ cursor: null, ids: {}, revs: {}, synced: {}, blobs: {}, foldersSynced: 0, settingsSynced: 0, last: 0 });
  let st = fresh();
  let status = 'off', detail = '';
  let running = null, again = false, timer = 0, backoff = 0;
  const deferred = new Map(); // remote notes waiting until the user stops writing on them

  const redirectUri = () => location.origin + location.pathname;
  const clientId = () => (auth && auth.clientId) || host.pref('googleClientId', '') || BUILT_IN_CLIENT_ID;
  const setStatus = (s, d = '') => { status = s; detail = d; host.onStatus(s, d); };
  const saveState = () => host.metaPut({ key: 'sync-state', ...st }).catch(() => {});
  const saveAuth = () => (auth ? host.metaPut({ key: 'sync-auth', ...auth }) : host.metaDel('sync-auth')).catch(() => {});
  const OFFLINE = 'Changes are saved on this device and will sync when you are back online.';

  /* ---------- sign-in (Google OAuth for browser apps, no secret) ---------- */
  function randomString(n) {
    const a = new Uint8Array(n);
    crypto.getRandomValues(a);
    return [...a].map((b) => (b % 36).toString(36)).join('');
  }
  function signIn(id, silent) {
    id = (id || clientId() || '').trim();
    if (!id) throw new Error('Enter your Google client ID first.');
    if (!navigator.onLine) throw new Error("You're offline. Connect to the internet to sign in.");
    host.prefSet('googleClientId', id);
    const state = randomString(24);
    sessionStorage.setItem('inkwell-oauth', JSON.stringify({ state, id, silent: !!silent }));
    host.beforeLeave();
    const q = new URLSearchParams({ client_id: id, redirect_uri: redirectUri(), response_type: 'token', scope: SCOPE, include_granted_scopes: 'true', state });
    if (silent) q.set('prompt', 'none');
    if (auth && auth.email) q.set('login_hint', auth.email);
    location.assign(`${AUTH_URL}?${q}`);
  }
  async function connect(id) { signIn(id, false); }
  // Google gives browser apps an hour-long pass; renewing it is a quick trip to Google and back
  function renew() {
    if (!auth || !navigator.onLine) return false;
    try {
      const last = Number(sessionStorage.getItem('inkwell-renew') || 0);
      if (Date.now() - last < 5 * 60000) return false; // don't loop if Google wants the user to sign in
      sessionStorage.setItem('inkwell-renew', String(Date.now()));
    } catch (e) { return false; }
    signIn(auth.clientId, true);
    return true;
  }
  async function finishSignIn() {
    if (!location.hash || !/(access_token|error)=/.test(location.hash)) return false;
    const q = new URLSearchParams(location.hash.slice(1));
    let saved = null;
    try { saved = JSON.parse(sessionStorage.getItem('inkwell-oauth') || 'null'); } catch (e) { saved = null; }
    sessionStorage.removeItem('inkwell-oauth');
    history.replaceState(null, '', redirectUri());
    const err = q.get('error');
    if (err) {
      if (saved && saved.silent) { setStatus('auth', 'Tap to sign in to Google again.'); return true; }
      host.toast(err === 'access_denied' ? 'Google sign-in was cancelled.' : 'Google sign-in failed.');
      return true;
    }
    if (!saved || saved.state !== q.get('state')) { host.toast('Google sign-in could not be checked. Please try again.'); return true; }
    if (!(q.get('scope') || '').includes('drive.appdata')) { host.toast('Inkwell needs permission to use its own Google Drive folder. Please allow it.'); return true; }
    const isNew = !auth || auth.clientId !== saved.id;
    auth = Object.assign(auth || {}, { clientId: saved.id, access: q.get('access_token'), exp: Date.now() + (Number(q.get('expires_in')) || 3600) * 1000 });
    if (isNew) st = fresh();
    try {
      const r = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: 'Bearer ' + auth.access } });
      if (r.ok) auth.email = (await r.json()).email || auth.email || '';
    } catch (e) { /* only shown in the menu */ }
    await saveAuth();
    await saveState();
    if (!saved.silent) host.toast('Google Drive connected. Your notes will now sync.');
    return true;
  }
  function token() {
    if (!auth) throw Object.assign(new Error('Not connected'), { code: 'auth' });
    if (auth.access && auth.exp > Date.now() + 60000) return auth.access;
    throw Object.assign(new Error('Sign-in expired'), { code: 'auth' });
  }
  async function disconnect() {
    if (auth && auth.access) {
      try { await fetch('https://oauth2.googleapis.com/revoke?token=' + encodeURIComponent(auth.access), { method: 'POST' }); } catch (e) { /* offline: forget anyway */ }
    }
    auth = null;
    st = fresh();
    await saveAuth();
    await host.metaDel('sync-state').catch(() => {});
    setStatus('off');
  }

  /* ---------- Google Drive calls ---------- */
  async function call(url, opts = {}, retry = 0) {
    opts.headers = Object.assign({ Authorization: 'Bearer ' + token() }, opts.headers || {});
    const r = await fetch(url, opts);
    if (r.status === 401) { auth.exp = 0; throw Object.assign(new Error('Sign-in expired'), { code: 'auth' }); }
    if (r.status === 429 || r.status >= 500 || (r.status === 403 && /rateLimit/i.test(await r.clone().text()))) {
      if (retry < 3) {
        await new Promise((res) => setTimeout(res, 1000 * 2 ** retry));
        return call(url, opts, retry + 1);
      }
      throw new Error('Google Drive is busy. Will try again soon.');
    }
    return r;
  }
  async function json(url, opts) {
    const r = await call(url, opts);
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error((data.error && data.error.message) || 'Google Drive error'), { status: r.status });
    return data;
  }
  const FIELDS = 'id,name,version';
  function remember(f) {
    if (!f || !f.name) return;
    st.ids[f.name] = f.id;
    st.revs[f.name] = String(f.version);
  }
  async function upload(name, blob) {
    const id = st.ids[name];
    if (id) {
      const r = await call(`${UPLOAD}/${id}?uploadType=media&fields=${FIELDS}`, { method: 'PATCH', headers: { 'Content-Type': blob.type || 'application/octet-stream' }, body: blob });
      if (r.ok) { const f = await r.json(); remember(f); return f; }
      if (r.status !== 404) throw new Error('Upload failed');
      delete st.ids[name];
    }
    const boundary = 'inkwell' + randomString(16);
    const meta = JSON.stringify({ name, parents: ['appDataFolder'] });
    const body = new Blob([
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n`,
      `--${boundary}\r\nContent-Type: ${blob.type || 'application/octet-stream'}\r\n\r\n`, blob,
      `\r\n--${boundary}--`,
    ]);
    const f = await json(`${UPLOAD}?uploadType=multipart&fields=${FIELDS}`, { method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${boundary}` }, body });
    remember(f);
    return f;
  }
  async function download(id) {
    const r = await call(`${DRIVE}files/${id}?alt=media`);
    if (r.status === 404) return null;
    if (!r.ok) throw new Error('Download failed');
    return r.blob();
  }
  // files that changed since the last pass: [{ name, id, version }]
  async function listChanges() {
    const out = [];
    if (!st.cursor) {
      const start = await json(`${DRIVE}changes/startPageToken`);
      let page = '';
      do {
        const q = new URLSearchParams({ spaces: 'appDataFolder', pageSize: '1000', fields: `nextPageToken,files(${FIELDS})` });
        if (page) q.set('pageToken', page);
        const res = await json(`${DRIVE}files?${q}`);
        out.push(...res.files);
        page = res.nextPageToken;
      } while (page);
      st.ids = {};
      out.forEach((f) => { st.ids[f.name] = f.id; });
      return { files: out, cursor: start.startPageToken };
    }
    let page = st.cursor, next = null;
    while (page) {
      const q = new URLSearchParams({ pageToken: page, spaces: 'appDataFolder', pageSize: '1000', includeRemoved: 'true', fields: `nextPageToken,newStartPageToken,changes(fileId,removed,file(${FIELDS},trashed))` });
      let res;
      try { res = await json(`${DRIVE}changes?${q}`); }
      catch (e) { if (e.status === 404 || e.status === 400) { st.cursor = null; return listChanges(); } throw e; }
      for (const c of res.changes) {
        if (c.removed || !c.file || c.file.trashed) {
          for (const [n, id] of Object.entries(st.ids)) if (id === c.fileId) delete st.ids[n];
          continue;
        }
        st.ids[c.file.name] = c.file.id;
        out.push(c.file);
      }
      page = res.nextPageToken;
      next = res.newStartPageToken || next;
    }
    return { files: out, cursor: next || st.cursor };
  }
  async function pool(items, n, fn) {
    let i = 0;
    const work = async () => { while (i < items.length) { const it = items[i++]; await fn(it); } };
    await Promise.all(Array.from({ length: Math.min(n, items.length) }, work));
  }

  /* ---------- one sync pass ---------- */
  async function pass() {
    // 1. bring in changes from other devices
    const { files, cursor } = await listChanges();
    const isNew = (f) => st.revs[f.name] !== String(f.version);
    const noteFiles = files.filter((f) => /^note-.+\.json$/.test(f.name) && isNew(f));
    const folderFile = files.find((f) => f.name === 'folders.json' && isNew(f));
    let changed = 0;
    await pool(noteFiles, 4, async (f) => {
      const b = await download(f.id);
      if (!b) return;
      let n;
      try { n = JSON.parse(await b.text()); } catch (err) { return; }
      st.revs[f.name] = String(f.version);
      if (!host.validNote(n)) return;
      if (applyRemote(n)) changed++;
    });
    if (folderFile) {
      const b = await download(folderFile.id);
      if (b) {
        try {
          const f = JSON.parse(await b.text());
          st.revs[folderFile.name] = String(folderFile.version);
          if (Array.isArray(f.list) && f.updated > host.foldersUpdated()) { host.setFolders(f.list, f.updated); st.foldersSynced = f.updated; changed++; }
        } catch (err) { /* ignore a damaged file */ }
      }
    }
    // settings and colour swatches: the most recent change wins
    const settingsFile = files.find((f) => f.name === 'settings.json' && isNew(f));
    if (settingsFile) {
      const b = await download(settingsFile.id);
      if (b) {
        try {
          const s = JSON.parse(await b.text());
          st.revs[settingsFile.name] = String(settingsFile.version);
          if (s && s.data && typeof s.data === 'object' && s.updated > host.settingsUpdated()) {
            host.setSettings(s.data, s.updated);
            st.settingsSynced = s.updated;
            changed++;
          }
        } catch (err) { /* ignore a damaged file */ }
      }
    }
    st.cursor = cursor;
    // pictures and recordings that other devices added
    const missing = [];
    for (const n of host.notes()) {
      if (n.deleted) continue;
      for (const id of host.blobIdsOf(n)) if (st.ids['blob-' + id] && !(await host.hasBlob(id))) missing.push(id);
    }
    await pool([...new Set(missing)], 3, async (id) => {
      const b = await download(st.ids['blob-' + id]);
      if (b) { await host.putBlob(id, b); st.blobs[id] = 1; changed++; }
    });
    if (changed) host.refresh();

    // 2. send this device's changes
    const dirty = host.notes().filter((n) => n.updated > (st.synced[n.id] || 0));
    for (const n of dirty) {
      if (!n.deleted) {
        for (const id of host.blobIdsOf(n)) {
          if (st.blobs[id] || st.ids['blob-' + id]) { st.blobs[id] = 1; continue; }
          const b = await host.getBlob(id);
          if (!b) continue;
          await upload('blob-' + id, b);
          st.blobs[id] = 1;
        }
      }
      const snap = host.serialize(n);
      await upload(`note-${n.id}.json`, new Blob([JSON.stringify(snap)], { type: 'application/json' }));
      st.synced[n.id] = snap.updated;
    }
    const fu = host.foldersUpdated();
    if (fu > st.foldersSynced) {
      await upload('folders.json', new Blob([JSON.stringify({ list: host.folders(), updated: fu })], { type: 'application/json' }));
      st.foldersSynced = fu;
    }
    // settings never changed here count as time 0; they are sent only if Drive has none yet,
    // so a new device doesn't replace the settings the other devices already share
    let su = host.settingsUpdated();
    if (su > st.settingsSynced || (!st.settingsSynced && !st.ids['settings.json'])) {
      su = su || 1;
      await upload('settings.json', new Blob([JSON.stringify({ data: host.settings(), updated: su })], { type: 'application/json' }));
      st.settingsSynced = su;
      if (host.settingsUpdated() < su) host.settingsSent(su);
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
    if (!navigator.onLine) { setStatus('offline', OFFLINE); return; }
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
        if (e.code === 'auth') setStatus('auth', 'Tap to sign in to Google again. Your changes are safe on this device.');
        else if (!navigator.onLine) setStatus('offline', OFFLINE);
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
      if (a && a.clientId) auth = { clientId: a.clientId, email: a.email, access: a.access, exp: a.exp };
      const s = await host.metaGet('sync-state');
      if (s) { st = Object.assign(fresh(), s); delete st.key; }
    } catch (e) { /* storage unavailable: sync stays off */ }
    try { await finishSignIn(); } catch (e) { host.toast('Google sign-in failed: ' + e.message); }
    if (!auth) { setStatus('off'); return; }
    // the hour-long pass ran out while the app was closed: renew it now (quick trip to Google)
    if (navigator.onLine && !(auth.access && auth.exp > Date.now() + 60000) && renew()) return;
    window.addEventListener('online', () => syncNow(false));
    window.addEventListener('offline', () => setStatus('offline', OFFLINE));
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') schedule(500); });
    setInterval(() => { if (document.visibilityState === 'visible') syncNow(false); }, 60000);
    if (status !== 'auth') setStatus(navigator.onLine ? 'ok' : 'offline', navigator.onLine ? '' : OFFLINE);
    schedule(800);
  }

  return {
    start, connect, disconnect,
    // resume after the pass ran out: sends everything first, then a quick trip to Google
    resume: () => { try { sessionStorage.removeItem('inkwell-renew'); } catch (e) { /* ignore */ } signIn(clientId(), true); },
    syncNow: () => syncNow(true),
    noteChanged: () => { if (auth && status !== 'auth') schedule(5000); },
    info: () => ({ connected: !!auth, status, detail, last: st.last, account: auth && auth.email, key: clientId(), redirect: redirectUri() }),
  };
};
