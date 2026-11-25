'use strict';
/* Inkwell handwritten maths: turns pen strokes into a math line like "y = h + (x sin(A))^2/(2g)".
   Offline: a small point-cloud matcher (the $P idea: stroke order and direction don't matter)
   plus layout rules for lines, fractions and powers. It learns from symbols the user teaches it.
   Online (optional): MyScript's recognition service with the user's own keys, which are
   stored only on the user's device. */
window.MathInk = (() => {
  const N = 40; // points per symbol cloud

  /* ---------- built-in symbol shapes (drawn in a 0..100 box) ---------- */
  const arc = (cx, cy, rx, ry, a0, a1, n = 14) => {
    const out = [];
    for (let i = 0; i <= n; i++) { const a = (a0 + (a1 - a0) * i / n) * Math.PI / 180; out.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); }
    return out;
  };
  const ln = (...p) => p;
  const T = [
    ['0', [arc(50, 50, 28, 46, 0, 360, 24)]],
    ['1', [ln([50, 0], [50, 100])]],
    ['1', [ln([32, 22], [52, 0], [52, 100])]],
    ['2', [[...arc(48, 30, 28, 28, 190, 380), [22, 100], [82, 100]]]],
    ['3', [[...arc(46, 26, 26, 24, 200, 450), ...arc(46, 74, 28, 26, 270, 520)]]],
    ['4', [ln([60, 0], [12, 66], [88, 66]), ln([66, 28], [66, 100])]],
    ['4', [ln([20, 0], [16, 60], [84, 60]), ln([70, 10], [70, 100])]],
    ['5', [[[76, 0], [26, 0], [22, 44], ...arc(46, 70, 30, 30, 240, 500)]]],
    ['5', [[[26, 0], [22, 44], ...arc(46, 70, 30, 30, 240, 500)], ln([26, 0], [76, 0])]],
    ['6', [[[72, 2], [50, 10], [32, 28], [23, 50], [22, 70]], arc(50, 72, 28, 27, 0, 360, 20)]],
    ['7', [ln([14, 0], [86, 0], [36, 100])]],
    ['8', [arc(50, 25, 24, 24, 0, 360, 18), arc(50, 74, 28, 26, 0, 360, 18)]],
    ['9', [arc(46, 28, 26, 26, 0, 360, 18), ln([72, 28], [66, 100])]],
    ['+', [ln([50, 8], [50, 92]), ln([8, 50], [92, 50])]],
    ['x', [ln([12, 10], [88, 90]), ln([88, 10], [12, 90])]],
    ['y', [ln([14, 0], [50, 55]), ln([86, 0], [30, 100])]],
    ['y', [[[14, 0], ...arc(40, 30, 26, 30, 180, 90, 6), [66, 0], [66, 80], ...arc(46, 80, 20, 20, 0, 150, 6)]]],
    ['A', [ln([8, 100], [50, 0], [92, 100]), ln([28, 60], [72, 60])]],
    ['a', [arc(44, 60, 30, 36, 0, 360, 20), ln([76, 26], [76, 96])]],
    ['b', [ln([22, 0], [22, 100]), arc(48, 72, 28, 27, 0, 360, 18)]],
    ['c', [arc(56, 50, 40, 48, -45, -315)]],
    ['g', [arc(44, 30, 28, 28, 0, 360, 18), [[74, 4], [74, 80], ...arc(50, 80, 24, 20, 0, 160, 8)]]],
    ['h', [ln([20, 0], [20, 100]), [...arc(50, 64, 30, 30, -180, 0), [80, 100]]]],
    ['i', [ln([50, 34], [50, 100]), ln([50, 8], [51, 10])]],
    ['n', [ln([20, 30], [20, 100]), [...arc(50, 62, 30, 32, -180, 0), [80, 100]]]],
    ['m', [ln([10, 30], [10, 100]), [...arc(30, 58, 20, 28, -180, 0), [50, 100]], [...arc(70, 58, 20, 28, -180, 0), [90, 100]]]],
    ['s', [[...arc(50, 28, 28, 24, -20, -270), ...arc(50, 72, 28, 26, -90, 160)]]],
    ['t', [ln([45, 0], [45, 88], [66, 100]), ln([16, 30], [80, 30])]],
    ['(', [arc(95, 50, 62, 52, 125, 235)]],
    [')', [arc(5, 50, 62, 52, -55, 55)]],
    ['/', [ln([82, 0], [18, 100])]],
    ['sqrt', [ln([0, 62], [16, 55], [36, 100], [56, 0], [100, 0])]],
    ['k', [ln([20, 0], [20, 100]), ln([80, 30], [22, 66], [82, 100])]],
    ['d', [arc(44, 66, 28, 30, 0, 360, 18), ln([74, 0], [74, 100])]],
    ['e', [[[18, 55], [82, 55], ...arc(50, 55, 32, 40, -10, -330)]]],
    ['p', [ln([22, 20], [22, 100]), arc(50, 40, 28, 22, 0, 360, 16)]],
    ['r', [[[22, 30], [22, 100]], [[22, 60], ...arc(52, 60, 30, 28, -180, -60, 6)]]],
    ['u', [[[18, 20], ...arc(48, 64, 30, 34, 180, 0, 10), [78, 20], [80, 100]]]],
    ['z', [ln([12, 4], [86, 4], [14, 96], [88, 96])]],
  ];

  /* ---------- point clouds ---------- */
  function cloud(strokes) {
    const pts = [];
    strokes.forEach((s, si) => s.forEach((p) => pts.push([p[0], p[1], si])));
    if (!pts.length) return [];
    // resample along each stroke to N points in total
    let L = 0;
    for (let i = 1; i < pts.length; i++) if (pts[i][2] === pts[i - 1][2]) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    const I = L / (N - 1) || 1;
    const out = [pts[0].slice(0, 2)];
    let D = 0;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      if (a[2] !== b[2]) { if (out.length < N) out.push(b.slice(0, 2)); continue; }
      let d = Math.hypot(b[0] - a[0], b[1] - a[1]);
      let ax = a[0], ay = a[1];
      while (D + d >= I && out.length < N) {
        const t = (I - D) / d;
        const qx = ax + t * (b[0] - ax), qy = ay + t * (b[1] - ay);
        out.push([qx, qy]);
        d -= I - D; ax = qx; ay = qy; D = 0;
      }
      D += d;
    }
    while (out.length < N) out.push(pts[pts.length - 1].slice(0, 2));
    // scale (keeping the shape's proportions) and centre
    let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
    out.forEach(([x, y]) => { x1 = Math.min(x1, x); y1 = Math.min(y1, y); x2 = Math.max(x2, x); y2 = Math.max(y2, y); });
    const sc = Math.max(x2 - x1, y2 - y1) || 1;
    let cx = 0, cy = 0;
    out.forEach((p) => { p[0] = (p[0] - x1) / sc; p[1] = (p[1] - y1) / sc; cx += p[0]; cy += p[1]; });
    cx /= out.length; cy /= out.length;
    out.forEach((p) => { p[0] -= cx; p[1] -= cy; });
    return out.slice(0, N);
  }
  function cloudDist(a, b, start) {
    const n = a.length, used = new Array(n).fill(false);
    let sum = 0, i = start;
    do {
      let min = Infinity, idx = -1;
      for (let j = 0; j < n; j++) {
        if (used[j]) continue;
        const d = (a[i][0] - b[j][0]) ** 2 + (a[i][1] - b[j][1]) ** 2;
        if (d < min) { min = d; idx = j; }
      }
      used[idx] = true;
      const w = 1 - ((i - start + n) % n) / n;
      sum += w * Math.sqrt(min);
      i = (i + 1) % n;
    } while (i !== start);
    return sum;
  }
  function match(a, b) {
    const step = Math.floor(Math.sqrt(N));
    let min = Infinity;
    for (let i = 0; i < N; i += step) min = Math.min(min, cloudDist(a, b, i), cloudDist(b, a, i));
    return min;
  }
  let builtIn = null;
  const learned = [];
  function templates() {
    if (!builtIn) builtIn = T.map(([sym, strokes]) => ({ sym, c: cloud(strokes), n: strokes.length }));
    return learned.concat(builtIn);
  }
  function classify(strokes) {
    const c = cloud(strokes);
    let best = null, bestD = Infinity, second = Infinity;
    for (const t of templates()) {
      let d = match(c, t.c);
      if (t.n !== strokes.length) d *= 1.12; // prefer shapes drawn with the same number of strokes
      if (t.user) d *= 0.9;
      if (d < bestD) { second = bestD; bestD = d; best = t.sym; } else if (d < second && t.sym !== best) second = d;
    }
    return { sym: best || '?', score: bestD };
  }

  /* ---------- layout ---------- */
  const box = (strokes) => {
    let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
    strokes.forEach((s) => s.forEach(([x, y]) => { x1 = Math.min(x1, x); y1 = Math.min(y1, y); x2 = Math.max(x2, x); y2 = Math.max(y2, y); }));
    return { x1, y1, x2, y2, w: x2 - x1, h: y2 - y1, cx: (x1 + x2) / 2, cy: (y1 + y2) / 2 };
  };
  const item = (s) => ({ s, b: box([s]) });
  const median = (a) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[s.length >> 1] : 0; };

  function splitLines(items) {
    const sorted = items.slice().sort((a, b) => a.b.y1 - b.b.y1);
    const lh = median(items.map((i) => i.b.h).filter((h) => h > 4)) || 30;
    const lines = [];
    let cur = null;
    for (const it of sorted) {
      if (cur && it.b.y1 < cur.y2 + lh * 0.25) { cur.items.push(it); cur.y2 = Math.max(cur.y2, it.b.y2); }
      else { cur = { items: [it], y2: it.b.y2 }; lines.push(cur); }
    }
    return lines.map((l) => l.items);
  }
  const isFlat = (b, ref) => b.h < Math.max(b.w * 0.28, 3) && b.w > ref * 0.3;

  function parseRegion(items, ref) {
    if (!items.length) return '';
    // a fraction bar: a flat stroke with writing both above and below it
    const bars = items.filter((it) => isFlat(it.b, ref) && it.b.w > ref * 0.8)
      .sort((a, b) => b.b.w - a.b.w);
    for (const bar of bars) {
      const inX = (it) => it !== bar && it.b.cx > bar.b.x1 - ref * 0.1 && it.b.cx < bar.b.x2 + ref * 0.1;
      const above = items.filter((it) => inX(it) && it.b.cy < bar.b.cy);
      const below = items.filter((it) => inX(it) && it.b.cy > bar.b.cy);
      if (!above.length || !below.length) continue;
      const nb = box(above.map((i) => i.s)), db = box(below.map((i) => i.s));
      if (bar.b.cy - nb.y2 > ref * 1.2 || db.y1 - bar.b.cy > ref * 1.2) continue;
      // two flat strokes on top of each other with nothing else is "=" not a fraction
      if (above.every((i) => isFlat(i.b, ref)) && below.every((i) => isFlat(i.b, ref))) continue;
      const used = new Set([bar, ...above, ...below]);
      const left = items.filter((it) => !used.has(it) && it.b.cx < bar.b.cx);
      const right = items.filter((it) => !used.has(it) && it.b.cx >= bar.b.cx);
      const wrap = (s) => (/^[\w.]+$/.test(s) ? s : `(${s})`);
      return parseRegion(left, ref) + `${wrap(parseRegion(above, ref))}/${wrap(parseRegion(below, ref))}` + parseRegion(right, ref);
    }
    return parseRow(items, ref);
  }

  function groupSymbols(items, ref) {
    const sorted = items.slice().sort((a, b) => a.b.x1 - b.b.x1);
    const syms = [];
    for (const it of sorted) {
      const tiny = it.b.w < ref * 0.18 && it.b.h < ref * 0.18;
      let host = null;
      for (let k = syms.length - 1; k >= Math.max(0, syms.length - 3); k--) {
        const g = syms[k].b, pad = ref * 0.08;
        const ov = Math.min(g.x2 + pad, it.b.x2 + pad) - Math.max(g.x1 - pad, it.b.x1 - pad);
        const minW = Math.min(g.w, it.b.w) + 2 * pad;
        if (ov > minW * 0.4 || (tiny && ov > -ref * 0.1 && it.b.y2 < g.y1 + g.h * 0.4)) { host = syms[k]; break; }
      }
      if (host) { host.strokes.push(it.s); host.b = box(host.strokes); }
      else syms.push({ strokes: [it.s], b: it.b });
    }
    return syms;
  }

  function symbolOf(g, ref, baseH) {
    const b = g.b, n = g.strokes.length;
    const flat = (bb) => bb.h < Math.max(bb.w * 0.3, 3);
    if (b.w < ref * 0.16 && b.h < ref * 0.16) return { sym: b.cy < g.mid - ref * 0.15 ? '*' : '.', dot: true };
    if (n === 1 && flat(b)) return { sym: '-' };
    if (n === 2) {
      const [p, q] = g.strokes.map((s) => box([s]));
      if (flat(p) && flat(q) && Math.abs(p.cy - q.cy) > Math.max(3, ref * 0.12)) return { sym: '=' };
    }
    // a small closed loop written high up is a degree sign
    if (n === 1 && b.h < baseH * 0.55 && b.y2 < g.mid) {
      const s0 = g.strokes[0], a = s0[0], z = s0[s0.length - 1];
      if (Math.hypot(a[0] - z[0], a[1] - z[1]) < Math.max(b.w, b.h) * 0.4) return { sym: '°' };
    }
    const r = classify(g.strokes);
    let sym = r.sym;
    // a small circle written high up is a degree sign
    if ((sym === '0' || sym === 'o') && b.h < baseH * 0.55 && b.y2 < g.mid) sym = '°';
    if (sym === 'x' && b.h < baseH * 0.4) sym = '*';
    return { sym, score: r.score };
  }

  const FUNCS = ['sqrt', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'log', 'ln', 'abs', 'exp', 'pi'];
  function joinTokens(toks) {
    // split letter runs into known function names and single-letter variables
    let out = '';
    let i = 0;
    while (i < toks.length) {
      const t = toks[i];
      if (/^[A-Za-z]$/.test(t.sym) && !t.sup) {
        let run = '';
        let j = i;
        while (j < toks.length && /^[A-Za-z]$/.test(toks[j].sym) && !toks[j].sup) run += toks[j++].sym;
        const parts = [];
        let k = 0;
        while (k < run.length) {
          const f = FUNCS.find((fn) => run.startsWith(fn, k));
          if (f) { parts.push(f); k += f.length; } else { parts.push(run[k]); k++; }
        }
        let piece = '';
        parts.forEach((p, idx) => {
          const prev = idx ? parts[idx - 1] : out.slice(-1);
          if (idx && !FUNCS.includes(prev)) piece += '*';
          else if (idx && FUNCS.includes(prev) && prev !== 'pi') piece += ' ';
          piece += p;
        });
        if (/[A-Za-z0-9)]$/.test(out) && /^[A-Za-z]/.test(piece) && /[A-Za-z]$/.test(out)) out += '*';
        out += piece;
        i = j;
        continue;
      }
      out += t.sym === 'sqrt' ? 'sqrt' : t.sym;
      i++;
    }
    return out.replace(/sqrt(?!\s*\()([\w.]+)/g, 'sqrt($1)');
  }
  function tidy(out) {
    return out
      .replace(/\s+/g, ' ')
      .replace(/ ?([=+\-]) ?/g, ' $1 ')
      .replace(/\( /g, '(').replace(/ \)/g, ')')
      .replace(/^ - /, '-').replace(/([=(]) - /g, '$1 -')
      .trim();
  }

  function parseRow(items, ref) {
    const syms = groupSymbols(items, ref);
    if (!syms.length) return '';
    const mainH = median(syms.filter((g) => !(g.b.w < ref * 0.16 && g.b.h < ref * 0.16)).map((g) => g.b.h)) || ref;
    // the line's middle, ignoring small raised bits
    const mid = median(syms.map((g) => g.b.cy));
    const toks = [];
    let prevBase = null;
    for (const g of syms) {
      g.mid = mid;
      const t = symbolOf(g, ref, mainH);
      // a power: smaller, and sitting above the middle of the thing before it
      if (prevBase && !t.dot && !'°=+-*'.includes(t.sym) && g.b.h < prevBase.h * 0.8 && g.b.y2 < prevBase.y1 + prevBase.h * 0.55) t.sup = true;
      toks.push(t);
      if (!t.sup) prevBase = g.b;
    }
    // collect raised runs into ^(…)
    const flat = [];
    for (let i = 0; i < toks.length; i++) {
      if (!toks[i].sup) { flat.push(toks[i]); continue; }
      const run = [];
      while (i < toks.length && toks[i].sup) run.push(toks[i++]);
      i--;
      const inner = joinTokens(run.map((r) => ({ sym: r.sym })));
      flat.push({ sym: inner.length === 1 ? `^${inner}` : `^(${inner})` });
    }
    return joinTokens(flat);
  }

  /** strokes: arrays of [x, y] points. Returns the recognised lines, top to bottom. */
  function recognize(strokes) {
    const items = strokes.filter((s) => s.length).map(item);
    if (!items.length) return [];
    const ref = median(items.map((i) => Math.max(i.b.w, i.b.h)).filter((v) => v > 3)) || 30;
    return splitLines(items).map((line) => {
      const lineRef = median(line.map((i) => Math.max(i.b.w, i.b.h)).filter((v) => v > 3)) || ref;
      return tidy(parseRegion(line, lineRef));
    }).filter(Boolean);
  }

  /** Teach a symbol: strokes of one symbol and what it means. */
  function learn(strokes, sym) {
    const t = { sym, c: cloud(strokes), n: strokes.length, user: true };
    learned.unshift(t);
    if (learned.length > 400) learned.pop();
    return { sym, strokes };
  }
  function loadLearned(list) {
    learned.length = 0;
    (list || []).forEach((t) => { if (t && t.sym && Array.isArray(t.strokes)) learned.push({ sym: t.sym, c: cloud(t.strokes), n: t.strokes.length, user: true }); });
  }

  /* ---------- online: MyScript (user's own keys) ---------- */
  async function hmacHex(key, msg) {
    const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(key), { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(msg));
    return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  async function recognizeOnline(strokes, keys) {
    if (!keys || !keys.app || !keys.hmac) throw new Error('No online keys');
    const b = box(strokes);
    const t0 = Date.now();
    const body = JSON.stringify({
      configuration: { lang: 'en_US', math: { mimeTypes: ['application/x-latex'], solver: { enable: false } } },
      xDPI: 96, yDPI: 96, contentType: 'Math',
      width: Math.ceil(b.x2 + 20), height: Math.ceil(b.y2 + 20),
      strokeGroups: [{ strokes: strokes.map((s, i) => ({ x: s.map((p) => Math.round(p[0] * 10) / 10), y: s.map((p) => Math.round(p[1] * 10) / 10), t: s.map((_, j) => t0 + i * 400 + j * 8), pointerType: 'PEN' })) }],
    });
    const r = await fetch('https://cloud.myscript.com/api/v4.0/iink/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/x-latex', applicationKey: keys.app, hmac: await hmacHex(keys.app + keys.hmac, body) },
      body,
    });
    if (!r.ok) throw new Error(r.status === 401 || r.status === 403 ? 'The online keys were not accepted' : 'Online recognition failed');
    return latexToPlain(await r.text());
  }

  /** LaTeX from the online service → the app's math syntax */
  function latexToPlain(tex) {
    let s = String(tex).trim().replace(/\\\\/g, '\n');
    const group = (str, i) => { // read {…} starting at i
      if (str[i] !== '{') return [str[i] || '', i + 1];
      let d = 0, j = i;
      for (; j < str.length; j++) { if (str[j] === '{') d++; else if (str[j] === '}' && --d === 0) break; }
      return [str.slice(i + 1, j), j + 1];
    };
    const conv = (str) => {
      let out = '';
      for (let i = 0; i < str.length;) {
        if (str.startsWith('\\frac', i) || str.startsWith('\\dfrac', i)) {
          i += str.startsWith('\\dfrac', i) ? 6 : 5;
          const [a, i2] = group(str, i); const [b2, i3] = group(str, i2);
          out += `(${conv(a)})/(${conv(b2)})`; i = i3; continue;
        }
        if (str.startsWith('\\sqrt', i)) {
          i += 5;
          const [a, i2] = group(str, i);
          out += `sqrt(${conv(a)})`; i = i2; continue;
        }
        if (str[i] === '^' || str[i] === '_') {
          const op = str[i];
          const [a, i2] = group(str, i + 1);
          const c = conv(a);
          if (op === '^') out += c === '\\circ' || c === '°' ? '°' : c.length === 1 ? `^${c}` : `^(${c})`;
          else out += c; // subscripts become part of the name
          i = i2; continue;
        }
        if (str[i] === '{' || str[i] === '}') { i++; continue; }
        out += str[i++];
      }
      return out;
    };
    s = s.replace(/\\left|\\right|\\,|\\;|\\!|\\quad/g, ' ')
      .replace(/\\(times|cdot)/g, '*').replace(/\\div/g, '/').replace(/\\pi/g, 'pi').replace(/\\circ/g, '°').replace(/\\degree/g, '°')
      .replace(/\\(sin|cos|tan|log|ln|exp|arcsin|arccos|arctan)/g, (m, f) => ' ' + ({ arcsin: 'asin', arccos: 'acos', arctan: 'atan' }[f] || f))
      .replace(/\\(mathrm|text|operatorname)\{([^}]*)\}/g, '$2')
      .replace(/\\begin\{[^}]*\}|\\end\{[^}]*\}|&/g, '');
    return conv(s).split('\n').map((l) => l.replace(/\^\{?\\?°\}?/g, '°').replace(/\s+/g, ' ').trim()).filter(Boolean);
  }

  return { recognize, recognizeOnline, latexToPlain, learn, loadLearned, symbols: () => [...new Set(T.map((t) => t[0]))] };
})();
