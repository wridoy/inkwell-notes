'use strict';
/* Inkwell Notes — handwriting, shapes, media and live math for PC and tablet. */
(() => {
  const PAGE_W = 1000;
  const PAGE_STEP = 1414; // one A4 page at 1000 units wide
  const FONT = '"Segoe UI", system-ui, -apple-system, Roboto, sans-serif';
  const PALETTE = [
    '#1c2430', '#5d6b7d', '#9aa6b4', '#ffffff', '#d1453b', '#e8743b', '#f2b01e', '#f6d743',
    '#2e9d57', '#5cc98a', '#0f9fa8', '#38b6e8', '#2f6fd0', '#1f3f8f', '#7b4fd6', '#c04fd6',
    '#e85a8c', '#f4a3b5', '#a8743f', '#6b4423', '#f7c59f', '#c9e4a6', '#a6d8f0', '#cdb8f0',
    '#000000', '#3b3f45', '#00a383', '#0b6e99', '#9b1c31', '#ff8a5b', '#b8e986', '#ffd6e7',
  ];
  const PEN_TYPES = [['fountain', 'Fountain pen'], ['ballpoint', 'Ballpoint pen'], ['calligraphy', 'Calligraphy pen'], ['pencil', 'Pencil'], ['brush', 'Brush']];
  const LINE_STYLES = [['solid', 'Solid'], ['taper', 'Tapered'], ['dash', 'Dashed'], ['dot', 'Dotted']];
  const TEXT_SIZES = [8, 10, 12, 14, 16, 17, 18, 20, 22, 24, 28, 32, 36, 40, 48, 56, 64, 72, 96];
  const HL_PALETTE = ['#fff176', '#ffd54f', '#b9f6ca', '#80d8ff', '#ff9ecb', '#e1bee7', '#ffcc80', '#cfd8dc'];
  const GRAPH_COLORS = ['#2f6fd0', '#d1453b', '#2e9d57', '#7b4fd6', '#e08a1e', '#0f9fa8'];
  const PAPERS = {
    white: { name: 'White', bg: '#ffffff', line: '#d6e3f0', margin: '#f0c4c4', dot: '#c3ccd8', grid: '#e6ebf1', major: '#d3dbe5', brk: '#c5ced9', dark: false },
    cream: { name: 'Cream', bg: '#fbf5e6', line: '#e4d8bd', margin: '#ecc1b3', dot: '#d6c9ab', grid: '#efe5cf', major: '#e0d2b4', brk: '#cdbf9f', dark: false },
    gray: { name: 'Grey', bg: '#e9ecf0', line: '#d0d7df', margin: '#e4b9b9', dot: '#b9c1cc', grid: '#dbe0e6', major: '#c9d0d9', brk: '#b5bec9', dark: false },
    dark: { name: 'Dark', bg: '#111315', line: '#2a3038', margin: '#5a2e2e', dot: '#3a414b', grid: '#20252b', major: '#2e353f', brk: '#3a424d', dark: true },
  };
  const TEMPLATES = [['lined', 'Lined'], ['grid', 'Grid'], ['dots', 'Dotted'], ['squared', 'Squared'], ['cornell', 'Cornell'], ['blank', 'Blank']];
  const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
  const PDFJS_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  const $ = (s, r = document) => r.querySelector(s);
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const now = () => Date.now();
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const r1 = (v) => Math.round(v * 10) / 10;
  const r2 = (v) => Math.round(v * 100) / 100;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const center = (pts) => ({ x: pts.reduce((s, p) => s + p.x, 0) / pts.length, y: pts.reduce((s, p) => s + p.y, 0) / pts.length });
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------------- icons ---------------- */
  const ICON = {
    cloud: 'M7 18h10.5a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.4 9.2 4.5 4.5 0 0 0 7 18z',
    select: 'M6 3l12 9-5.5 1.2L10 19z',
    lasso: 'M12 4c5 0 8.5 2.4 8.5 5.4S16.8 15 12 15s-8.5-2.6-8.5-5.6S7 4 12 4z M7.5 14c-1.3 1.6-1 3.6.8 4.4 1.4.7 1.6 1.9.7 2.9',
    keyboard: 'M3 6h18v12H3z M7 10h.01 M11 10h.01 M15 10h.01 M7 14h10',
    pen: 'M4 20l1.2-4.6L15.5 5.1a2.1 2.1 0 0 1 3 3L8.2 18.4z M13.5 7l3 3',
    highlighter: 'M3 21h8 M6 16l3 3 M6 16L15.5 5.5l3 3L9 19z',
    eraser: 'M8 20h12 M4.6 14.6l8.5-8.5a2 2 0 0 1 2.8 0l2.9 2.9a2 2 0 0 1 0 2.8L12 19H8.4z M9 10l5 5',
    text: 'M5 7V5h14v2 M12 5v14 M9 19h6',
    math: 'M4 4v16h16 M7 16c2.5-8 5-8 6-4s3 4 6-5',
    rect: 'M4 6h16v12H4z',
    ellipse: 'M3 12a9 6.5 0 1 0 18 0a9 6.5 0 1 0 -18 0',
    triangle: 'M12 4l9 15H3z',
    diamond: 'M12 3l9 9-9 9-9-9z',
    star: 'M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z',
    line: 'M5 19L19 5',
    arrow: 'M5 19L19 5 M11 5h8v8',
    undo: 'M9 5L4 10l5 5 M4 10h10a5 5 0 0 1 0 10h-3',
    redo: 'M15 5l5 5-5 5 M20 10H10a5 5 0 0 0 0 10h3',
    trash: 'M4 7h16 M10 11v6 M14 11v6 M6 7l1 13h10l1-13 M9 7V4h6v3',
    zoomIn: 'M12 5v14 M5 12h14',
    zoomOut: 'M5 12h14',
    grid: 'M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z',
    sortIcon: 'M4 6h10 M4 12h7 M4 18h4 M18 5v14 M15 16l3 3 3-3',
    fitWidth: 'M3 5v14 M21 5v14 M7 12h10 M10 9l-3 3 3 3 M14 9l3 3-3 3',
    menu: 'M4 6h16 M4 12h16 M4 18h16',
    plus: 'M12 5v14 M5 12h14',
    minus: 'M5 12h14',
    close: 'M6 6l12 12 M18 6L6 18',
    home: 'M4 12a8 8 0 1 0 2.3-5.7 M4 4v4h4',
    grip: 'M9 6h.01 M15 6h.01 M9 12h.01 M15 12h.01 M9 18h.01 M15 18h.01',
    resize: 'M20 14l-6 6 M20 8L8 20',
    edit: 'M4 20h4L19 9l-4-4L4 16z',
    full: 'M4 9V4h5 M20 9V4h-5 M4 15v5h5 M20 15v5h-5',
    book: 'M3 5h6a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H3z M21 5h-6a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h7z',
    pages: 'M5 3h10v14H5z M9 7h10v14H9z',
    style: 'M6 3h12v18H6z M9 8h6 M9 12h6 M9 16h3',
    share: 'M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M8.6 13.5l6.8 4 M15.4 6.5l-6.8 4',
    save: 'M5 3h11l3 3v15H5z M8 3v6h8V3 M8 21v-7h8v7',
    print: 'M7 9V3h10v6 M7 17H4v-6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6h-3 M7 14h10v7H7z',
    search: 'M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14 M20 20l-4-4',
    more: 'M5 12h.01 M12 12h.01 M19 12h.01',
    chevL: 'M15 6l-6 6 6 6',
    chevR: 'M9 6l6 6-6 6',
    image: 'M4 5h16v14H4z M4 16l5-5 4 4 3-3 4 4 M15 9h.01',
    camera: 'M4 8h3l2-3h6l2 3h3v11H4z M12 10a3.5 3.5 0 1 0 0 7a3.5 3.5 0 1 0 0-7',
    pdf: 'M6 3h9l4 4v14H6z M14 3v5h5 M9 13h6 M9 17h6',
    mic: 'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z M5 11a7 7 0 0 0 14 0 M12 18v3',
    copy: 'M8 8h12v12H8z M4 16V4h12',
    dup: 'M8 8h12v12H8z M4 16V4h12 M14 11v6 M11 14h6',
    addPage: 'M6 3h9l4 4v14H6z M12 10v7 M8.5 13.5h7',
    up: 'M12 19V5 M6 11l6-6 6 6',
    down: 'M12 5v14 M6 13l6 6 6-6',
    folder: 'M3 6h6l2 2h10v11H3z',
    file: 'M6 3h9l4 4v14H6z M14 3v5h5',
    all: 'M4 5h16 M4 12h16 M4 19h16',
    pen_fountain: 'M9 2h6v9l-3 11-3-11z M12 11v5 M9 7h6',
    pen_ballpoint: 'M10 2h4v14l-2 6-2-6z M10 12h4',
    pen_calligraphy: 'M9 2h6v10l-1 3h-4l-1-3z M10 15l2 7 2-7',
    pen_pencil: 'M10 2h4v15l-2 5-2-5z M10 17h4 M10 5h4',
    pen_brush: 'M10 2h4v9h-4z M9 11h6l-.5 4c0 3-1.2 5.5-2.5 7-1.3-1.5-2.5-4-2.5-7z',
    hl_chisel: 'M9 2h6v10l1 2v3h-8v-3l1-2z M9.5 17l1.5 5 2.5-3v-2',
    hl_round: 'M9 2h6v10l1 2v3h-8v-3l1-2z M10 17a2 2 0 0 0 4 0',
    eyedropper: 'M15.5 3.5l5 5-2.5 2.5-5-5z M13.5 8.5l-8 8V20h3.5l8-8',
    rectSel: 'M4 4h3 M10 4h4 M17 4h3v3 M20 10v4 M20 17v3h-3 M14 20h-4 M7 20H4v-3 M4 14v-4 M4 7V4',
    listCheck: 'M3.5 4.5h5v5h-5z M5 7l1 1 2-2 M11 7h10 M3.5 14.5h5v5h-5z M11 17h10',
    listBullet: 'M9 6h12 M9 12h12 M9 18h12 M4.5 6h.01 M4.5 12h.01 M4.5 18h.01',
    listNumber: 'M10 6h11 M10 12h11 M10 18h11 M4 4.5l1.5-1v5 M3.5 15a1.6 1.6 0 0 1 3 .2c0 1.3-3 2.3-3 3.8h3',
    alignLeft: 'M4 6h16 M4 10h10 M4 14h16 M4 18h10',
    alignCenter: 'M4 6h16 M7 10h10 M4 14h16 M7 18h10',
    alignRight: 'M4 6h16 M10 10h10 M4 14h16 M10 18h10',
    indent: 'M11 6h9 M11 10h9 M11 14h9 M4 18h16 M4 8.5l3.5 2.5L4 13.5',
    outdent: 'M11 6h9 M11 10h9 M11 14h9 M4 18h16 M7.5 8.5L4 11l3.5 2.5',
    chevDown: 'M6 9l6 6 6-6',
    eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6',
    eyeOff: 'M3 3l18 18 M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3 3.9 M6.6 6.6C3.7 8.4 2 12 2 12s3.5 7 10 7c1.9 0 3.5-.6 4.9-1.4 M9.9 9.9a3 3 0 0 0 4.2 4.2',
    lock: 'M6 11h12v9H6z M8.5 11V8a3.5 3.5 0 0 1 7 0v3',
    unlock: 'M6 11h12v9H6z M8.5 11V8a3.5 3.5 0 0 1 6.8-1.2',
    sliders: 'M4 7h9 M17 7h3 M15 5v4 M4 12h3 M11 12h9 M9 10v4 M4 17h11 M19 17h1 M17 15v4',
    tape: 'M3 10a5 5 0 1 0 10 0a5 5 0 1 0 -10 0 M8 10h.01 M10.5 14.3L20 18v-5l-7-2.5',
    restyle: 'M5 20l6-16h2l6 16 M8.2 14h7.6',
    zoomLock: 'M9.5 3a6.5 6.5 0 1 0 0 13a6.5 6.5 0 1 0 0-13 M14.2 14.2l2.3 2.3 M15 17.5h6v4.5h-6z M16.5 17.5V16a1.5 1.5 0 0 1 3 0v1.5',
  };
  const svg = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
  const SHAPES = [['rect', 'Rectangle'], ['ellipse', 'Ellipse'], ['triangle', 'Triangle'], ['diamond', 'Diamond'], ['star', 'Star'], ['line', 'Line'], ['arrow', 'Arrow']];
  const SHAPE_NAMES = { rect: 'rectangle', ellipse: 'ellipse', triangle: 'triangle', diamond: 'diamond', star: 'star', line: 'line', arrow: 'arrow', poly: 'shape' };
  const RAIL = [
    ['cursor', 'Cursor (K): scroll and use math cards without writing', 'select'], ['text', 'Text (T)', 'keyboard'], ['pen', 'Pen (P)', 'pen'], ['highlighter', 'Highlighter (H)', 'highlighter'],
    ['eraser', 'Eraser (E)', 'eraser'], ['select', 'Lasso select (V)', 'lasso'],
  ];
  const RAIL2 = [['tape', 'Tape (A)', 'tape'], ['restyle', 'Change style (C)', 'restyle'], ['shape', 'Shapes (R)', null], ['math', 'Math & graphs (M)', 'math']];
  const ALL_TOOLS = RAIL.concat(RAIL2).map((r) => r[0]);
  // Tape patterns (original designs): background colour plus a small repeating motif.
  const TAPE_PATTERNS = [
    { bg: '#cfe9f5', fg: '#3f7fa6', kind: 'plus' },
    { bg: '#fbf3d5', fg: '#c9b98a', kind: 'hstripe' },
    { bg: '#9fd3cf', fg: '#e9f6f4', kind: 'check' },
    { bg: '#c97f6a', fg: '#f6e3d9', kind: 'dots' },
    { bg: '#f9d3dc', fg: '#f19ab0', kind: 'grid' },
    { bg: '#4f7fd0', fg: '#a9c6f5', kind: 'vstripe' },
    { bg: '#4b4f7a', fg: '#f08fb5', kind: 'chevron' },
    { bg: '#6a4c93', fg: '#f6c76b', kind: 'wave' },
    { bg: '#21614f', fg: '#f2b84b', kind: 'arch' },
  ];
  const ACTIONS = [
    ['full', 'Full screen', 'full'], ['read', 'Reading mode', 'book'], ['pages', 'Page sorter', 'pages'], ['style', 'Note style', 'style'],
    ['insert', 'Insert', 'plus'], ['share', 'Share', 'share'], ['save', 'Save as file', 'save'], ['print', 'Print', 'print'], ['search', 'Search', 'search'],
  ];

  /* ---------------- storage ---------------- */
  const Store = (() => {
    let dbp = null;
    const open = () => dbp || (dbp = new Promise((res, rej) => {
      if (!window.indexedDB) { rej(new Error('IndexedDB unavailable')); return; }
      const r = indexedDB.open('inkwell', 2);
      r.onupgradeneeded = () => {
        const d = r.result;
        if (!d.objectStoreNames.contains('notes')) d.createObjectStore('notes', { keyPath: 'id' });
        if (!d.objectStoreNames.contains('meta')) d.createObjectStore('meta', { keyPath: 'key' });
        if (!d.objectStoreNames.contains('blobs')) d.createObjectStore('blobs', { keyPath: 'id' });
      };
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    }));
    const run = async (store, mode, fn) => {
      const d = await open();
      return new Promise((res, rej) => {
        const t = d.transaction(store, mode);
        const req = fn(t.objectStore(store));
        t.oncomplete = () => res(req ? req.result : undefined);
        t.onerror = () => rej(t.error);
        t.onabort = () => rej(t.error);
      });
    };
    return {
      all: (s) => run(s, 'readonly', (o) => o.getAll()),
      keys: (s) => run(s, 'readonly', (o) => o.getAllKeys()),
      get: (s, k) => run(s, 'readonly', (o) => o.get(k)),
      put: (s, v) => run(s, 'readwrite', (o) => o.put(v)),
      del: (s, k) => run(s, 'readwrite', (o) => o.delete(k)),
    };
  })();

  const prefs = (() => {
    let p = {};
    try { p = JSON.parse(localStorage.getItem('inkwell-prefs') || '{}') || {}; } catch (e) { p = {}; }
    return {
      get: (k, d) => (k in p ? p[k] : d),
      set: (k, v) => { p[k] = v; try { localStorage.setItem('inkwell-prefs', JSON.stringify(p)); } catch (e) { /* private mode */ } },
    };
  })();

  /* ---------------- state ---------------- */
  const S = {
    notes: [], folders: ['Personal', 'School', 'Work'], note: null, folder: prefs.get('view', 'folders'), query: '',
    sort: Object.assign({ by: 'updated', dir: 'desc' }, prefs.get('sort', {})), openFolders: prefs.get('openFolders', {}),
    tool: prefs.get('tool', 'pen'), shape: prefs.get('shape', 'rect'),
    colors: Object.assign({ pen: '#1c2430', highlighter: '#fff176', text: '#1c2430', shape: '#2f6fd0', tape: '#a6d8f0', restyle: '#d1453b' }, prefs.get('colors', {})),
    widths: Object.assign({ pen: 3, highlighter: 16, shape: 3, eraser: 30, tape: 34, restyle: 4 }, prefs.get('widths', {})),
    straighten: Object.assign({ pen: false, highlighter: false, tape: false }, prefs.get('straighten', {})),
    textStyle: Object.assign({ size: 20, bold: false, italic: false, underline: false, strike: false, bg: null, list: null, align: 'left', indent: 0 }, prefs.get('textStyle', {})),
    fill: prefs.get('fill', false), snap: prefs.get('snap', true), eraseMode: prefs.get('eraseMode', 'stroke'),
    penType: prefs.get('penType', 'fountain'), lineStyle: prefs.get('lineStyle', 'solid'),
    restylePen: prefs.get('restylePen', 'fountain'), restyleStyle: prefs.get('restyleStyle', 'solid'),
    hlOpacity: prefs.get('hlOpacity', 45), hlTip: prefs.get('hlTip', 'chisel'), favPens: prefs.get('favPens', []),
    eraseHlOnly: prefs.get('eraseHlOnly', false), lassoMode: prefs.get('lassoMode', 'lasso'), lassoPartial: prefs.get('lassoPartial', false),
    eraseTapeOnly: prefs.get('eraseTapeOnly', false), fitText: Object.assign({ highlighter: false, tape: false }, prefs.get('fitText', {})),
    tapeKind: prefs.get('tapeKind', 'pattern'), tapePattern: prefs.get('tapePattern', 0), zoomLock: prefs.get('zoomLock', false),
    penOnly: prefs.get('penOnly', false), penSeen: prefs.get('penSeen', false),
    panelOpen: false, reading: false,
    zoom: 1, autoFit: true, sel: [], undo: [], redo: [], storageOk: true,
  };
  if (!ALL_TOOLS.includes(S.tool)) S.tool = 'pen';

  const el = {
    folderList: $('#folderList'), noteList: $('#noteList'), search: $('#search'), title: $('#titleInput'), save: $('#saveState'),
    scroller: $('#scroller'), wrap: $('#pageWrap'), cv: $('#page'), ink: $('#ink'), layer: $('#cardLayer'), panel: $('#toolPanel'), rail: $('#rail'),
    toast: $('#toast'), installBtn: $('#installBtn'),
  };
  const ctx = el.cv.getContext('2d'); // paper and PDF pages, below math cards
  const ictx = el.ink.getContext('2d'); // handwriting, shapes, text and pictures, above math cards
  const mctx = document.createElement('canvas').getContext('2d');

  let toastTimer = 0;
  function toast(msg, ms = 2600) {
    el.toast.textContent = msg;
    el.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.toast.classList.remove('show'), ms);
  }
  const capture = (node, e) => { try { node.setPointerCapture(e.pointerId); } catch (_) { /* pointer already released */ } };

  /* ---------------- persistence ---------------- */
  const saveTimers = new Map();
  function setSave(t) { el.save.textContent = t; }
  function writeNote(note) {
    return Store.put('notes', note)
      .then(() => { if (!saveTimers.size) setSave('Saved'); if (Sync) Sync.noteChanged(); })
      .catch(() => { setSave('Not saved'); toast('Could not save — storage may be full.'); });
  }
  function persist(note) {
    if (!S.storageOk) { setSave('Not saved'); return; }
    setSave('Saving…');
    clearTimeout(saveTimers.get(note.id));
    saveTimers.set(note.id, setTimeout(() => { saveTimers.delete(note.id); writeNote(note); }, 350));
  }
  function flushSaves() {
    for (const [id, t] of saveTimers) {
      clearTimeout(t);
      saveTimers.delete(id);
      const n = S.notes.find((x) => x.id === id);
      if (n) writeNote(n);
    }
  }
  function persistFolders() {
    S.foldersUpdated = now();
    if (S.storageOk) Store.put('meta', { key: 'folders', list: S.folders, updated: S.foldersUpdated }).catch(() => {});
    if (Sync) Sync.noteChanged();
  }
  let sideTimer = 0;
  function touchNote() {
    S.note.updated = now();
    persist(S.note);
    clearTimeout(sideTimer);
    sideTimer = setTimeout(renderSidebar, 400);
  }

  /* ---------------- blobs (images, audio) ---------------- */
  const memBlobs = new Map();
  async function saveBlob(blob) {
    const id = 'b' + uid();
    if (S.storageOk) {
      try { await Store.put('blobs', { id, blob, created: now() }); return id; } catch (e) { /* fall back to memory */ }
    }
    memBlobs.set(id, blob);
    return id;
  }
  async function getBlob(id) {
    if (memBlobs.has(id)) return memBlobs.get(id);
    if (!S.storageOk) return null;
    try { const r = await Store.get('blobs', id); return r ? r.blob : null; } catch (e) { return null; }
  }
  const imgCache = new Map();
  function imageFor(id) {
    let im = imgCache.get(id);
    if (im) return im;
    im = new Image();
    im._state = 'loading';
    im._p = new Promise((res) => {
      im.onload = () => { im._state = 'ok'; requestRender(); res(); };
      im.onerror = () => { im._state = 'error'; requestRender(); res(); };
      im._res = res;
    });
    imgCache.set(id, im);
    getBlob(id).then((b) => {
      if (!b) { im._state = 'missing'; requestRender(); im._res(); return; }
      im.src = URL.createObjectURL(b);
    });
    return im;
  }
  const ensureImages = (n) => Promise.all(n.objects.filter((o) => o.type === 'image').map((o) => imageFor(o.blob)._p));
  function blobIdsOf(n) {
    const ids = [];
    n.objects.forEach((o) => { if (o.blob) ids.push(o.blob); });
    (n.recordings || []).forEach((r) => ids.push(r.blob));
    return ids;
  }
  function referencedBlobs() {
    const s = new Set();
    S.notes.filter((n) => !n.deleted).forEach((n) => blobIdsOf(n).forEach((id) => s.add(id)));
    (clip || []).forEach((o) => { if (o.blob) s.add(o.blob); });
    return s;
  }
  async function dropBlobs(candidates) {
    const refs = referencedBlobs();
    for (const id of candidates) {
      if (refs.has(id)) continue;
      memBlobs.delete(id);
      if (S.storageOk) await Store.del('blobs', id).catch(() => {});
    }
  }
  async function gcAllBlobs() {
    if (!S.storageOk) return;
    try { await dropBlobs(await Store.keys('blobs')); } catch (e) { /* ignore */ }
  }
  const blobToDataURL = (b) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(b); });
  const dataURLToBlob = (u) => fetch(u).then((r) => r.blob());

  /* ---------------- notes ---------------- */
  function makeNote(title, folder) {
    return {
      id: uid(), title: title || '', folder: folder || S.folders[0] || 'Personal', bg: 'lined', paper: 'white', height: PAGE_STEP,
      objects: [], cards: [], recordings: [], fav: false, trashed: 0, created: now(), updated: now(), deleted: false,
    };
  }
  function normalizeNote(n) {
    n.bg = n.bg || 'lined';
    n.paper = PAPERS[n.paper] ? n.paper : 'white';
    n.height = Math.max(PAGE_STEP, Math.ceil((n.height || PAGE_STEP) / PAGE_STEP - 0.02) * PAGE_STEP);
    n.recordings = Array.isArray(n.recordings) ? n.recordings : [];
    n.cards = Array.isArray(n.cards) ? n.cards : [];
    n.fav = !!n.fav;
    n.trashed = n.trashed || 0;
    return n;
  }
  function welcomeNote() {
    const n = makeNote('Welcome to Inkwell', S.folders[0]);
    const T = (x, y, size, text, extra) => Object.assign({ type: 'text', x, y, size, text, color: '#1c2430' }, extra);
    n.objects.push(
      T(60, 52, 34, 'Welcome to Inkwell', { bold: true }),
      T(60, 104, 18, 'Handwriting, shapes, pictures, PDFs and live math — on your PC and tablet.', { color: '#5d6b7d' }),
      T(60, 168, 17, 'Tools are on the right. Tap the active tool again to\nshow or hide its settings (colours, thickness, style).'),
      T(60, 236, 17, 'Pen: hold the pen still at the end of a stroke to snap\nit into a clean circle, box, triangle or line.'),
      T(60, 304, 17, 'Lasso: draw a loop around items to select them, then\nmove, resize, recolour, copy or delete them.'),
      T(60, 372, 17, 'Math: choose the graph tool and tap the page. Try\ny = x^2,  a = 2  (gets a slider)  or  15% of 80 ='),
      T(60, 440, 17, 'Insert pictures, PDFs and voice recordings from the\nInsert button at the top.'),
      T(60, 508, 17, 'Tablet: once you use the S Pen, fingers scroll and\npinch-zoom instead of drawing.', { bg: '#fff176' }),
      { type: 'shape', kind: 'rect', x1: 70, y1: 600, x2: 230, y2: 700, color: '#2f6fd0', width: 3, fill: true },
      { type: 'shape', kind: 'ellipse', x1: 280, y1: 595, x2: 400, y2: 705, color: '#d1453b', width: 3, fill: false },
      { type: 'shape', kind: 'arrow', x1: 240, y1: 770, x2: 460, y2: 680, color: '#2e9d57', width: 4, fill: false },
    );
    n.cards.push({ id: uid(), x: 540, y: 160, w: 410, gh: 260, lines: ['a = 1', 'y = a*sin(x)', 'y = x^2/4 - 2', 'sqrt(144) + 15% of 80 ='], view: { cx: 0, cy: 0, s: 32 } });
    return n;
  }
  const liveNotes = () => S.notes.filter((n) => !n.deleted && !n.trashed);
  const trashNotes = () => S.notes.filter((n) => !n.deleted && n.trashed);
  function noteText(n) {
    return [n.title, ...n.objects.filter((o) => o.type === 'text').map((o) => o.text), ...n.cards.flatMap((c) => c.lines), ...(n.recordings || []).map((r) => r.name)].join(' ').toLowerCase();
  }
  /* ---------------- folders (nested as "Parent/Child" paths) ---------------- */
  const SYS_VIEWS = ['all', 'fav', 'trash', 'folders'];
  const parentOf = (p) => (p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '');
  const leafOf = (p) => p.slice(p.lastIndexOf('/') + 1);
  const natCmp = (a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  // every folder, including parents that only exist because a subfolder names them
  function folderSet() {
    const s = new Set();
    const add = (f) => { while (f && !s.has(f)) { s.add(f); f = parentOf(f); } };
    S.folders.forEach(add);
    liveNotes().forEach((n) => add(n.folder));
    return s;
  }
  const isFolder = (p) => typeof p === 'string' && !SYS_VIEWS.includes(p) && folderSet().has(p);
  const childFolders = (parent, set = folderSet()) => [...set].filter((f) => parentOf(f) === parent).sort(natCmp);
  const inFolder = (n, p) => n.folder === p || n.folder.startsWith(p + '/');
  const folderLabel = (p) => p.split('/').join(' › ');
  const SORTS = [['title', 'Title'], ['created', 'Date created'], ['updated', 'Date modified']];
  function sortNotes(list) {
    const by = S.sort.by, dir = S.sort.dir === 'asc' ? 1 : -1;
    const key = (n) => (by === 'created' ? n.created || n.updated : n.updated);
    return list.sort((a, b) => dir * (by === 'title' ? natCmp(a.title || 'Untitled', b.title || 'Untitled') : key(a) - key(b)) || b.updated - a.updated);
  }
  function visibleNotes() {
    const q = S.query.trim().toLowerCase();
    let list;
    if (S.folder === 'trash') list = trashNotes();
    else if (S.folder === 'all') list = liveNotes();
    else if (S.folder === 'fav') list = liveNotes().filter((n) => n.fav);
    else if (S.folder === 'folders') list = q ? liveNotes() : [];
    else list = liveNotes().filter((n) => (q ? inFolder(n, S.folder) : n.folder === S.folder));
    list = list.filter((n) => !q || noteText(n).includes(q));
    return sortNotes(list);
  }
  function setView(key) {
    S.folder = key;
    prefs.set('view', key);
    if (isFolder(key)) { let p = parentOf(key); while (p) { S.openFolders[p] = true; p = parentOf(p); } prefs.set('openFolders', S.openFolders); }
    renderSidebar();
  }
  function fmtDate(t) {
    const d = new Date(t), n = new Date();
    if (d.toDateString() === n.toDateString()) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: d.getFullYear() === n.getFullYear() ? undefined : 'numeric' });
  }
  function iconBtn(cls, title, icon, fn) {
    const b = document.createElement('button');
    b.className = ('icon ' + cls).trim();
    b.title = title;
    b.setAttribute('aria-label', title);
    b.innerHTML = svg(icon);
    b.onclick = (e) => { e.stopPropagation(); fn(); };
    return b;
  }

  function renderSidebar() {
    const set = folderSet();
    const live = liveNotes();
    el.folderList.innerHTML = '';
    const mk = (key, label, count, icon, depth = 0, kids = false) => {
      const li = document.createElement('li');
      li.className = 'folder' + (S.folder === key ? ' active' : '') + (icon ? ' sys' : '') + (depth ? ' sub' : '');
      li.style.setProperty('--d', depth);
      if (depth) {
        const tw = document.createElement('button');
        tw.className = 'twisty' + (kids ? '' : ' none') + (S.openFolders[key] ? ' open' : '');
        tw.tabIndex = kids ? 0 : -1;
        tw.setAttribute('aria-label', S.openFolders[key] ? 'Collapse' : 'Expand');
        tw.innerHTML = kids ? svg(ICON.chevR) : '';
        tw.onclick = (e) => { e.stopPropagation(); if (!kids) return; S.openFolders[key] = !S.openFolders[key]; prefs.set('openFolders', S.openFolders); renderSidebar(); };
        li.append(tw);
      }
      const b = document.createElement('button');
      b.className = 'folder-btn';
      b.innerHTML = `<span class="fname">${svg(icon || ICON.folder)}<span></span></span><span class="count"></span>`;
      $('.fname span', b).textContent = label;
      $('.count', b).textContent = count;
      b.onclick = () => { setView(key); setLibrary(true); if (isNarrow()) setSidebar(false); };
      li.append(b);
      if (!icon && S.folder === key) {
        li.append(iconBtn('', 'Rename folder', ICON.edit, () => renameFolder(key)), iconBtn('danger', 'Delete folder', ICON.trash, () => deleteFolder(key)));
      }
      el.folderList.append(li);
    };
    mk('all', 'All notes', live.length, ICON.all);
    mk('fav', 'Favourites', live.filter((n) => n.fav).length, ICON.star);
    mk('folders', 'Folders', set.size, ICON.folder);
    const walk = (parent, depth) => childFolders(parent, set).forEach((f) => {
      const kids = childFolders(f, set).length > 0;
      mk(f, leafOf(f), live.filter((n) => inFolder(n, f)).length, null, depth, kids);
      if (kids && S.openFolders[f]) walk(f, depth + 1);
    });
    walk('', 1);
    mk('trash', 'Trash', trashNotes().length, ICON.trash);

    el.noteList.innerHTML = '';
    const list = visibleNotes();
    if (S.folder === 'trash' && list.length) {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.className = 'empty-trash';
      b.textContent = 'Empty Trash';
      b.onclick = emptyTrash;
      li.append(b);
      el.noteList.append(li);
    }
    if (!list.length) {
      const li = document.createElement('li');
      li.className = 'empty';
      li.textContent = S.query ? 'No notes match your search.' : S.folder === 'trash' ? 'Trash is empty. Deleted notes stay here for 30 days.' : S.folder === 'folders' ? 'Pick a folder to see its notes.' : 'No notes here yet.';
      el.noteList.append(li);
    }
    list.forEach((n) => {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.className = 'note-item' + (S.note && n.id === S.note.id ? ' active' : '');
      const t = document.createElement('span');
      t.className = 'ntitle';
      t.innerHTML = n.fav ? '<span class="nstar">★</span>' : '';
      t.append(document.createTextNode(n.title || 'Untitled'));
      const m = document.createElement('span');
      m.className = 'nmeta';
      m.textContent = n.trashed ? `Deleted ${fmtDate(n.trashed)}` : `${fmtDate(n.updated)} · ${folderLabel(n.folder)}`;
      b.append(t, m);
      b.onclick = () => { openNote(n); if (isNarrow()) setSidebar(false); };
      li.append(b);
      el.noteList.append(li);
    });
    if (libOpen) renderLibrary();
  }

  function askFolderName(title, start) {
    const name = (prompt(title, start || '') || '').trim();
    if (!name) return '';
    if (name.includes('/')) { toast('Folder names can\'t contain "/".'); return ''; }
    if (SYS_VIEWS.includes(name)) { toast('That folder name is reserved.'); return ''; }
    return name;
  }
  // a new folder goes inside the folder being viewed, or at the top level
  function newFolder(parent) {
    if (typeof parent !== 'string') parent = isFolder(S.folder) ? S.folder : '';
    const name = askFolderName(parent ? `New folder inside "${leafOf(parent)}"` : 'New folder name');
    if (!name) return;
    const path = parent ? `${parent}/${name}` : name;
    if (folderSet().has(path)) { toast('That folder already exists here.'); return; }
    S.folders = [...folderSet(), path];
    persistFolders();
    if (parent) { S.openFolders[parent] = true; prefs.set('openFolders', S.openFolders); }
    if (libOpen) renderSidebar(); else setView(path);
  }
  function renameFolder(old) {
    const name = askFolderName('Rename folder', leafOf(old));
    if (!name || name === leafOf(old)) return;
    const parent = parentOf(old), path = parent ? `${parent}/${name}` : name;
    if (folderSet().has(path)) { toast('That folder name is already used here.'); return; }
    const move = (f) => (f === old ? path : f.startsWith(old + '/') ? path + f.slice(old.length) : f);
    S.folders = [...folderSet()].map(move);
    S.notes.forEach((n) => { if (!n.deleted && move(n.folder) !== n.folder) { n.folder = move(n.folder); n.updated = now(); persist(n); } });
    const open = {};
    Object.keys(S.openFolders).forEach((k) => { open[move(k)] = S.openFolders[k]; });
    S.openFolders = open;
    prefs.set('openFolders', open);
    persistFolders();
    setView(move(S.folder));
  }
  function deleteFolder(name) {
    const set = folderSet();
    const rest = [...set].filter((f) => f !== name && !f.startsWith(name + '/'));
    if (!rest.length) { toast('You need at least one folder.'); return; }
    const parent = parentOf(name);
    const target = parent || rest.filter((f) => !f.includes('/')).sort(natCmp)[0] || rest[0];
    const inside = S.notes.filter((n) => !n.deleted && inFolder(n, name));
    const subs = set.size - rest.length - 1;
    const parts = [];
    if (subs) parts.push(`Its ${subs} subfolder(s) will be removed.`);
    if (inside.length) parts.push(`Its ${inside.length} note(s) will move to "${folderLabel(target)}".`);
    if (!confirm(`Delete folder "${leafOf(name)}"? ${parts.join(' ')}`.trim())) return;
    inside.forEach((n) => { n.folder = target; n.updated = now(); persist(n); });
    S.folders = rest;
    persistFolders();
    setView(S.folder === name || inFolder({ folder: S.folder }, name) ? parent || 'folders' : S.folder);
  }
  const folderForNew = () => (isFolder(S.folder) ? S.folder : S.note && !S.note.trashed && S.note.folder ? S.note.folder : [...folderSet()].sort(natCmp)[0] || 'Personal');

  /* ---------------- library (home screen: folders and note thumbnails) ---------------- */
  let libOpen = false;
  function setLibrary(on) {
    if (on === libOpen) { if (on) renderLibrary(); return; }
    libOpen = on;
    document.body.classList.toggle('lib-open', on);
    closeMenu();
    if (on) {
      closeTextEditor();
      if (S.panelOpen) setPanel(false);
      $('#libSearch').value = S.query;
      renderLibrary();
    } else if (S.note) {
      // the page was hidden: size it again now that it shows
      if (S.autoFit && !S.zoomLock) fitZoom();
      requestLayout();
      setTimeout(redrawGraphs, 0);
    }
  }
  function viewTitle(v) {
    return v === 'all' ? 'All notes' : v === 'fav' ? 'Favourites' : v === 'trash' ? 'Trash' : v === 'folders' ? 'Folders' : leafOf(v);
  }
  function renderLibrary() {
    if (!isFolder(S.folder) && !SYS_VIEWS.includes(S.folder)) S.folder = 'folders';
    const v = S.folder, q = S.query.trim();
    $('#libTitle').textContent = viewTitle(v);
    // breadcrumb: Folders › Course › EEE205
    const cr = $('#libCrumbs');
    cr.innerHTML = '';
    if (isFolder(v)) {
      const segs = v.split('/');
      const add = (label, key) => {
        const b = document.createElement('button');
        b.textContent = label;
        b.onclick = () => setView(key);
        cr.append(b, Object.assign(document.createElement('span'), { textContent: '›' }));
      };
      add('Folders', 'folders');
      segs.slice(0, -1).forEach((s, i) => add(s, segs.slice(0, i + 1).join('/')));
    }
    cr.hidden = !cr.childElementCount;
    $('#libNewFolder').hidden = !(v === 'folders' || isFolder(v));
    $('#libEmptyTrash').hidden = !(v === 'trash' && trashNotes().length);
    $('#libCreate').hidden = v === 'trash';
    $('#libImport').hidden = v === 'trash';
    $('#libBack').hidden = !S.note;
    $('#libSortLabel').textContent = SORTS.find((s) => s[0] === S.sort.by)[1];
    const dir = $('#libDir');
    dir.innerHTML = svg(S.sort.dir === 'asc' ? ICON.up : ICON.down);
    dir.title = S.sort.dir === 'asc' ? 'Ascending (tap for descending)' : 'Descending (tap for ascending)';
    dir.setAttribute('aria-label', dir.title);

    // folder tiles
    const fw = $('#libFolders');
    fw.innerHTML = '';
    const set = folderSet();
    let tiles = [];
    if (!q && (v === 'folders' || isFolder(v))) {
      tiles = childFolders(v === 'folders' ? '' : v, set);
      if (S.sort.by === 'title' && S.sort.dir === 'desc') tiles.reverse();
    }
    const live = liveNotes();
    tiles.forEach((f) => {
      const t = document.createElement('div');
      t.className = 'ftile';
      t.tabIndex = 0;
      t.setAttribute('role', 'button');
      const nNotes = live.filter((n) => inFolder(n, f)).length, nSubs = childFolders(f, set).length;
      t.title = `${nNotes} note(s)${nSubs ? `, ${nSubs} folder(s)` : ''}`;
      t.innerHTML = '<i class="ftab"></i><span class="fcount"></span><span class="fname2"></span>';
      $('.fcount', t).textContent = nNotes;
      $('.fname2', t).textContent = leafOf(f);
      const more = iconBtn('fmore dots-icon', 'Folder options', ICON.more, () => openMenu(more, (m) => folderMenu(m, f)));
      t.append(more);
      t.onclick = () => setView(f);
      t.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setView(f); } };
      t.oncontextmenu = (e) => { e.preventDefault(); openMenu(more, (m) => folderMenu(m, f)); };
      fw.append(t);
    });
    fw.hidden = !tiles.length;

    // note grid
    const grid = $('#libGrid');
    grid.innerHTML = '';
    const list = visibleNotes();
    list.forEach((n) => grid.append(noteTile(n)));
    const empty = $('#libEmpty');
    empty.hidden = !!(list.length || tiles.length);
    empty.textContent = q ? 'No notes match your search.'
      : v === 'trash' ? 'Trash is empty. Deleted notes stay here for 30 days.'
        : v === 'fav' ? 'No favourites yet. Tap the star on a note to add it here.'
          : v === 'folders' ? 'No folders yet. Tap "New folder" to make one.'
            : 'This folder is empty. Tap "Create note" to add one.';
    queueThumbs();
  }
  function noteTile(n) {
    const t = document.createElement('div');
    t.className = 'ntile' + (S.note === n ? ' current' : '');
    t.tabIndex = 0;
    t.setAttribute('role', 'button');
    t.dataset.id = n.id;
    t.innerHTML = '<div class="thumb"><img alt=""></div><div class="ncap"><span class="ntitle2"></span><span class="ndate"></span></div>';
    $('.ntitle2', t).textContent = (n.fav ? '★ ' : '') + (n.title || 'Untitled');
    const d = n.trashed ? n.trashed : S.sort.by === 'created' ? n.created || n.updated : n.updated;
    $('.ndate', t).textContent = (n.trashed ? 'Deleted ' : '') + fmtDate(d) + (S.folder === 'all' || S.folder === 'fav' || S.query.trim() ? ` · ${leafOf(n.folder)}` : '');
    const cached = thumbs.get(n.id);
    if (cached && cached.key === thumbKey(n)) $('img', t).src = cached.url;
    const more = iconBtn('nmore dots-icon', 'Note options', ICON.more, () => openMenu(more, (m) => noteMenu(m, n)));
    $('.thumb', t).append(more);
    const open = () => { if (n.trashed) { openMenu(more, (m) => noteMenu(m, n)); return; } openNote(n); };
    t.onclick = open;
    t.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } };
    t.oncontextmenu = (e) => { e.preventDefault(); openMenu(more, (m) => noteMenu(m, n)); };
    return t;
  }
  function folderMenu(m, f) {
    mItem(m, 'Open', ICON.folder, () => setView(f));
    mItem(m, 'New folder inside', ICON.plus, () => newFolder(f));
    mItem(m, 'Rename', ICON.edit, () => renameFolder(f));
    mSep(m);
    mItem(m, 'Delete folder', ICON.trash, () => deleteFolder(f), 'danger');
  }
  function noteMenu(m, n) {
    if (n.trashed) {
      mItem(m, 'Restore', ICON.undo, () => libRestore(n));
      mItem(m, 'Delete forever', ICON.trash, () => libPurge(n), 'danger');
      return;
    }
    mItem(m, 'Open', ICON.file, () => openNote(n));
    mItem(m, n.fav ? 'Remove from favourites' : 'Add to favourites', ICON.star, () => { n.fav = !n.fav; n.updated = now(); persist(n); if (n === S.note) updateFav(); renderSidebar(); });
    mItem(m, 'Rename', ICON.edit, () => {
      const t = prompt('Rename note', n.title || '');
      if (t == null) return;
      n.title = t.trim();
      n.updated = now();
      persist(n);
      if (n === S.note) el.title.value = n.title;
      renderSidebar();
    });
    mItem(m, 'Move to folder…', ICON.folder, () => setTimeout(() => openMoveMenu(n), 0));
    mSep(m);
    mItem(m, 'Move to Trash', ICON.trash, () => libTrash(n), 'danger');
  }
  function openMoveMenu(n) {
    const anchor = $(`.ntile[data-id="${n.id}"] .nmore`) || $('#libTitle');
    openMenu(anchor, (m) => {
      mLabel(m, `Move "${n.title || 'Untitled'}" to`);
      const set = folderSet();
      const walk = (parent, depth) => childFolders(parent, set).forEach((f) => {
        const b = mItem(m, leafOf(f), ICON.folder, () => {
          n.folder = f;
          n.updated = now();
          persist(n);
          renderSidebar();
          toast(`Moved to ${folderLabel(f)}`);
        }, n.folder === f ? 'on' : '');
        b.style.paddingLeft = 10 + depth * 16 + 'px';
        walk(f, depth + 1);
      });
      walk('', 0);
      m.classList.add('scroll');
    });
  }
  // Trash and restore from the library without leaving it
  function libTrash(n) {
    if (rec && rec.note === n) rec.mr.stop();
    n.trashed = now();
    n.updated = now();
    persist(n);
    if (n === S.note) { openNextAfter(n); setLibrary(true); }
    renderSidebar();
    toast('Moved to Trash', 2500);
  }
  function libRestore(n) {
    n.trashed = 0;
    n.updated = now();
    persist(n);
    renderSidebar();
    toast(`Restored to ${folderLabel(n.folder)}`);
  }
  async function libPurge(n) {
    await purgeNote(n, true);
    setLibrary(true);
    renderSidebar();
  }

  // thumbnails: the top of the first page, drawn once per version of the note
  const thumbs = new Map();
  const thumbKey = (n) => `${n.updated}|${n.paper}|${n.bg}`;
  let thumbBusy = false;
  async function queueThumbs() {
    if (thumbBusy) return;
    thumbBusy = true;
    try {
      for (;;) {
        if (!libOpen) break;
        const tile = [...document.querySelectorAll('#libGrid .ntile')].find((t) => {
          const n = S.notes.find((x) => x.id === t.dataset.id);
          const c = n && thumbs.get(n.id);
          return n && !(c && c.key === thumbKey(n) && $('img', t).src);
        });
        if (!tile) break;
        const n = S.notes.find((x) => x.id === tile.dataset.id);
        const key = thumbKey(n);
        let c = thumbs.get(n.id);
        if (!c || c.key !== key) {
          await ensureImages(n).catch(() => {});
          c = { key, url: drawThumb(n) };
          thumbs.set(n.id, c);
        }
        document.querySelectorAll(`#libGrid .ntile[data-id="${n.id}"] img`).forEach((im) => { im.src = c.url; });
        await new Promise((r) => setTimeout(r, 0));
      }
    } finally { thumbBusy = false; }
  }
  function drawThumb(n) {
    const px = 360, cv = document.createElement('canvas');
    cv.width = px;
    cv.height = px;
    const g = cv.getContext('2d');
    const s = px / PAGE_W;
    g.setTransform(s, 0, 0, s, 0, 0);
    const prevDark = paperDark;
    try {
      drawNoteTo(g, n, 0, PAGE_W, 3, false);
    } catch (e) { /* a damaged note still gets a blank tile */ }
    paperDark = prevDark;
    return cv.toDataURL('image/png');
  }
  function newNote() {
    const n = makeNote('', folderForNew());
    if (S.folder === 'fav') n.fav = true;
    if (S.folder === 'trash') S.folder = 'all';
    S.notes.push(n);
    persist(n);
    openNote(n);
    if (isNarrow()) setSidebar(false);
    el.title.focus();
  }
  function openNextAfter(n) {
    const next = visibleNotes().find((x) => x !== n) || liveNotes().find((x) => x !== n);
    if (next) openNote(next);
    else { const w = makeNote('', S.folders[0]); S.notes.push(w); persist(w); openNote(w); }
  }
  function trashNote() {
    const n = S.note;
    if (!n) return;
    if (n.trashed) { purgeNote(n, true); return; }
    if (rec && rec.note === n) rec.mr.stop();
    n.trashed = now();
    n.updated = now();
    persist(n);
    openNextAfter(n);
    toast('Moved to Trash. You can restore it from the Trash folder.', 3500);
  }
  function restoreNote(n) {
    n.trashed = 0;
    n.updated = now();
    persist(n);
    S.folder = 'all';
    openNote(n);
    toast('Note restored');
  }
  async function purgeNote(n, ask) {
    if (ask && !confirm(`Delete "${n.title || 'Untitled'}" forever? This can't be undone.`)) return;
    const ids = blobIdsOf(n);
    n.deleted = true;
    n.trashed = 0;
    n.objects = [];
    n.cards = [];
    n.recordings = [];
    n.updated = now();
    persist(n);
    if (S.note === n) openNextAfter(n);
    else renderSidebar();
    await dropBlobs(ids);
  }
  async function emptyTrash() {
    const list = trashNotes();
    if (!list.length || !confirm(`Delete ${list.length} note(s) in the Trash forever?`)) return;
    for (const n of list) await purgeNote(n, false);
    renderSidebar();
    toast('Trash emptied');
  }
  function openNote(n) {
    if (libOpen) { libOpen = false; document.body.classList.remove('lib-open'); }
    closeTextEditor();
    closeMenu();
    normalizeNote(n);
    S.note = n;
    S.sel = [];
    S.undo = [];
    S.redo = [];
    action = null;
    el.title.value = n.title;
    prefs.set('lastNote', n.id);
    $('#trashBanner').hidden = !n.trashed;
    updateFav();
    renderSidebar();
    fitZoom();
    el.scroller.scrollTop = 0;
    el.scroller.scrollLeft = 0;
    renderCards();
    renderRecordings();
    updateRail();
    renderPanel();
    layoutCanvas();
  }
  function updateFav() {
    const b = $('#favBtn');
    if (!b || !S.note) return;
    b.classList.toggle('on', !!S.note.fav);
    b.setAttribute('aria-pressed', String(!!S.note.fav));
    b.title = S.note.fav ? 'Remove from favourites' : 'Add to favourites';
  }

  /* ---------------- history ---------------- */
  function snapshot() { return JSON.stringify({ o: S.note.objects, c: S.note.cards, h: S.note.height }); }
  function pushHistory(snap) {
    S.undo.push(snap || snapshot());
    if (S.undo.length > 80) S.undo.shift();
    S.redo.length = 0;
    updateRail();
  }
  function restore(snap) {
    const d = JSON.parse(snap);
    S.note.objects = d.o;
    S.note.cards = d.c;
    if (d.h) S.note.height = d.h;
    S.sel = [];
    touchNote();
    applyZoomSize();
    renderCards();
    layoutCanvas();
    updateRail();
    if (S.tool === 'select') renderPanel();
  }
  function undo() { if (!S.undo.length) return; closeTextEditor(); S.redo.push(snapshot()); restore(S.undo.pop()); }
  function redo() { if (!S.redo.length) return; closeTextEditor(); S.undo.push(snapshot()); restore(S.redo.pop()); }

  /* ---------------- zoom & layout ---------------- */
  let view = { x0: 0, y0: 0, w: 1, h: 1 };
  let dpr = 1;
  function applyZoomSize() {
    const z = S.zoom;
    el.wrap.style.width = PAGE_W * z + 'px';
    el.wrap.style.height = S.note.height * z + 'px';
    el.layer.style.width = PAGE_W + 'px';
    el.layer.style.height = S.note.height + 'px';
    el.layer.style.transform = `scale(${z})`;
    $('#zoomLabel').textContent = Math.round(z * 100) + '%';
  }
  function fitZoom() {
    const avail = el.scroller.clientWidth - (isNarrow() ? 24 : 48);
    S.zoom = clamp(avail / PAGE_W, 0.3, 1.5);
    S.autoFit = true;
    applyZoomSize();
  }
  // the page fills the window's width exactly (no upper cap, unlike the automatic fit)
  function fitWidth() {
    if (S.zoomLock) { toast('Zoom is locked. Tap the zoom lock button to unlock it.'); return; }
    const avail = el.scroller.clientWidth - (isNarrow() ? 24 : 48);
    const sr = el.scroller.getBoundingClientRect();
    setZoom(avail / PAGE_W, sr.left, sr.top + sr.height / 2);
    S.autoFit = true;
    el.scroller.scrollLeft = 0;
    layoutCanvas();
  }
  // tap the % to type an exact zoom
  function editZoom() {
    const lab = $('#zoomLabel');
    if (S.zoomLock) { toast('Zoom is locked. Tap the zoom lock button to unlock it.'); return; }
    if ($('#zoomInput')) return;
    const inp = document.createElement('input');
    inp.id = 'zoomInput';
    inp.type = 'text';
    inp.inputMode = 'numeric';
    inp.setAttribute('aria-label', 'Zoom percent (25 to 400)');
    inp.value = String(Math.round(S.zoom * 100));
    lab.hidden = true;
    lab.after(inp);
    inp.focus();
    inp.select();
    let done = false;
    const finish = (apply) => {
      if (done) return;
      done = true;
      const v = parseFloat(inp.value.replace(',', '.'));
      inp.remove();
      lab.hidden = false;
      if (!apply) return;
      if (!isFinite(v) || v <= 0) { toast('Type a zoom between 25 and 400.'); return; }
      setZoom(clamp(v, 25, 400) / 100);
    };
    inp.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') { e.preventDefault(); finish(true); }
      else if (e.key === 'Escape') { e.preventDefault(); finish(false); }
    });
    inp.addEventListener('blur', () => finish(true));
  }
  function setZoom(z, cx, cy) {
    if (S.zoomLock) return;
    z = clamp(z, 0.25, 4);
    S.autoFit = false;
    if (Math.abs(z - S.zoom) < 1e-4) return;
    const r = el.wrap.getBoundingClientRect();
    if (cx == null) {
      const sr = el.scroller.getBoundingClientRect();
      cx = sr.left + sr.width / 2;
      cy = sr.top + sr.height / 2;
    }
    const px = (cx - r.left) / S.zoom, py = (cy - r.top) / S.zoom;
    S.zoom = z;
    applyZoomSize();
    const rb = el.wrap.getBoundingClientRect();
    el.scroller.scrollLeft += rb.left + px * z - cx;
    el.scroller.scrollTop += rb.top + py * z - cy;
    layoutCanvas();
    redrawGraphs();
  }
  function layoutCanvas() {
    if (!S.note) return;
    const z = S.zoom;
    const sl = el.scroller.scrollLeft - el.wrap.offsetLeft, st = el.scroller.scrollTop - el.wrap.offsetTop;
    const W = PAGE_W * z, H = S.note.height * z;
    const x0 = clamp(sl, 0, W), y0 = clamp(st, 0, H);
    const x1 = clamp(sl + el.scroller.clientWidth, 0, W), y1 = clamp(st + el.scroller.clientHeight, 0, H);
    view = { x0, y0, w: Math.max(1, x1 - x0), h: Math.max(1, y1 - y0) };
    dpr = Math.min(window.devicePixelRatio || 1, 3);
    const pw = Math.max(1, Math.round(view.w * dpr)), ph = Math.max(1, Math.round(view.h * dpr));
    for (const c of [el.cv, el.ink]) {
      const s = c.style;
      s.left = x0 + 'px';
      s.top = y0 + 'px';
      s.width = view.w + 'px';
      s.height = view.h + 'px';
      if (c.width !== pw) c.width = pw;
      if (c.height !== ph) c.height = ph;
    }
    render();
  }
  let layoutPending = false;
  function requestLayout() {
    if (layoutPending) return;
    layoutPending = true;
    requestAnimationFrame(() => { layoutPending = false; layoutCanvas(); });
  }
  let renderPending = false;
  function requestRender() {
    if (renderPending) return;
    renderPending = true;
    requestAnimationFrame(() => { renderPending = false; render(); });
  }
  function autoGrow(y) {
    if (y > S.note.height - 150) {
      S.note.height += PAGE_STEP;
      applyZoomSize();
      requestLayout();
    }
  }
  function addPage() {
    pushHistory();
    S.note.height += PAGE_STEP;
    touchNote();
    applyZoomSize();
    layoutCanvas();
    el.scroller.scrollTo({ top: (S.note.height - PAGE_STEP) * S.zoom + el.wrap.offsetTop - 12, behavior: 'smooth' });
    toast(`Page ${pageCount(S.note)} added`);
  }
  function visibleCenter() {
    const r = el.wrap.getBoundingClientRect(), sr = el.scroller.getBoundingClientRect();
    return { x: clamp((sr.left + sr.width / 2 - r.left) / S.zoom, 40, PAGE_W - 40), y: clamp((sr.top + sr.height / 2 - r.top) / S.zoom, 40, S.note.height - 40) };
  }

  /* ---------------- geometry ---------------- */
  function ptsBox(pts) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of pts) {
      if (p[0] < x0) x0 = p[0];
      if (p[0] > x1) x1 = p[0];
      if (p[1] < y0) y0 = p[1];
      if (p[1] > y1) y1 = p[1];
    }
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }
  function boxOf(o) {
    if (o.pts) return ptsBox(o.pts);
    return { x: Math.min(o.x1, o.x2), y: Math.min(o.y1, o.y2), w: Math.abs(o.x2 - o.x1), h: Math.abs(o.y2 - o.y1) };
  }
  const textFont = (o) => `${o.italic ? 'italic ' : ''}${o.bold ? '700' : '400'} ${o.size}px ${FONT}`;
  function textLayout(o) {
    mctx.font = textFont(o);
    const lines = o.text.split('\n');
    const widths = lines.map((l) => mctx.measureText(l).width);
    return {
      lines, widths, maxW: Math.max(4, ...widths), lh: o.size * 1.3,
      mw: o.list ? o.size * 1.6 : 0, ix: (o.indent || 0) * o.size * 1.6,
    };
  }
  function textBox(o) {
    const L = textLayout(o);
    return { x: o.x, y: o.y, w: L.ix + L.mw + L.maxW, h: L.lines.length * L.lh };
  }
  function bbox(o) {
    if (o.type === 'text') return textBox(o);
    if (o.type === 'image') return { x: o.x, y: o.y, w: o.w, h: o.h };
    const b = boxOf(o);
    const pad = (o.width || 2) / 2;
    return { x: b.x - pad, y: b.y - pad, w: b.w + pad * 2, h: b.h + pad * 2 };
  }
  function outline(o) {
    const { x, y, w, h } = boxOf(o);
    switch (o.kind) {
      case 'rect': return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
      case 'triangle': return [[x + w / 2, y], [x + w, y + h], [x, y + h]];
      case 'diamond': return [[x + w / 2, y], [x + w, y + h / 2], [x + w / 2, y + h], [x, y + h / 2]];
      case 'star': {
        const pts = [];
        for (let i = 0; i < 10; i++) {
          const r = i % 2 ? 0.42 : 1, a = -Math.PI / 2 + (i * Math.PI) / 5;
          pts.push([x + w / 2 + Math.cos(a) * (w / 2) * r, y + h / 2 + Math.sin(a) * (h / 2) * r]);
        }
        return pts;
      }
      case 'ellipse': {
        const pts = [];
        for (let i = 0; i < 48; i++) {
          const a = (i / 48) * Math.PI * 2;
          pts.push([x + w / 2 + (Math.cos(a) * w) / 2, y + h / 2 + (Math.sin(a) * h) / 2]);
        }
        return pts;
      }
      case 'poly': return o.pts;
      default: return [[o.x1, o.y1], [o.x2, o.y2]];
    }
  }
  function segDist(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
    const t = L ? clamp(((px - ax) * dx + (py - ay) * dy) / L, 0, 1) : 0;
    return Math.hypot(px - ax - t * dx, py - ay - t * dy);
  }
  function nearPoly(pts, x, y, tol, closed) {
    if (pts.length === 1) return Math.hypot(x - pts[0][0], y - pts[0][1]) <= tol;
    const n = pts.length;
    for (let i = 1; i < n + (closed ? 1 : 0); i++) {
      const a = pts[i - 1], b = pts[i % n];
      if (segDist(x, y, a[0], a[1], b[0], b[1]) <= tol) return true;
    }
    return false;
  }
  function hits(o, x, y, tol, strict) {
    const b = bbox(o);
    if (x < b.x - tol || x > b.x + b.w + tol || y < b.y - tol || y > b.y + b.h + tol) return false;
    if (o.type === 'text' || o.type === 'image') return true;
    const t = tol + (o.width || 2) / 2;
    if (o.type === 'stroke') return nearPoly(o.pts, x, y, t, false);
    if (o.kind === 'line' || o.kind === 'arrow') return segDist(x, y, o.x1, o.y1, o.x2, o.y2) <= t;
    if (!strict || o.fill) return true;
    return nearPoly(outline(o), x, y, t, true);
  }
  function topHit(x, y, tol) {
    const a = S.note.objects;
    for (let i = a.length - 1; i >= 0; i--) if (!a[i].locked && hits(a[i], x, y, tol, false)) return a[i];
    return null;
  }
  function mapPts(o, f) {
    if (o.pts) o.pts = o.pts.map((p) => { const q = f(p[0], p[1]); return p.length > 2 ? [r1(q[0]), r1(q[1]), p[2]] : [r1(q[0]), r1(q[1])]; });
    if (o.type === 'shape' && !o.pts) {
      const a = f(o.x1, o.y1), b = f(o.x2, o.y2);
      o.x1 = r1(a[0]); o.y1 = r1(a[1]); o.x2 = r1(b[0]); o.y2 = r1(b[1]);
    }
    if (o.type === 'text') { const a = f(o.x, o.y); o.x = r1(a[0]); o.y = r1(a[1]); }
    if (o.type === 'image') {
      const a = f(o.x, o.y), b = f(o.x + o.w, o.y + o.h);
      o.x = r1(Math.min(a[0], b[0])); o.y = r1(Math.min(a[1], b[1]));
      o.w = r1(Math.abs(b[0] - a[0])); o.h = r1(Math.abs(b[1] - a[1]));
    }
    return o;
  }
  function hexA(hex, a) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
    if (!m) return hex;
    const n = parseInt(m[1], 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }
  function lum(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
    if (!m) return 0.5;
    const n = parseInt(m[1], 16);
    return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
  }
  // Ink that would vanish on the current paper is shown in the opposite tone, like dark-mode notebooks do.
  let paperDark = false, onCard = false;
  function ink(c) {
    if (paperDark && !onCard && lum(c) < 0.2) return '#e9edf2';
    if (!paperDark && lum(c) > 0.94) return '#1c2430';
    return c;
  }
  const pageCount = (n) => Math.max(1, Math.round(n.height / PAGE_STEP));
  const pageOfY = (y) => clamp(Math.floor(y / PAGE_STEP), 0, pageCount(S.note) - 1);
  const pageOfObj = (o) => { const b = bbox(o); return pageOfY(b.y + b.h / 2); };
  function inPoly(x, y, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  function selBox() {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const o of S.sel) {
      const b = bbox(o);
      x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x + b.w); y1 = Math.max(y1, b.y + b.h);
    }
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }

  /* ---------------- shape recognition (hold to snap) ---------------- */
  function rdp(pts, eps) {
    if (pts.length < 3) return pts.slice();
    let idx = -1, md = 0;
    const a = pts[0], b = pts[pts.length - 1];
    for (let i = 1; i < pts.length - 1; i++) {
      const d = segDist(pts[i][0], pts[i][1], a[0], a[1], b[0], b[1]);
      if (d > md) { md = d; idx = i; }
    }
    if (md <= eps) return [a, b];
    const l = rdp(pts.slice(0, idx + 1), eps), r = rdp(pts.slice(idx), eps);
    return l.slice(0, -1).concat(r);
  }
  function recognize(raw) {
    const pts = raw.map((p) => [p[0], p[1]]);
    if (pts.length < 6) return null;
    const b = ptsBox(pts);
    const diag = Math.hypot(b.w, b.h);
    if (diag < 24) return null;
    let L = 0;
    for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    const a = pts[0], z = pts[pts.length - 1];
    const chord = Math.hypot(z[0] - a[0], z[1] - a[1]);
    let maxDev = 0;
    for (const p of pts) maxDev = Math.max(maxDev, segDist(p[0], p[1], a[0], a[1], z[0], z[1]));
    if (chord / L > 0.9 && maxDev < Math.max(5, chord * 0.07)) return { kind: 'line', x1: r1(a[0]), y1: r1(a[1]), x2: r1(z[0]), y2: r1(z[1]) };
    if (chord > diag * 0.3) return null;
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    const rs = pts.map((p) => Math.hypot((p[0] - cx) / Math.max(b.w / 2, 1), (p[1] - cy) / Math.max(b.h / 2, 1)));
    const mean = rs.reduce((s, v) => s + v, 0) / rs.length;
    const cv = Math.sqrt(rs.reduce((s, v) => s + (v - mean) ** 2, 0) / rs.length) / mean;
    const poly = rdp(pts.concat([pts[0]]), diag * 0.07).slice(0, -1);
    for (let changed = true; changed && poly.length > 2;) {
      changed = false;
      for (let i = 0; i < poly.length && poly.length > 2; i++) {
        const p = poly[(i - 1 + poly.length) % poly.length], c = poly[i], n = poly[(i + 1) % poly.length];
        const close = Math.hypot(c[0] - n[0], c[1] - n[1]) < diag * 0.12;
        const a1 = Math.atan2(c[1] - p[1], c[0] - p[0]), a2 = Math.atan2(n[1] - c[1], n[0] - c[0]);
        let turn = Math.abs(a2 - a1);
        if (turn > Math.PI) turn = 2 * Math.PI - turn;
        if (close || turn < 0.45) { poly.splice(i, 1); changed = true; break; }
      }
    }
    const n = poly.length;
    if (n >= 5 || (n < 3 && cv < 0.12)) return cv < 0.2 ? { kind: 'ellipse', x1: r1(b.x), y1: r1(b.y), x2: r1(b.x + b.w), y2: r1(b.y + b.h) } : null;
    if (n === 4) {
      const axis = poly.every((p, i) => {
        const q = poly[(i + 1) % 4];
        const ang = Math.abs(Math.atan2(q[1] - p[1], q[0] - p[0])) % (Math.PI / 2);
        return ang < 0.26 || ang > Math.PI / 2 - 0.26;
      });
      if (axis) return { kind: 'rect', x1: r1(b.x), y1: r1(b.y), x2: r1(b.x + b.w), y2: r1(b.y + b.h) };
      return { kind: 'poly', pts: poly.map((p) => [r1(p[0]), r1(p[1])]) };
    }
    if (n === 3) return { kind: 'poly', pts: poly.map((p) => [r1(p[0]), r1(p[1])]) };
    return null;
  }
  const shapeName = (o) => (o.kind === 'poly' ? (o.pts.length === 3 ? 'triangle' : 'shape') : SHAPE_NAMES[o.kind] || 'shape');

  /* ---------------- drawing ---------------- */
  function drawPaper(c, n, vx, vy, vw, vh, lw = 1) {
    const th = PAPERS[n.paper] || PAPERS.white;
    c.fillStyle = th.bg;
    c.fillRect(vx, vy, vw, vh);
    const x1 = vx + vw, y1 = vy + vh;
    c.lineWidth = lw;
    const p0 = Math.max(0, Math.floor(vy / PAGE_STEP)), p1 = Math.min(pageCount(n) - 1, Math.floor(y1 / PAGE_STEP));
    for (let p = p0; p <= p1; p++) {
      const top = p * PAGE_STEP, bot = top + PAGE_STEP;
      const ya = Math.max(vy, top), yb = Math.min(y1, bot);
      const hline = (y, color, w = lw) => { if (y < ya || y > yb) return; c.strokeStyle = color; c.lineWidth = w; c.beginPath(); c.moveTo(vx, y); c.lineTo(x1, y); c.stroke(); };
      const vline = (x, a, b, color, w = lw) => { const s = Math.max(a, ya), e = Math.min(b, yb); if (s >= e) return; c.strokeStyle = color; c.lineWidth = w; c.beginPath(); c.moveTo(x, s); c.lineTo(x, e); c.stroke(); };
      if (n.bg === 'lined' || n.bg === 'cornell') {
        c.strokeStyle = th.line;
        c.lineWidth = lw;
        c.beginPath();
        for (let y = top + 96; y <= bot - 48; y += 34) if (y >= ya && y <= yb) { c.moveTo(vx, y); c.lineTo(x1, y); }
        c.stroke();
        if (n.bg === 'lined') vline(72, top, bot, th.margin);
        else {
          hline(top + 62, th.major, lw * 2);
          vline(250, top + 62, bot - 300, th.margin, lw * 1.5);
          hline(bot - 300, th.major, lw * 2);
        }
      } else if (n.bg === 'grid' || n.bg === 'squared') {
        const g = n.bg === 'grid' ? 25 : 12;
        c.beginPath();
        for (let x = Math.floor(vx / g) * g; x <= x1; x += g) if (n.bg === 'grid' || x % 60) { c.moveTo(x, ya); c.lineTo(x, yb); }
        for (let y = top + Math.ceil(Math.max(0, ya - top) / g) * g; y <= yb; y += g) if (n.bg === 'grid' || (y - top) % 60) { c.moveTo(vx, y); c.lineTo(x1, y); }
        c.strokeStyle = th.grid;
        c.lineWidth = lw;
        c.stroke();
        if (n.bg === 'squared') {
          c.beginPath();
          for (let x = Math.floor(vx / 60) * 60; x <= x1; x += 60) { c.moveTo(x, ya); c.lineTo(x, yb); }
          for (let y = top + Math.ceil(Math.max(0, ya - top) / 60) * 60; y <= yb; y += 60) { c.moveTo(vx, y); c.lineTo(x1, y); }
          c.strokeStyle = th.major;
          c.stroke();
        }
      } else if (n.bg === 'dots') {
        const g = 25, s = 2 * lw;
        c.fillStyle = th.dot;
        for (let y = top + Math.ceil(Math.max(0, ya - top) / g) * g; y <= yb; y += g) for (let x = Math.floor(vx / g) * g; x <= x1; x += g) c.fillRect(x - s / 2, y - s / 2, s, s);
      }
      if (p > 0 && top >= vy && top <= y1) {
        c.strokeStyle = th.brk;
        c.lineWidth = lw;
        c.setLineDash([6 * lw, 6 * lw]);
        c.beginPath();
        c.moveTo(0, top);
        c.lineTo(PAGE_W, top);
        c.stroke();
        c.setLineDash([]);
      }
    }
  }
  const isHL = (o) => o.type === 'stroke' && !o.tape && (!!o.hl || (o.alpha != null && o.alpha < 1));
  const isTape = (o) => o.type === 'stroke' && !!o.tape;
  const patternCache = new Map();
  function tapePattern(c, idx) {
    const key = idx;
    if (patternCache.has(key)) return patternCache.get(key);
    const t = TAPE_PATTERNS[idx] || TAPE_PATTERNS[0];
    const s = 24;
    const cv = document.createElement('canvas');
    cv.width = s;
    cv.height = s;
    const g = cv.getContext('2d');
    g.fillStyle = t.bg;
    g.fillRect(0, 0, s, s);
    g.fillStyle = t.fg;
    g.strokeStyle = t.fg;
    g.lineWidth = 2;
    g.lineCap = 'round';
    switch (t.kind) {
      case 'plus': g.fillRect(10, 6, 3, 11); g.fillRect(6, 10, 11, 3); break;
      case 'hstripe': for (let y = 3; y < s; y += 8) g.fillRect(0, y, s, 2); break;
      case 'check': g.fillRect(0, 0, 12, 12); g.fillRect(12, 12, 12, 12); break;
      case 'dots': [[6, 6], [18, 18], [18, 6], [6, 18]].forEach(([x, y], i) => { if (i < 2) { g.beginPath(); g.arc(x, y, 1.8, 0, Math.PI * 2); g.fill(); } }); g.globalAlpha = 0.6; g.beginPath(); g.arc(18, 6, 1.2, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1; break;
      case 'grid': g.globalAlpha = 0.8; g.fillRect(0, 11, s, 2); g.fillRect(11, 0, 2, s); g.globalAlpha = 1; break;
      case 'vstripe': for (let x = 2; x < s; x += 6) g.fillRect(x, 0, 2, s); break;
      case 'chevron': g.beginPath(); g.moveTo(8, 9); g.lineTo(12, 14); g.lineTo(16, 9); g.stroke(); break;
      case 'wave': g.beginPath(); g.moveTo(0, 12); g.bezierCurveTo(6, 6, 6, 6, 12, 12); g.bezierCurveTo(18, 18, 18, 18, 24, 12); g.stroke(); break;
      case 'arch': g.beginPath(); g.arc(12, 16, 6, Math.PI, 0); g.fill(); break;
      default: break;
    }
    const pat = (c || mctx).createPattern(cv, 'repeat');
    patternCache.set(key, pat);
    return pat;
  }
  function strokeWidthFn(o) {
    const p = o.pts, n = p.length, w = o.width;
    const type = o.pen || 'fountain';
    const pf = { fountain: [0.4, 1.2], brush: [0.3, 1.4], ballpoint: [0.85, 0.3], pencil: [0.7, 0.6], calligraphy: [0.75, 0.5] }[type] || [1, 0];
    const taper = o.style === 'taper' || type === 'brush';
    return (i) => {
      const a = p[Math.max(0, i - 1)], b = p[i];
      let f = o.pr ? pf[0] + ((a[2] + b[2]) / 2 || 0.5) * pf[1] : 1;
      if (type === 'calligraphy') { const ang = Math.atan2(b[1] - a[1], b[0] - a[0]); f *= 0.3 + 1.1 * Math.abs(Math.sin(ang - Math.PI / 4)); }
      if (taper) { const k = Math.max(4, Math.min(14, n / 5)); f *= Math.max(0.15, Math.min(1, (i + 1) / k, (n - i) / k)); }
      return Math.max(0.4, w * f);
    };
  }
  function smoothPath(c, p) {
    c.beginPath();
    c.moveTo(p[0][0], p[0][1]);
    for (let i = 1; i < p.length - 1; i++) c.quadraticCurveTo(p[i][0], p[i][1], (p[i][0] + p[i + 1][0]) / 2, (p[i][1] + p[i + 1][1]) / 2);
    c.lineTo(p[p.length - 1][0], p[p.length - 1][1]);
  }
  function drawStroke(c, o) {
    const p = o.pts;
    const hl = isHL(o), tape = isTape(o);
    if (tape) {
      c.globalAlpha = o.peek ? 0.18 : 0.97;
      c.strokeStyle = o.pattern != null ? tapePattern(c, o.pattern) : o.color;
      c.fillStyle = c.strokeStyle;
      c.lineCap = 'butt';
      c.lineJoin = 'round';
      c.lineWidth = o.width;
      if (p.length === 1) { c.fillRect(p[0][0] - o.width / 2, p[0][1] - o.width / 2, o.width, o.width); return; }
      smoothPath(c, p);
      c.stroke();
      return;
    }
    const col = hl ? o.color : ink(o.color);
    c.strokeStyle = col;
    c.fillStyle = col;
    c.globalAlpha = hl ? o.alpha || 0.45 : o.pen === 'pencil' ? 0.85 : 1;
    const round = !(hl && o.tip === 'chisel');
    c.lineCap = round ? 'round' : 'butt';
    c.lineJoin = round ? 'round' : 'bevel';
    if (hl) c.globalCompositeOperation = paperDark ? 'screen' : 'multiply';
    if (p.length === 1) {
      c.beginPath();
      c.arc(p[0][0], p[0][1], Math.max(0.5, o.width / 2), 0, Math.PI * 2);
      c.fill();
      return;
    }
    const dashed = o.style === 'dash' || o.style === 'dot';
    const variable = !hl && !dashed && (o.pr || o.style === 'taper' || o.pen === 'calligraphy' || o.pen === 'brush');
    if (!variable) {
      c.lineWidth = o.width;
      if (o.style === 'dash') c.setLineDash([o.width * 3, o.width * 2.2]);
      else if (o.style === 'dot') { c.lineCap = 'round'; c.setLineDash([0.01, o.width * 2.4]); }
      smoothPath(c, p);
      c.stroke();
      if (o.pen === 'pencil' && !dashed) {
        // a light second pass gives pencil lines a grainy edge
        c.globalAlpha = 0.35;
        c.lineWidth = o.width * 1.35;
        c.setLineDash([1, 1.7]);
        c.stroke();
      }
      c.setLineDash([]);
      return;
    }
    const wf = strokeWidthFn(o);
    for (let i = 1; i < p.length; i++) {
      const a = p[i - 1], b = p[i];
      c.lineWidth = wf(i);
      c.beginPath();
      c.moveTo(a[0], a[1]);
      c.lineTo(b[0], b[1]);
      c.stroke();
    }
  }
  function drawShape(c, o) {
    const col = ink(o.color);
    c.strokeStyle = col;
    c.lineWidth = o.width;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    if (o.kind === 'line' || o.kind === 'arrow') {
      c.beginPath();
      c.moveTo(o.x1, o.y1);
      c.lineTo(o.x2, o.y2);
      if (o.kind === 'arrow') {
        const a = Math.atan2(o.y2 - o.y1, o.x2 - o.x1), L = Math.max(14, o.width * 4);
        c.moveTo(o.x2, o.y2);
        c.lineTo(o.x2 - L * Math.cos(a - 0.45), o.y2 - L * Math.sin(a - 0.45));
        c.moveTo(o.x2, o.y2);
        c.lineTo(o.x2 - L * Math.cos(a + 0.45), o.y2 - L * Math.sin(a + 0.45));
      }
      c.stroke();
      return;
    }
    c.beginPath();
    if (o.kind === 'ellipse') {
      const b = boxOf(o);
      c.ellipse(b.x + b.w / 2, b.y + b.h / 2, Math.max(0.5, b.w / 2), Math.max(0.5, b.h / 2), 0, 0, Math.PI * 2);
    } else {
      outline(o).forEach((q, i) => (i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])));
      c.closePath();
    }
    if (o.fill) { c.fillStyle = hexA(col, 0.22); c.fill(); }
    c.stroke();
  }
  function drawMarker(c, o, num, x, y, L, checked) {
    const s = o.size, col = ink(o.color);
    c.save();
    c.fillStyle = col;
    c.strokeStyle = col;
    c.lineWidth = Math.max(1, s / 12);
    if (o.list === 'bullet') {
      c.beginPath();
      c.arc(x + L.mw * 0.4, y + L.lh * 0.5, s * 0.14, 0, Math.PI * 2);
      c.fill();
    } else if (o.list === 'number') {
      c.font = textFont(o);
      c.textAlign = 'right';
      c.textBaseline = 'top';
      c.fillText(num + '.', x + L.mw - s * 0.35, y + s * 0.08);
    } else {
      const b = s * 0.78, bx = x + s * 0.1, by = y + (L.lh - b) / 2;
      c.lineJoin = 'round';
      c.strokeRect(bx, by, b, b);
      if (checked) {
        c.lineWidth = Math.max(1.5, s / 9);
        c.beginPath();
        c.moveTo(bx + b * 0.2, by + b * 0.52);
        c.lineTo(bx + b * 0.42, by + b * 0.75);
        c.lineTo(bx + b * 0.82, by + b * 0.25);
        c.stroke();
      }
    }
    c.restore();
  }
  function drawText(c, o, markersOnly) {
    const L = textLayout(o);
    c.font = textFont(o);
    c.textBaseline = 'top';
    const th = Math.max(1, o.size / 14);
    let num = 0;
    L.lines.forEach((ln, i) => {
      const y = o.y + i * L.lh, w = L.widths[i];
      const tx = o.x + L.ix + L.mw + (o.align === 'center' ? (L.maxW - w) / 2 : o.align === 'right' ? L.maxW - w : 0);
      const checked = o.list === 'check' && o.checks && o.checks[i];
      if (o.list && ln.trim()) { num++; drawMarker(c, o, num, o.x + L.ix, y, L, checked); }
      if (markersOnly) return;
      if (o.bg && ln) { c.fillStyle = hexA(o.bg, paperDark ? 0.45 : 0.75); c.fillRect(tx - 2, y, w + 4, L.lh); }
      c.globalAlpha = checked ? 0.45 : 1;
      c.fillStyle = ink(o.color);
      c.fillText(ln, tx, y + o.size * 0.08);
      if (o.underline && ln) c.fillRect(tx, y + o.size * 1.12, w, th);
      if ((o.strike || checked) && ln) c.fillRect(tx, y + o.size * 0.62, w, th);
      c.globalAlpha = 1;
    });
  }
  function drawImageObj(c, o) {
    const im = imageFor(o.blob);
    if (im._state === 'ok') { c.drawImage(im, o.x, o.y, o.w, o.h); return; }
    c.fillStyle = '#eef1f5';
    c.fillRect(o.x, o.y, o.w, o.h);
    c.strokeStyle = '#cfd7e2';
    c.lineWidth = 1;
    c.strokeRect(o.x, o.y, o.w, o.h);
    c.fillStyle = '#5d6b7d';
    c.font = `14px ${FONT}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(im._state === 'loading' ? 'Loading…' : 'Image unavailable', o.x + o.w / 2, o.y + o.h / 2);
  }
  function drawObjRaw(c, o) {
    c.save();
    if (o.type === 'stroke') drawStroke(c, o);
    else if (o.type === 'shape') drawShape(c, o);
    else if (o.type === 'text') drawText(c, o);
    else if (o.type === 'image') drawImageObj(c, o);
    c.restore();
  }
  // math cards that overlap a box, as page rectangles
  let cardsLive = true; // false while drawing a note that isn't open (its cards aren't on screen)
  function cardRectsOver(b) {
    const out = [];
    if (!S.note || !cardsLive) return out;
    for (const ce of cardEls.values()) {
      const x = ce.card.x, y = ce.card.y, w = ce.root.offsetWidth, h = ce.root.offsetHeight;
      if (w && h && !(b.x > x + w || b.y > y + h || b.x + b.w < x || b.y + b.h < y)) out.push({ x, y, w, h });
    }
    return out;
  }
  function drawObj(c, o) {
    // math cards are always white, so on dark paper ink lying over a card keeps its real colour there
    const rects = paperDark && !o.locked && o.type !== 'image' ? cardRectsOver(bbox(o)) : [];
    if (!rects.length) { drawObjRaw(c, o); return; }
    const cardPath = () => { c.beginPath(); rects.forEach((r) => { c.moveTo(r.x + 12, r.y); c.arcTo(r.x + r.w, r.y, r.x + r.w, r.y + r.h, 12); c.arcTo(r.x + r.w, r.y + r.h, r.x, r.y + r.h, 12); c.arcTo(r.x, r.y + r.h, r.x, r.y, 12); c.arcTo(r.x, r.y, r.x + r.w, r.y, 12); c.closePath(); }); };
    c.save();
    cardPath();
    c.rect(-1e5, -1e5, 2e5, 2e5);
    c.clip('evenodd');
    drawObjRaw(c, o);
    c.restore();
    c.save();
    cardPath();
    c.clip();
    onCard = true;
    try { drawObjRaw(c, o); } finally { onCard = false; }
    c.restore();
  }
  function drawSelection(c) {
    if (!S.sel.length) return;
    const z = S.zoom;
    c.save();
    c.strokeStyle = '#2f6fd0';
    c.lineWidth = 1.5 / z;
    if (S.sel.length > 1) {
      c.globalAlpha = 0.5;
      c.setLineDash([3 / z, 3 / z]);
      S.sel.forEach((o) => { const b = bbox(o); c.strokeRect(b.x, b.y, b.w, b.h); });
      c.globalAlpha = 1;
    }
    const b = selBox();
    c.setLineDash([6 / z, 4 / z]);
    c.strokeRect(b.x - 5 / z, b.y - 5 / z, b.w + 10 / z, b.h + 10 / z);
    c.setLineDash([]);
    const hs = 13 / z, hx = b.x + b.w + 5 / z, hy = b.y + b.h + 5 / z;
    c.fillStyle = '#fff';
    c.fillRect(hx - hs / 2, hy - hs / 2, hs, hs);
    c.strokeRect(hx - hs / 2, hy - hs / 2, hs, hs);
    c.restore();
  }
  function onHandle(b, x, y) {
    const z = S.zoom;
    return Math.abs(x - (b.x + b.w + 5 / z)) <= 16 / z && Math.abs(y - (b.y + b.h + 5 / z)) <= 16 / z;
  }
  function render() {
    const n = S.note;
    if (!n) return;
    paperDark = (PAPERS[n.paper] || PAPERS.white).dark;
    const z = S.zoom;
    const base = el.cv.getContext('2d');
    for (const c of [base, ictx]) {
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.clearRect(0, 0, el.cv.width, el.cv.height);
      c.setTransform(dpr * z, 0, 0, dpr * z, -view.x0 * dpr, -view.y0 * dpr);
    }
    const vx = view.x0 / z, vy = view.y0 / z, vw = view.w / z, vh = view.h / z;
    drawPaper(base, n, vx, vy, vw, vh);
    for (const o of n.objects) {
      if (o === editingObj) continue;
      const b = bbox(o);
      if (b.x > vx + vw || b.y > vy + vh || b.x + b.w < vx || b.y + b.h < vy) continue;
      // PDF pages stay under the math cards; everything you add goes over them
      drawObj(o.locked ? base : ictx, o);
    }
    const ctx = ictx; // the overlays below (live stroke, lasso, selection, eraser ring) go on the top layer
    if (editor && editor.style.list) {
      ctx.save();
      drawText(ctx, Object.assign({ x: editor.x, y: editor.y, text: editor.ta.value, color: editor.color, checks: editor.obj ? editor.obj.checks : null }, editor.style), true);
      ctx.restore();
    }
    if (action && action.live) drawObj(ctx, action.snapped || action.live);
    if (action && action.lasso && action.lasso.length > 1) {
      ctx.save();
      ctx.strokeStyle = '#2f6fd0';
      ctx.fillStyle = 'rgba(47,111,208,.06)';
      ctx.lineWidth = 1.5 / z;
      ctx.setLineDash([6 / z, 5 / z]);
      ctx.beginPath();
      action.lasso.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    drawSelection(ctx);
    if (action && action.tool === 'eraser' && action.last) {
      ctx.save();
      ctx.strokeStyle = paperDark ? 'rgba(255,255,255,.6)' : 'rgba(28,36,48,.5)';
      ctx.lineWidth = 1 / z;
      ctx.beginPath();
      ctx.arc(action.last.x, action.last.y, eraserRadius(), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  /* ---------------- pointer input ---------------- */
  let action = null;
  let gesture = null;
  const touches = new Map();
  const pagePt = (e) => {
    const r = el.wrap.getBoundingClientRect();
    return { x: (e.clientX - r.left) / S.zoom, y: (e.clientY - r.top) / S.zoom };
  };
  const pressureOf = (e) => (e.pointerType === 'pen' ? (e.pressure > 0 ? e.pressure : 0.5) : 0.5);
  const eraserRadius = () => (S.eraseMode === 'area' ? S.widths.eraser / 2 : 10 / S.zoom);

  function onDown(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (e.pointerType === 'pen' && !S.penSeen) {
      S.penSeen = true;
      prefs.set('penSeen', true);
      if (!S.penOnly) {
        S.penOnly = true;
        prefs.set('penOnly', true);
        if (S.tool === 'pen') renderPanel();
        toast('Pen detected: fingers now scroll and zoom. Change this in the pen settings.', 4500);
      }
    }
    if (e.pointerType === 'touch') {
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      capture(el.cv, e);
      if (S.penOnly || S.reading || touches.size > 1) {
        if (action && action.touch) cancelAction();
        startGesture();
        e.preventDefault();
        return;
      }
    }
    if (action) return;
    closeTextEditor();
    closeMenu();
    if (S.panelOpen) setPanel(false); // the settings pop-up closes when you touch the page
    capture(el.cv, e);
    const cp = pagePt(e);
    if ((S.reading || ['text', 'select', 'pen'].includes(S.tool)) && toggleCheckAt(cp)) { e.preventDefault(); return; }
    if (S.reading || S.tool === 'cursor') {
      action = { pointerId: e.pointerId, mode: 'pan', sx: e.clientX, sy: e.clientY, sl: el.scroller.scrollLeft, st: el.scroller.scrollTop, start: cp };
      return;
    }
    const p = cp;
    let tool = S.tool;
    if (e.pointerType === 'pen' && (e.button === 5 || e.button === 2 || (e.buttons & 32) || (e.buttons & 2))) tool = 'eraser';
    action = { pointerId: e.pointerId, touch: e.pointerType === 'touch', tool, start: p, last: p };
    if (tool === 'pen' || tool === 'highlighter' || tool === 'tape') {
      const pt = [r1(p.x), r1(p.y), r2(pressureOf(e))];
      if (tool === 'pen') {
        action.live = { type: 'stroke', pts: [pt], color: S.colors.pen, width: S.widths.pen, pr: e.pointerType === 'pen', pen: S.penType, style: S.lineStyle };
      } else if (tool === 'highlighter') {
        action.live = { type: 'stroke', pts: [pt], color: S.colors.highlighter, width: S.widths.highlighter, alpha: r2(S.hlOpacity / 100), hl: true, tip: S.hlTip, pr: false };
      } else {
        action.live = { type: 'stroke', pts: [pt], color: S.colors.tape, width: S.widths.tape, tape: true, pr: false };
        if (S.tapeKind === 'pattern') action.live.pattern = S.tapePattern;
      }
      action.straight = !!S.straighten[tool];
      if (S.fitText[tool]) {
        const t = topHit(p.x, p.y, 4 / S.zoom);
        if (t && t.type === 'text') {
          const L = textLayout(t);
          const li = clamp(Math.floor((p.y - t.y) / L.lh), 0, L.lines.length - 1);
          action.fitY = r1(t.y + li * L.lh + L.lh / 2);
          action.live.width = r1(L.lh * 0.95);
          action.live.pts[0][1] = action.fitY;
        }
      }
      if (!action.straight && tool === 'pen') armSnap(p);
    } else if (tool === 'restyle') {
      action.snap = snapshot();
      action.changed = false;
      restyleAt(p);
      requestRender();
    } else if (tool === 'shape') {
      action.live = { type: 'shape', kind: S.shape, x1: r1(p.x), y1: r1(p.y), x2: r1(p.x), y2: r1(p.y), color: S.colors.shape, width: S.widths.shape, fill: S.fill && !['line', 'arrow'].includes(S.shape) };
    } else if (tool === 'eraser') {
      action.snap = snapshot();
      action.erased = false;
      eraseAt(p);
      requestRender();
    } else if (tool === 'select') {
      const sb = S.sel.length ? selBox() : null;
      if (sb && onHandle(sb, p.x, p.y)) {
        Object.assign(action, { mode: 'resize', box: sb, orig: S.sel.map(clone), snap: snapshot() });
      } else {
        const h = topHit(p.x, p.y, 8 / S.zoom);
        if (h && e.shiftKey) {
          S.sel = S.sel.includes(h) ? S.sel.filter((o) => o !== h) : S.sel.concat([h]);
          action.mode = 'none';
          selectionChanged();
        } else if (h || (sb && p.x >= sb.x && p.x <= sb.x + sb.w && p.y >= sb.y && p.y <= sb.y + sb.h)) {
          if (h && !S.sel.includes(h)) { S.sel = [h]; selectionChanged(); }
          Object.assign(action, { mode: 'move', orig: S.sel.map(clone), snap: snapshot() });
        } else {
          if (S.sel.length) { S.sel = []; selectionChanged(); }
          Object.assign(action, { mode: 'lasso', lasso: [[p.x, p.y]], rect: S.lassoMode === 'rect' });
        }
        render();
      }
    } else {
      action.mode = 'tap';
    }
    e.preventDefault();
  }

  function armSnap(p) {
    const a = action;
    if (!a) return;
    clearTimeout(a.snapTimer);
    if (!a.live || a.live.type !== 'stroke' || !S.snap || a.tool !== 'pen') return;
    a.holdX = p.x;
    a.holdY = p.y;
    a.snapTimer = setTimeout(() => {
      if (action !== a || a.snapped) return;
      const r = recognize(a.live.pts);
      if (r) {
        a.snapped = Object.assign({ type: 'shape', color: a.live.color, width: a.live.width, fill: false }, r);
        requestRender();
        try {
          const ua = navigator.userActivation;
          if (navigator.vibrate && (!ua || ua.hasBeenActive)) navigator.vibrate(15);
        } catch (_) { /* ignore */ }
      }
    }, 550);
  }

  function onMove(e) {
    if (e.pointerType === 'touch' && touches.has(e.pointerId)) {
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (gesture) { moveGesture(); return; }
    }
    if (!action || e.pointerId !== action.pointerId) return;
    const a = action;
    if (a.mode === 'pan') {
      el.scroller.scrollLeft = a.sl - (e.clientX - a.sx);
      el.scroller.scrollTop = a.st - (e.clientY - a.sy);
      return;
    }
    const p = pagePt(e);
    if (a.live && a.live.type === 'stroke') {
      if (a.snapped) return;
      const yOf = (y) => (a.fitY != null ? a.fitY : y);
      if (a.straight) {
        a.live.pts = [a.live.pts[0], [r1(p.x), r1(yOf(p.y)), r2(pressureOf(e))]];
      } else {
        const evs = (e.getCoalescedEvents && e.getCoalescedEvents()) || [];
        for (const ev of evs.length ? evs : [e]) {
          const q = pagePt(ev);
          const last = a.live.pts[a.live.pts.length - 1];
          if (Math.hypot(q.x - last[0], q.y - last[1]) < 0.8 / S.zoom) continue;
          a.live.pts.push([r1(q.x), r1(yOf(q.y)), r2(pressureOf(ev))]);
        }
        if (a.tool === 'pen' && Math.hypot(p.x - a.holdX, p.y - a.holdY) > 4 / S.zoom) armSnap(p);
      }
      autoGrow(p.y);
      requestRender();
    } else if (a.live && a.live.type === 'shape') {
      let x2 = p.x, y2 = p.y;
      if (e.shiftKey) {
        const dx = x2 - a.start.x, dy = y2 - a.start.y;
        if (a.live.kind === 'line' || a.live.kind === 'arrow') {
          const ang = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4), L = Math.hypot(dx, dy);
          x2 = a.start.x + Math.cos(ang) * L;
          y2 = a.start.y + Math.sin(ang) * L;
        } else {
          const m = Math.max(Math.abs(dx), Math.abs(dy));
          x2 = a.start.x + Math.sign(dx || 1) * m;
          y2 = a.start.y + Math.sign(dy || 1) * m;
        }
      }
      a.live.x2 = r1(x2);
      a.live.y2 = r1(y2);
      autoGrow(p.y);
      requestRender();
    } else if (a.tool === 'eraser') {
      const steps = Math.max(1, Math.ceil(Math.hypot(p.x - a.last.x, p.y - a.last.y) / Math.max(2, eraserRadius() / 2)));
      for (let i = 1; i <= steps; i++) eraseAt({ x: a.last.x + ((p.x - a.last.x) * i) / steps, y: a.last.y + ((p.y - a.last.y) * i) / steps });
      a.last = p;
      requestRender();
    } else if (a.tool === 'restyle') {
      const steps = Math.max(1, Math.ceil(Math.hypot(p.x - a.last.x, p.y - a.last.y) / 4));
      for (let i = 1; i <= steps; i++) restyleAt({ x: a.last.x + ((p.x - a.last.x) * i) / steps, y: a.last.y + ((p.y - a.last.y) * i) / steps });
      a.last = p;
      requestRender();
    } else if (a.mode === 'lasso') {
      if (a.rect) {
        const s = a.start;
        a.lasso = [[s.x, s.y], [r1(p.x), s.y], [r1(p.x), r1(p.y)], [s.x, r1(p.y)]];
      } else {
        const l = a.lasso[a.lasso.length - 1];
        if (Math.hypot(p.x - l[0], p.y - l[1]) > 3 / S.zoom) a.lasso.push([r1(p.x), r1(p.y)]);
      }
      requestRender();
    } else if (a.mode === 'move') {
      const dx = p.x - a.start.x, dy = p.y - a.start.y;
      if (Math.abs(dx) + Math.abs(dy) > 0.5) a.moved = true;
      S.sel.forEach((o, i) => Object.assign(o, mapPts(clone(a.orig[i]), (x, y) => [x + dx, y + dy])));
      requestRender();
    } else if (a.mode === 'resize') {
      const b = a.box;
      let sx = Math.max(8, p.x - b.x) / Math.max(b.w, 1), sy = Math.max(8, p.y - b.y) / Math.max(b.h, 1);
      const uniform = e.shiftKey || a.orig.some((o) => o.type === 'text' || o.type === 'image');
      if (uniform) { const s = Math.max(sx, sy); sx = s; sy = s; }
      a.moved = true;
      S.sel.forEach((o, i) => {
        const m = mapPts(clone(a.orig[i]), (x, y) => [b.x + (x - b.x) * sx, b.y + (y - b.y) * sy]);
        if (m.type === 'text') m.size = r1(clamp(a.orig[i].size * sy, 6, 300));
        Object.assign(o, m);
      });
      requestRender();
    }
  }

  function onUp(e) {
    if (e.pointerType === 'touch' && touches.has(e.pointerId)) {
      touches.delete(e.pointerId);
      if (gesture) { if (touches.size === 0) endGesture(); else startGesture(); return; }
    }
    if (!action || e.pointerId !== action.pointerId) return;
    const a = action;
    action = null;
    clearTimeout(a.snapTimer);
    const p = pagePt(e);
    if (a.mode === 'pan') {
      if (Math.hypot(e.clientX - a.sx, e.clientY - a.sy) < 6) toggleTapeAt(p);
      return;
    }
    if (a.live && a.live.type === 'stroke') {
      const pts = a.live.pts, s0 = pts[0];
      const isTap = !a.snapped && pts.every((q) => Math.hypot(q[0] - s0[0], q[1] - s0[1]) < 4 / S.zoom);
      if (isTap && a.tool !== 'tape' && toggleTapeAt(p)) { render(); return; }
      pushHistory();
      S.note.objects.push(a.snapped || a.live);
      if (a.snapped) toast(`Snapped to ${shapeName(a.snapped)}`, 1400);
      touchNote();
    } else if (a.live && a.live.type === 'shape') {
      const o = a.live;
      if (Math.hypot(o.x2 - o.x1, o.y2 - o.y1) > 4) { pushHistory(); S.note.objects.push(o); touchNote(); }
    } else if (a.tool === 'eraser') {
      if (a.erased) { pushHistory(a.snap); touchNote(); }
    } else if (a.tool === 'restyle') {
      if (a.changed) { pushHistory(a.snap); touchNote(); }
    } else if (a.mode === 'lasso') {
      const big = a.rect ? Math.abs(p.x - a.start.x) > 4 / S.zoom && Math.abs(p.y - a.start.y) > 4 / S.zoom : a.lasso.length > 4;
      if (big) {
        const poly = a.lasso, part = S.lassoPartial;
        const corners = (b) => [[b.x, b.y], [b.x + b.w, b.y], [b.x + b.w, b.y + b.h], [b.x, b.y + b.h]];
        S.sel = S.note.objects.filter((o) => {
          if (o.locked) return false;
          const b = bbox(o);
          const pts = o.type === 'stroke' ? o.pts : corners(b);
          let k = 0;
          for (const q of pts) if (inPoly(q[0], q[1], poly)) k++;
          if (part) {
            if (k) return true;
            return inPoly(b.x + b.w / 2, b.y + b.h / 2, poly) || poly.some((q) => q[0] >= b.x && q[0] <= b.x + b.w && q[1] >= b.y && q[1] <= b.y + b.h);
          }
          return o.type === 'stroke' ? k / pts.length >= 0.9 : k === pts.length;
        });
        selectionChanged();
        // show the selection actions (convert to math, copy, colour…) right away
        if (S.sel.length && !S.panelOpen) setPanel(true);
      }
    } else if (a.mode === 'move' || a.mode === 'resize') {
      if (a.moved) { pushHistory(a.snap); touchNote(); }
    } else if (a.mode === 'tap' && Math.hypot(p.x - a.start.x, p.y - a.start.y) < 10 / S.zoom) {
      if (a.tool === 'text') {
        const t = topHit(p.x, p.y, 4 / S.zoom);
        if (t && t.type === 'text') openTextEditor(t);
        else openTextEditor(null, p.x, p.y - S.textStyle.size * 0.65);
      } else if (a.tool === 'math') {
        addCard(p.x, p.y);
      }
    }
    render();
  }
  function onCancel(e) {
    if (touches.has(e.pointerId)) {
      touches.delete(e.pointerId);
      if (gesture && touches.size === 0) endGesture();
    }
    if (action && e.pointerId === action.pointerId) cancelAction();
  }
  function cancelAction() {
    const a = action;
    action = null;
    if (!a) return;
    clearTimeout(a.snapTimer);
    if ((a.mode === 'move' || a.mode === 'resize') && a.moved) S.sel.forEach((o, i) => Object.assign(o, a.orig[i]));
    if (a.tool === 'eraser' && a.erased) restore(a.snap);
    render();
  }
  function splitStroke(o, p, r) {
    const runs = [];
    let cur = [];
    for (const q of o.pts) {
      if (Math.hypot(q[0] - p.x, q[1] - p.y) <= r) { if (cur.length) runs.push(cur); cur = []; } else cur.push(q);
    }
    if (cur.length) runs.push(cur);
    return runs.filter((run) => run.length >= 2).map((pts) => Object.assign({}, o, { pts }));
  }
  function eraseAt(p) {
    const r = eraserRadius();
    const objs = S.note.objects;
    let changed = false;
    for (let i = objs.length - 1; i >= 0; i--) {
      const o = objs[i];
      if (o.locked || o.type === 'image') continue;
      if (S.eraseHlOnly && !isHL(o)) continue;
      if (S.eraseTapeOnly && !isTape(o)) continue;
      if (!hits(o, p.x, p.y, r, true)) continue;
      if (S.eraseMode === 'area' && o.type === 'stroke') objs.splice(i, 1, ...splitStroke(o, p, r + o.width / 2));
      else objs.splice(i, 1);
      S.sel = S.sel.filter((x) => x !== o);
      changed = true;
    }
    if (changed) action.erased = true;
  }
  // Change style: brushing over handwriting gives it the chosen pen type, line style, thickness and colour;
  // shapes take the colour and thickness, typed text takes the colour.
  function restyleAt(p) {
    const r = 8 / S.zoom;
    const c = S.colors.restyle, w = S.widths.restyle, pen = S.restylePen, style = S.restyleStyle;
    for (const o of S.note.objects) {
      if (o.locked || o.type === 'image' || isTape(o) || isHL(o)) continue;
      if (!hits(o, p.x, p.y, r, true)) continue;
      const same = o.color === c && (o.type === 'text'
        || (o.width === w && (o.type !== 'stroke' || (o.pen === pen && (o.style || 'solid') === style))));
      if (same) continue;
      o.color = c;
      if (o.type !== 'text') o.width = w;
      if (o.type === 'stroke') { o.pen = pen; o.style = style; }
      action.changed = true;
    }
  }
  function toggleTapeAt(p) {
    const objs = S.note.objects;
    for (let i = objs.length - 1; i >= 0; i--) {
      const o = objs[i];
      if (!isTape(o) || !hits(o, p.x, p.y, 2 / S.zoom, true)) continue;
      o.peek = !o.peek;
      touchNote();
      requestRender();
      return true;
    }
    return false;
  }
  function toggleCheckAt(p) {
    const objs = S.note.objects;
    for (let i = objs.length - 1; i >= 0; i--) {
      const o = objs[i];
      if (o.type !== 'text' || o.list !== 'check' || o === editingObj) continue;
      const L = textLayout(o), x = o.x + L.ix;
      if (p.x < x - 4 || p.x > x + L.mw) continue;
      const li = Math.floor((p.y - o.y) / L.lh);
      if (li < 0 || li >= L.lines.length || !L.lines[li].trim()) continue;
      pushHistory();
      o.checks = o.checks || [];
      o.checks[li] = !o.checks[li];
      touchNote();
      render();
      return true;
    }
    return false;
  }
  function eraseAll() {
    const n = S.note.objects.filter((o) => o.type === 'stroke' || o.type === 'shape').length;
    if (!n) { toast('There is no handwriting to erase on this note.'); return; }
    if (!confirm('Erase all handwriting and shapes on this note? Typed text, pictures and math cards stay.')) return;
    pushHistory();
    S.note.objects = S.note.objects.filter((o) => o.type !== 'stroke' && o.type !== 'shape');
    S.sel = [];
    touchNote();
    render();
    toast('Handwriting erased. Undo brings it back.');
  }

  function startGesture() {
    const pts = [...touches.values()];
    gesture = { n: pts.length, c: center(pts), d: pts.length > 1 ? dist(pts[0], pts[1]) : 0 };
  }
  function moveGesture() {
    const pts = [...touches.values()];
    if (pts.length !== gesture.n) { startGesture(); return; }
    const c = center(pts);
    if (pts.length > 1) {
      const d = dist(pts[0], pts[1]);
      if (gesture.d > 0 && d > 0) setZoom(S.zoom * (d / gesture.d), c.x, c.y);
      gesture.d = d;
    }
    el.scroller.scrollLeft -= c.x - gesture.c.x;
    el.scroller.scrollTop -= c.y - gesture.c.y;
    gesture.c = c;
    requestLayout();
  }
  function endGesture() { gesture = null; redrawGraphs(); }

  /* ---------------- selection actions ---------------- */
  let clip = null;
  function selectionChanged() {
    updateRail();
    if (S.tool === 'select') renderPanel();
  }
  function copySel(quiet) {
    if (!S.sel.length) return false;
    clip = S.sel.map(clone);
    if (!quiet) toast(`Copied ${clip.length} item${clip.length > 1 ? 's' : ''}`, 1200);
    return true;
  }
  function pasteClip() {
    if (!clip || !clip.length) return;
    pushHistory();
    const items = clip.map((o) => { const c = mapPts(clone(o), (x, y) => [x + 24, y + 24]); delete c.locked; return c; });
    clip = items.map(clone);
    S.note.objects.push(...items);
    if (S.tool !== 'select') setTool('select');
    S.sel = items;
    touchNote();
    selectionChanged();
    render();
  }
  function duplicateSel() { if (copySel(true)) pasteClip(); }
  function deleteSelected() {
    if (!S.sel.length) return;
    pushHistory();
    S.note.objects = S.note.objects.filter((o) => !S.sel.includes(o));
    S.sel = [];
    touchNote();
    selectionChanged();
    render();
  }
  function cutSel() { if (copySel(true)) { deleteSelected(); toast('Cut', 1000); } }

  /* ---------------- text editing ---------------- */
  let editor = null;
  let editingObj = null;
  const TEXT_KEYS = ['size', 'bold', 'italic', 'underline', 'strike', 'bg', 'list', 'align', 'indent'];
  const TEXT_DEF = { size: 20, bold: false, italic: false, underline: false, strike: false, bg: null, list: null, align: 'left', indent: 0 };
  const editorPad = (style) => (style.indent || 0) * style.size * 1.6 + (style.list ? style.size * 1.6 : 0);
  function styleEditor() {
    if (!editor) return;
    const { ta, style } = editor;
    ta.style.font = textFont(style);
    ta.style.lineHeight = '1.3';
    ta.style.paddingLeft = editorPad(style) + 'px';
    ta.style.textAlign = style.align || 'left';
    ta.style.color = ink(editor.color);
    ta.style.textDecoration = [style.underline ? 'underline' : '', style.strike ? 'line-through' : ''].join(' ').trim() || 'none';
    ta.style.background = style.bg ? hexA(style.bg, 0.6) : 'rgba(127,127,127,.08)';
    editor.fit();
  }
  function openTextEditor(obj, x, y) {
    closeTextEditor();
    const style = {};
    TEXT_KEYS.forEach((k) => { style[k] = obj ? obj[k] ?? TEXT_DEF[k] : S.textStyle[k] ?? TEXT_DEF[k]; });
    const color = obj ? obj.color : S.colors.text;
    const ex = r1(obj ? obj.x : clamp(x, 0, PAGE_W - 40)), ey = r1(obj ? obj.y : Math.max(0, y));
    const ta = document.createElement('textarea');
    ta.className = 'text-editor';
    ta.style.left = ex + 'px';
    ta.style.top = ey + 'px';
    ta.value = obj ? obj.text : '';
    ta.setAttribute('aria-label', 'Text');
    el.layer.append(ta);
    editor = { ta, obj, x: ex, y: ey, style, color, snap: snapshot() };
    editor.fit = () => {
      mctx.font = textFont(style);
      const w = Math.max(160, ...ta.value.split('\n').map((l) => mctx.measureText(l).width + 30)) + editorPad(style);
      ta.style.width = Math.min(w, PAGE_W - ex) + 'px';
      ta.style.height = 'auto';
      ta.style.height = ta.scrollHeight + 'px';
    };
    editingObj = obj || null;
    if (obj) { Object.assign(S.textStyle, style); S.colors.text = color; }
    ta.addEventListener('input', () => { editor.fit(); requestRender(); });
    ta.addEventListener('keydown', (ev) => {
      ev.stopPropagation();
      if (ev.key === 'Escape' || (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey))) { ev.preventDefault(); closeTextEditor(); }
    });
    // stay open while the text settings panel is being used
    ta.addEventListener('blur', (ev) => {
      if (ev.relatedTarget && el.panel.contains(ev.relatedTarget)) return;
      closeTextEditor();
    });
    styleEditor();
    if (S.tool === 'text') renderPanel();
    render();
    ta.focus({ preventScroll: true });
  }
  function closeTextEditor() {
    if (!editor) return;
    const ed = editor;
    editor = null;
    editingObj = null;
    const text = ed.ta.value.replace(/\s+$/, '');
    ed.ta.remove();
    if (ed.obj && ed.obj.checks) ed.obj.checks = ed.obj.checks.slice(0, text.split('\n').length);
    if (ed.obj) {
      const o = ed.obj;
      const changed = text !== o.text || ed.color !== o.color || TEXT_KEYS.some((k) => (o[k] ?? null) !== (ed.style[k] ?? null));
      if (changed) {
        pushHistory(ed.snap);
        if (text) Object.assign(o, ed.style, { text, color: ed.color });
        else { S.note.objects = S.note.objects.filter((x) => x !== o); S.sel = S.sel.filter((x) => x !== o); }
        touchNote();
      }
    } else if (text) {
      pushHistory(ed.snap);
      S.note.objects.push(Object.assign({ type: 'text', x: ed.x, y: ed.y, text, color: ed.color }, ed.style));
      touchNote();
    }
    render();
  }
  function setTextStyle(patch) {
    Object.assign(S.textStyle, patch);
    prefs.set('textStyle', S.textStyle);
    if (editor) { Object.assign(editor.style, patch); styleEditor(); }
    const texts = S.sel.filter((o) => o.type === 'text');
    if (!editor && texts.length) { pushHistory(); texts.forEach((o) => Object.assign(o, patch)); touchNote(); render(); }
    renderPanel();
  }

  /* ---------------- math engine ---------------- */
  const MathEngine = (() => {
    const BUILTIN = {
      sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, acos: Math.acos, atan: Math.atan,
      arcsin: Math.asin, arccos: Math.acos, arctan: Math.atan, sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh,
      sec: (x) => 1 / Math.cos(x), csc: (x) => 1 / Math.sin(x), cot: (x) => 1 / Math.tan(x),
      sqrt: Math.sqrt, cbrt: Math.cbrt, abs: Math.abs, ln: Math.log, exp: Math.exp,
      log: (x, b) => (b === undefined ? Math.log10(x) : Math.log(x) / Math.log(b)),
      floor: Math.floor, ceil: Math.ceil, round: Math.round, sign: Math.sign, min: Math.min, max: Math.max,
    };
    const CONST = { pi: Math.PI, e: Math.E, tau: Math.PI * 2 };
    const fact = (n) => {
      if (n < 0 || Math.floor(n) !== n) return NaN;
      if (n > 170) return Infinity;
      let r = 1;
      for (let i = 2; i <= n; i++) r *= i;
      return r;
    };
    function normalize(s) {
      return s.replace(/[×·∙]/g, '*').replace(/÷/g, '/').replace(/[−–]/g, '-').replace(/π/g, 'pi').replace(/√/g, 'sqrt')
        .replace(/²/g, '^2').replace(/³/g, '^3')
        .replace(/(\d+(?:\.\d+)?)\s*%/g, '($1/100)').replace(/\bof\b/gi, '*');
    }
    function tokenize(s) {
      const t = [];
      let i = 0;
      while (i < s.length) {
        const ch = s[i];
        if (/\s/.test(ch)) { i++; continue; }
        if (/[0-9.]/.test(ch)) {
          let j = i;
          while (j < s.length && /[0-9.]/.test(s[j])) j++;
          const v = Number(s.slice(i, j));
          if (Number.isNaN(v)) throw new Error('Bad number');
          t.push({ t: 'num', v });
          i = j;
          continue;
        }
        if (/[A-Za-z_]/.test(ch)) {
          let j = i;
          while (j < s.length && /[A-Za-z_0-9]/.test(s[j])) j++;
          t.push({ t: 'id', v: s.slice(i, j) });
          i = j;
          continue;
        }
        if ('+-*/^(),|!'.includes(ch)) { t.push({ t: 'op', v: ch }); i++; continue; }
        throw new Error(`Unexpected "${ch}"`);
      }
      return t;
    }
    function parse(src, ctx2) {
      const toks = tokenize(src);
      let i = 0;
      const peek = () => toks[i];
      const isOp = (v) => peek() && peek().t === 'op' && peek().v === v;
      const expect = (v) => { if (!isOp(v)) throw new Error(`Expected "${v}"`); i++; };
      const startsFactor = () => { const p = peek(); return !!p && (p.t === 'num' || p.t === 'id' || (p.t === 'op' && p.v === '(')); };
      function expr() {
        let n = term();
        while (isOp('+') || isOp('-')) { const op = toks[i++].v; n = { k: 'bin', op, a: n, b: term() }; }
        return n;
      }
      function term() {
        let n = unary();
        for (;;) {
          if (isOp('*') || isOp('/')) { const op = toks[i++].v; n = { k: 'bin', op, a: n, b: unary() }; }
          else if (startsFactor()) n = { k: 'bin', op: '*', a: n, b: power() };
          else break;
        }
        return n;
      }
      function unary() {
        if (isOp('-')) { i++; return { k: 'neg', a: unary() }; }
        if (isOp('+')) { i++; return unary(); }
        return power();
      }
      function power() {
        const b = postfix();
        if (isOp('^')) { i++; return { k: 'bin', op: '^', a: b, b: unary() }; }
        return b;
      }
      function postfix() {
        let n = primary();
        while (isOp('!')) { i++; n = { k: 'call', f: 'fact', args: [n] }; }
        return n;
      }
      function primary() {
        const p = toks[i++];
        if (!p) throw new Error('Incomplete expression');
        if (p.t === 'num') return { k: 'num', v: p.v };
        if (p.t === 'op') {
          if (p.v === '(') { const n = expr(); expect(')'); return n; }
          if (p.v === '|') { const n = expr(); expect('|'); return { k: 'call', f: 'abs', args: [n] }; }
          throw new Error(`Unexpected "${p.v}"`);
        }
        return ident(p.v);
      }
      function ident(name) {
        const kind = ctx2.kind(name);
        if (kind === 'func') {
          if (isOp('(')) {
            i++;
            const args = [];
            if (!isOp(')')) { args.push(expr()); while (isOp(',')) { i++; args.push(expr()); } }
            expect(')');
            return { k: 'call', f: name, args };
          }
          return { k: 'call', f: name, args: [power()] };
        }
        if (kind) return { k: 'var', v: name };
        if (name.length > 1 && [...name].every((ch) => /[A-Za-z]/.test(ch) && ctx2.kind(ch) && ctx2.kind(ch) !== 'func')) {
          let n = { k: 'var', v: name[0] };
          for (const ch of name.slice(1)) n = { k: 'bin', op: '*', a: n, b: { k: 'var', v: ch } };
          return n;
        }
        throw new Error(`Unknown name "${name}"`);
      }
      const root = expr();
      if (i < toks.length) throw new Error(`Unexpected "${toks[i].v}"`);
      return root;
    }
    function compile(n, env) {
      switch (n.k) {
        case 'num': { const v = n.v; return () => v; }
        case 'var': {
          const name = n.v;
          if (name in CONST) { const v = CONST[name]; return () => v; }
          return (sc) => {
            if (sc && name in sc) return sc[name];
            const v = env.vars[name];
            if (v === undefined) throw new Error(`"${name}" has no value`);
            return v;
          };
        }
        case 'neg': { const a = compile(n.a, env); return (sc) => -a(sc); }
        case 'bin': {
          const a = compile(n.a, env), b = compile(n.b, env);
          switch (n.op) {
            case '+': return (sc) => a(sc) + b(sc);
            case '-': return (sc) => a(sc) - b(sc);
            case '*': return (sc) => a(sc) * b(sc);
            case '/': return (sc) => a(sc) / b(sc);
            default: return (sc) => Math.pow(a(sc), b(sc));
          }
        }
        case 'call': {
          const args = n.args.map((x) => compile(x, env));
          if (n.f === 'fact') return (sc) => fact(args[0](sc));
          if (BUILTIN[n.f]) { const f = BUILTIN[n.f]; return (sc) => f(...args.map((g) => g(sc))); }
          const name = n.f;
          return (sc) => {
            const uf = env.funcs[name];
            if (!uf) throw new Error(`"${name}" is not defined`);
            return uf(args[0](sc));
          };
        }
        default: throw new Error('Bad expression');
      }
    }
    const uses = (n, name) => {
      if (!n) return false;
      if (n.k === 'var') return n.v === name;
      return [n.a, n.b, ...(n.args || [])].some((c) => uses(c, name));
    };
    // names in a line that nothing defines; "fx" with x known counts as f times x, so only f is missing
    function missingNames(body, kind) {
      const out = [];
      const add = (n) => { if (!out.includes(n)) out.push(n); };
      let toks;
      try { toks = tokenize(body); } catch (e) { return out; }
      for (const t of toks) {
        if (t.t !== 'id' || kind(t.v)) continue;
        const chars = [...t.v];
        if (t.v.length > 1 && chars.every((ch) => /[A-Za-z]/.test(ch)) && chars.some((ch) => kind(ch) && kind(ch) !== 'func')) chars.filter((ch) => !kind(ch)).forEach(add);
        else add(t.v);
      }
      return out.filter((n) => /^[A-Za-z]\w*$/.test(n) && !reserved(n));
    }
    const isLiteral = (n) => n.k === 'num' || (n.k === 'neg' && n.a.k === 'num');
    const reserved = (name) => name in CONST || !!BUILTIN[name] || name === 'x' || name === 'y';
    function prep(raw) {
      let s = normalize(raw.trim());
      const it = { raw };
      if (!s) { it.kind = 'empty'; return it; }
      if (s.endsWith('=')) s = s.slice(0, -1).trim();
      if (!s) { it.kind = 'empty'; return it; }
      let m = s.match(/^([A-Za-z]\w*)\s*\(\s*([A-Za-z])\s*\)\s*=\s*(.+)$/);
      if (m) return Object.assign(it, { kind: 'funcdef', name: m[1], param: m[2], body: m[3] });
      m = s.match(/^([A-Za-z]\w*)\s*=\s*(.+)$/);
      if (m) {
        if (m[1] === 'y') return Object.assign(it, { kind: 'plot', body: m[2] });
        if (m[1] === 'x') return Object.assign(it, { kind: 'vline', body: m[2] });
        return Object.assign(it, { kind: 'assign', name: m[1], body: m[2] });
      }
      if (s.includes('=')) return Object.assign(it, { kind: 'error', err: 'Use one "=" per line' });
      return Object.assign(it, { kind: 'expr', body: s });
    }
    function analyze(cards) {
      const items = [];
      for (const c of cards) c.lines.forEach((raw, idx) => { const it = prep(raw || ''); it.card = c.id; it.idx = idx; items.push(it); });
      const userFuncs = new Set(), userVars = new Set();
      const env = { vars: {}, funcs: {} };
      for (const it of items) {
        if (it.kind !== 'funcdef') continue;
        if (reserved(it.name)) Object.assign(it, { kind: 'error', err: `"${it.name}" is a built-in name` });
        else if (userFuncs.has(it.name)) Object.assign(it, { kind: 'error', err: `${it.name}(…) is already defined` });
        else userFuncs.add(it.name);
      }
      for (const it of items) {
        if (it.kind !== 'assign') continue;
        if (reserved(it.name) || userFuncs.has(it.name)) Object.assign(it, { kind: 'error', err: `"${it.name}" can't be a variable name` });
        else if (userVars.has(it.name)) Object.assign(it, { kind: 'error', err: `"${it.name}" is already defined` });
        else userVars.add(it.name);
      }
      const kindOf = (param) => (name) => {
        if (name === param) return 'param';
        if (name in CONST) return 'const';
        if (BUILTIN[name] || userFuncs.has(name)) return 'func';
        if (userVars.has(name)) return 'var';
        return null;
      };
      for (const it of items) {
        const kind = kindOf(it.kind === 'funcdef' ? it.param : 'x');
        try {
          if (it.kind === 'funcdef') it.ast = parse(it.body, { kind });
          else if (['plot', 'assign', 'expr', 'vline'].includes(it.kind)) { it.ast = parse(it.body, { kind }); it.usesX = uses(it.ast, 'x'); }
        } catch (e) {
          const missing = /^Unknown name/.test(e.message) ? missingNames(it.body, kind) : [];
          Object.assign(it, { kind: 'error', err: e.message, missing: missing.length ? missing : null });
        }
      }
      for (const it of items) if (it.kind === 'assign' && it.usesX) { it.kind = 'plot'; userVars.delete(it.name); }
      let depth = 0;
      for (const it of items) {
        if (it.kind !== 'funcdef') continue;
        const body = compile(it.ast, env), p = it.param;
        env.funcs[it.name] = (v) => {
          if (++depth > 256) { depth = 0; throw new Error('Too much recursion'); }
          try { return body({ [p]: v }); } finally { depth = Math.max(0, depth - 1); }
        };
      }
      let pending = items.filter((it) => it.kind === 'assign');
      for (let guard = pending.length + 1; pending.length && guard > 0; guard--) {
        const still = [];
        for (const it of pending) {
          try { it.value = compile(it.ast, env)(null); env.vars[it.name] = it.value; } catch (e) { it.lastErr = e.message; still.push(it); }
        }
        if (still.length === pending.length) break;
        pending = still;
      }
      for (const it of pending) Object.assign(it, { kind: 'error', err: it.lastErr || 'Could not work this out' });

      const out = new Map(cards.map((c) => [c.id, []]));
      const plotFn = (g) => { g({ x: 0.5 }); g({ x: 1.7 }); return (x) => g({ x }); };
      for (const it of items) {
        let info;
        try {
          switch (it.kind) {
            case 'empty': info = { kind: 'empty' }; break;
            case 'error': info = { kind: 'error', err: it.err, missing: it.missing || null }; break;
            case 'funcdef': { const f = env.funcs[it.name]; info = { kind: 'plot', fn: plotFn((sc) => f(sc.x)) }; break; }
            case 'plot': info = { kind: 'plot', fn: plotFn(compile(it.ast, env)) }; break;
            case 'vline': info = { kind: 'vline', x: compile(it.ast, env)(null) }; break;
            case 'assign': {
              const lit = isLiteral(it.ast);
              info = { kind: 'var', name: it.name, value: it.value, literal: lit, text: lit ? '' : '= ' + fmtNum(it.value) };
              break;
            }
            case 'expr':
              if (it.usesX) info = { kind: 'plot', fn: plotFn(compile(it.ast, env)) };
              else { const v = compile(it.ast, env)(null); info = { kind: 'value', value: v, text: '= ' + fmtNum(v) }; }
              break;
            default: info = { kind: 'empty' };
          }
        } catch (e) { info = { kind: 'error', err: e.message }; }
        out.get(it.card)[it.idx] = info;
      }
      return out;
    }
    return { analyze };
  })();

  function fmtNum(v) {
    if (typeof v !== 'number' || Number.isNaN(v)) return 'undefined';
    if (!Number.isFinite(v)) return v > 0 ? '∞' : '-∞';
    if (Math.abs(v) < 1e-12) return '0';
    const r = Math.round(v);
    if (Math.abs(v - r) < 1e-9 && Math.abs(v) < 1e15) return String(r);
    const a = Math.abs(v);
    if (a >= 1e12 || a < 1e-6) return v.toExponential(5).replace(/\.?0+e/, 'e');
    return String(parseFloat(v.toPrecision(10)));
  }

  /* ---------------- math cards ---------------- */
  const cardEls = new Map();
  function addCard(x, y) {
    pushHistory();
    const w = 420;
    const c = { id: uid(), x: r1(clamp(x - 20, 0, PAGE_W - w)), y: r1(Math.max(0, y - 20)), w, gh: 240, lines: [''], view: { cx: 0, cy: 0, s: 30 } };
    S.note.cards.push(c);
    touchNote();
    renderCards();
    autoGrow(c.y + 360);
    const inp = el.layer.querySelector(`[data-card="${c.id}"] .min`);
    if (inp) inp.focus({ preventScroll: true });
  }
  function renderCards() {
    el.layer.querySelectorAll('.mcard').forEach((n) => n.remove());
    cardEls.clear();
    if (!S.note) return;
    for (const c of S.note.cards) buildCard(c);
    updateMath();
  }
  function rowHtml(i) {
    const ph = i === 0 ? 'y = x^2   or   a = 3   or   12*4 =' : '';
    return `<div class="mline"><span class="mdot"></span><input class="min" spellcheck="false" autocomplete="off" autocapitalize="off" placeholder="${ph}" aria-label="Math line"><button type="button" class="mlim" hidden></button><span class="mres"></span></div><div class="mslider" hidden><span class="smin"></span><input type="range" aria-label="Value"><span class="smax"></span></div><div class="madd" hidden></div>`;
  }
  function buildRows(ce) {
    ce.rows.innerHTML = '';
    ce.card.lines.forEach((line, i) => {
      const r = document.createElement('div');
      r.className = 'mrow';
      r.innerHTML = rowHtml(i);
      $('.min', r).value = line;
      r._stale = true;
      ce.rows.append(r);
    });
  }
  function buildCard(c) {
    const root = document.createElement('div');
    root.className = 'mcard';
    root.dataset.card = c.id;
    root.style.left = c.x + 'px';
    root.style.top = c.y + 'px';
    root.style.width = c.w + 'px';
    root.innerHTML = `<div class="mhead"><span class="mgrip">${svg(ICON.grip)}</span><span>Math</span><span class="mspacer"></span>`
      + `<button class="mbtn" data-a="eq" title="Hide equations" aria-label="Hide equations" aria-pressed="false">${svg(ICON.eye)}</button>`
      + `<button class="mbtn" data-a="out" title="Zoom graph out" aria-label="Zoom graph out">${svg(ICON.minus)}</button>`
      + `<button class="mbtn" data-a="in" title="Zoom graph in" aria-label="Zoom graph in">${svg(ICON.plus)}</button>`
      + `<button class="mbtn" data-a="home" title="Reset graph view" aria-label="Reset graph view">${svg(ICON.home)}</button>`
      + `<button class="mbtn" data-a="lock" title="Lock graph view" aria-label="Lock graph view" aria-pressed="false">${svg(ICON.unlock)}</button>`
      + `<button class="mbtn" data-a="set" title="Graph settings" aria-label="Graph settings" aria-expanded="false">${svg(ICON.sliders)}</button>`
      + `<button class="mbtn" data-a="del" title="Delete math card" aria-label="Delete math card">${svg(ICON.close)}</button></div>`
      + `<div class="mrows"></div><div class="mset" hidden></div><div class="mgraph" style="height:${c.gh}px"><canvas></canvas><div class="mcoord"></div></div>`
      + `<div class="mresize" title="Resize">${svg(ICON.resize)}</div>`;
    el.layer.append(root);
    const ce = { card: c, root, rows: $('.mrows', root), gcv: $('.mgraph canvas', root), coord: $('.mcoord', root), graphBox: $('.mgraph', root), set: $('.mset', root), plots: [] };
    gopts(c);
    buildGraphSettings(ce);
    updateLockBtn(ce);
    updateEqBtn(ce);
    cardEls.set(c.id, ce);
    buildRows(ce);
    wireCard(ce);
  }
  function dragWith(target, e, onMoveFn, onEnd) {
    e.preventDefault();
    e.stopPropagation();
    capture(target, e);
    const mv = (ev) => onMoveFn(ev);
    const up = () => {
      target.removeEventListener('pointermove', mv);
      target.removeEventListener('pointerup', up);
      target.removeEventListener('pointercancel', up);
      onEnd();
    };
    target.addEventListener('pointermove', mv);
    target.addEventListener('pointerup', up);
    target.addEventListener('pointercancel', up);
  }
  function rowIndex(ce, node) { return [...ce.rows.children].indexOf(node.closest('.mrow')); }
  function focusRow(ce, i, atEnd) {
    const r = ce.rows.children[clamp(i, 0, ce.rows.children.length - 1)];
    if (!r) return;
    const inp = $('.min', r);
    inp.focus({ preventScroll: true });
    if (atEnd) inp.setSelectionRange(inp.value.length, inp.value.length);
  }
  function wireCard(ce) {
    const { root, card } = ce;
    const head = $('.mhead', root);
    head.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.mbtn')) return;
      const sx = e.clientX, sy = e.clientY, ox = card.x, oy = card.y, snap = snapshot();
      let moved = false;
      // notes written on top of the card travel with it
      const cw = root.offsetWidth, ch = root.offsetHeight;
      const riders = S.note.objects.filter((o) => {
        if (o.locked) return false;
        const b = bbox(o);
        return b.x >= ox - 4 && b.y >= oy - 4 && b.x + b.w <= ox + cw + 4 && b.y + b.h <= oy + ch + 4;
      }).map((o) => ({ o, orig: clone(o) }));
      dragWith(head, e, (ev) => {
        const dx = (ev.clientX - sx) / S.zoom, dy = (ev.clientY - sy) / S.zoom;
        if (Math.abs(dx) + Math.abs(dy) > 1) moved = true;
        card.x = r1(clamp(ox + dx, 60 - card.w, PAGE_W - 60));
        card.y = r1(Math.max(0, oy + dy));
        root.style.left = card.x + 'px';
        root.style.top = card.y + 'px';
        const mx = card.x - ox, my = card.y - oy;
        riders.forEach(({ o, orig }) => Object.assign(o, mapPts(clone(orig), (x, y) => [x + mx, y + my])));
        requestRender(); // ink over the card changes tone as the card moves
      }, () => {
        if (!moved) return;
        pushHistory(snap);
        autoGrow(card.y + root.offsetHeight);
        touchNote();
        updateMath();
      });
    });
    root.querySelectorAll('.mbtn').forEach((b) => b.addEventListener('click', (e) => {
      e.stopPropagation();
      const a = b.dataset.a;
      if (a === 'del') {
        pushHistory();
        S.note.cards.splice(S.note.cards.indexOf(card), 1);
        touchNote();
        renderCards();
        return;
      }
      if (a === 'eq') {
        card.opts.hideEq = !card.opts.hideEq;
        updateEqBtn(ce);
        touchNote();
        requestRender();
        return;
      }
      if (a === 'lock') {
        card.opts.lock = !card.opts.lock;
        updateLockBtn(ce);
        touchNote();
        toast(card.opts.lock ? 'Graph locked: it will not pan or zoom.' : 'Graph unlocked', 1600);
        return;
      }
      if (a === 'set') {
        ce.set.hidden = !ce.set.hidden;
        b.setAttribute('aria-expanded', String(!ce.set.hidden));
        b.classList.toggle('on', !ce.set.hidden);
        if (!ce.set.hidden) syncGraphSettings(ce);
        return;
      }
      if ((a === 'in' || a === 'out' || a === 'home') && card.opts.lock) { toast('This graph is locked. Tap the lock on the card to unlock it.'); return; }
      if (a === 'in') zoomGraph(ce, 1.5);
      if (a === 'out') zoomGraph(ce, 1 / 1.5);
      if (a === 'home') { card.view = { cx: 0, cy: 0, s: 30 }; drawGraph(ce); touchNote(); }
    }));
    const rz = $('.mresize', root);
    rz.addEventListener('pointerdown', (e) => {
      const sx = e.clientX, sy = e.clientY, ow = card.w, oh = card.gh, snap = snapshot();
      dragWith(rz, e, (ev) => {
        card.w = Math.round(clamp(ow + (ev.clientX - sx) / S.zoom, 280, PAGE_W));
        card.gh = Math.round(clamp(oh + (ev.clientY - sy) / S.zoom, 120, 900));
        root.style.width = card.w + 'px';
        ce.graphBox.style.height = card.gh + 'px';
        drawGraph(ce);
        requestRender();
      }, () => { pushHistory(snap); touchNote(); });
    });
    ce.rows.addEventListener('focusin', (e) => {
      if (!e.target.matches('.min, input[type=range]')) return;
      if (!ce.editing) { ce.editing = true; pushHistory(); }
    });
    ce.rows.addEventListener('focusout', () => { setTimeout(() => { if (!ce.rows.contains(document.activeElement)) ce.editing = false; }, 0); });
    ce.rows.addEventListener('input', (e) => {
      const i = rowIndex(ce, e.target);
      if (i < 0) return;
      const row = ce.rows.children[i];
      if (e.target.matches('.min')) {
        card.lines[i] = e.target.value;
        row._stale = true;
      } else if (e.target.type === 'range' && row._var) {
        const txt = `${row._var} = ${fmtNum(Number(e.target.value))}`;
        card.lines[i] = txt;
        $('.min', row).value = txt;
      }
      touchNote();
      updateMath();
    });
    ce.rows.addEventListener('click', (e) => {
      const lim = e.target.closest('.mlim');
      if (lim) {
        const i = rowIndex(ce, lim);
        if (i < 0) return;
        openLinePop(ce, i, ce.rows.children[i]);
        const f = $('.lpop .lpop-x input', ce.root);
        if (f) f.focus();
        return;
      }
      const d = e.target.closest('.mdot.on');
      if (!d) return;
      const i = rowIndex(ce, d);
      if (i >= 0) openLinePop(ce, i, ce.rows.children[i]);
    });
    ce.rows.addEventListener('keydown', (e) => {
      if (!e.target.matches('.min')) return;
      e.stopPropagation();
      const i = rowIndex(ce, e.target);
      if (e.key === 'Enter') {
        e.preventDefault();
        const pos = e.target.selectionStart ?? e.target.value.length;
        const v = e.target.value;
        card.lines.splice(i, 1, v.slice(0, pos), v.slice(pos));
        if (card.lstyle) card.lstyle.splice(i + 1, 0, null);
        buildRows(ce);
        updateMath();
        touchNote();
        focusRow(ce, i + 1, false);
      } else if (e.key === 'Backspace' && e.target.selectionStart === 0 && e.target.selectionEnd === 0 && i > 0) {
        e.preventDefault();
        const prevLen = card.lines[i - 1].length;
        card.lines.splice(i - 1, 2, card.lines[i - 1] + card.lines[i]);
        if (card.lstyle) card.lstyle.splice(i, 1);
        buildRows(ce);
        updateMath();
        touchNote();
        const inp = $('.min', ce.rows.children[i - 1]);
        inp.focus({ preventScroll: true });
        inp.setSelectionRange(prevLen, prevLen);
      } else if (e.key === 'ArrowDown') { e.preventDefault(); focusRow(ce, i + 1, true); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); focusRow(ce, i - 1, true); }
    });
    wireGraph(ce);
  }

  function updateMath() {
    if (!S.note) return;
    const sorted = S.note.cards.slice().sort((a, b) => a.y - b.y || a.x - b.x);
    const res = MathEngine.analyze(sorted.map((c) => ({ id: c.id, lines: c.lines })));
    for (const ce of cardEls.values()) {
      const rows = res.get(ce.card.id) || [];
      ce.plots = [];
      let ci = 0;
      [...ce.rows.children].forEach((row, i) => {
        const info = rows[i] || { kind: 'empty' };
        const dot = $('.mdot', row), out = $('.mres', row), sl = $('.mslider', row), add = $('.madd', row);
        const missing = info.kind === 'error' && info.missing;
        const isErr = info.kind === 'error' && !missing;
        row.classList.toggle('err', isErr);
        add.hidden = !missing;
        const sig = missing ? missing.join(',') : '';
        if (add._sig !== sig) {
          add._sig = sig;
          add.innerHTML = '';
          if (missing) {
            add.append(Object.assign(document.createElement('span'), { className: 'madd-label', textContent: 'add slider:' }));
            const btn = (label, names, cls) => {
              const b = document.createElement('button');
              b.type = 'button';
              b.className = 'madd-btn' + (cls ? ' ' + cls : '');
              b.textContent = label;
              b.title = names.length > 1 ? `Add sliders for ${names.join(', ')}` : `Add a slider for ${names[0]}`;
              b.onclick = (e) => { e.stopPropagation(); addSliders(ce, rowIndex(ce, b), names); };
              add.append(b);
            };
            missing.forEach((n) => btn(n, [n]));
            if (missing.length > 1) btn('all', missing, 'all');
          }
        }
        let color = null;
        const ls = lineStyleOf(ce.card, i);
        if (info.kind === 'plot' || info.kind === 'vline') {
          color = (ls && ls.color) || GRAPH_COLORS[ci % GRAPH_COLORS.length];
          ci++;
          ce.plots.push(Object.assign({ color, idx: i, width: (ls && ls.width) || 2.5, dash: (ls && ls.dash) || 'solid', hidden: !!(ls && ls.hidden), xlo: limOf(ls, 'xmin'), xhi: limOf(ls, 'xmax') }, info));
        }
        const lim = $('.mlim', row);
        lim.hidden = info.kind !== 'plot';
        if (!lim.hidden) {
          const lo = limOf(ls, 'xmin'), hi = limOf(ls, 'xmax'), set = lo != null || hi != null;
          lim.classList.toggle('set', set);
          lim.textContent = !set ? 'x-limit' : lo != null && hi != null ? `${fmtNum(lo)} ≤ x ≤ ${fmtNum(hi)}` : lo != null ? `x ≥ ${fmtNum(lo)}` : `x ≤ ${fmtNum(hi)}`;
          lim.title = set ? 'Change where this graph starts and stops' : 'Only draw this graph between two x values';
        }
        dot.style.background = color && !(ls && ls.hidden) ? color : 'transparent';
        dot.style.borderColor = color && ls && ls.hidden ? color : '';
        dot.classList.toggle('on', !!color);
        dot.title = color ? 'Line colour and style' : '';
        out.textContent = isErr ? info.err : missing ? '' : info.text || '';
        out.title = isErr ? info.err : '';
        if (info.kind === 'var' && info.literal) {
          sl.hidden = false;
          const r = $('input', sl);
          if (row._stale !== false || !row._range) {
            const v = info.value, big = Math.abs(v) > 10;
            row._range = big ? { min: v < 0 ? -Math.abs(v) * 2 : 0, max: Math.abs(v) * 2 } : { min: -10, max: 10 };
            r.min = row._range.min;
            r.max = row._range.max;
            r.step = (row._range.max - row._range.min) / 400;
            $('.smin', sl).textContent = fmtNum(row._range.min);
            $('.smax', sl).textContent = fmtNum(row._range.max);
            row._stale = false;
          }
          if (document.activeElement !== r) r.value = info.value;
          row._var = info.name;
        } else {
          sl.hidden = true;
          row._range = null;
          row._var = null;
        }
      });
      ce.graphBox.hidden = !ce.plots.length;
      if (ce.plots.length) drawGraph(ce);
    }
    if (paperDark) requestRender(); // a card that grew or shrank changes which ink sits on it
  }

  // new "name = 1" lines go right under the line that needs them, each with its own slider
  function addSliders(ce, i, names) {
    const c = ce.card;
    if (i < 0) return;
    pushHistory();
    const lines = names.map((n) => `${n} = 1`);
    c.lines.splice(i + 1, 0, ...lines);
    if (c.lstyle) c.lstyle.splice(i + 1, 0, ...lines.map(() => null));
    buildRows(ce);
    updateMath();
    touchNote();
    autoGrow(c.y + ce.root.offsetHeight);
  }

  /* per-line graph style: colour, thickness, line style, show/hide */
  const LINE_COLORS = ['#d1453b', '#2f6fd0', '#2e9d57', '#e8743b', '#7b4fd6', '#1c2430', '#0f9fa8', '#e85a8c'];
  const lineStyleOf = (card, i) => (card.lstyle && card.lstyle[i]) || null;
  const limOf = (ls, k) => (ls && typeof ls[k] === 'number' && Number.isFinite(ls[k]) ? ls[k] : null);
  function setLineStyle(ce, i, patch) {
    const c = ce.card;
    c.lstyle = c.lstyle || [];
    while (c.lstyle.length < c.lines.length) c.lstyle.push(null);
    c.lstyle[i] = Object.assign({}, c.lstyle[i] || {}, patch);
    touchNote();
    updateMath();
  }
  function closeLinePop() { document.querySelectorAll('.lpop').forEach((p) => p.remove()); }
  function openLinePop(ce, i, row) {
    closeLinePop();
    const plot = ce.plots.find((p) => p.idx === i);
    if (!plot) return;
    const st = lineStyleOf(ce.card, i) || {};
    const pop = document.createElement('div');
    pop.className = 'lpop';
    pop.addEventListener('pointerdown', (e) => e.stopPropagation());
    const head = document.createElement('div');
    head.className = 'lpop-head';
    head.innerHTML = '<span>Line</span><label class="toggle" title="Show this line"><input type="checkbox" role="switch" aria-label="Show this line"></label>';
    const show = $('input', head);
    show.checked = !st.hidden;
    show.onchange = () => setLineStyle(ce, i, { hidden: !show.checked });
    const mid = document.createElement('div');
    mid.className = 'lpop-mid';
    const wbox = document.createElement('label');
    wbox.className = 'lpop-w';
    wbox.innerHTML = '<span title="Thickness">≡</span><input type="number" min="0.5" max="10" step="0.5" aria-label="Line thickness">';
    const win = $('input', wbox);
    win.value = st.width || 2.5;
    win.oninput = () => { const v = clamp(Number(win.value) || 2.5, 0.5, 10); setLineStyle(ce, i, { width: v }); };
    const dashes = document.createElement('div');
    dashes.className = 'lpop-dash';
    [['solid', 'Solid'], ['dash', 'Dashed'], ['dot', 'Dotted']].forEach(([k, label]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.title = label;
      b.setAttribute('aria-label', label);
      b.className = (st.dash || 'solid') === k ? 'on' : '';
      b.innerHTML = `<svg viewBox="0 0 24 24"><path d="M4 20L20 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" ${k === 'dash' ? 'stroke-dasharray="5 4"' : k === 'dot' ? 'stroke-dasharray="0.1 4"' : ''}/></svg>`;
      b.onclick = () => { dashes.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); setLineStyle(ce, i, { dash: k }); };
      dashes.append(b);
    });
    mid.append(wbox, dashes);
    const sw = document.createElement('div');
    sw.className = 'lpop-colors';
    LINE_COLORS.forEach((col) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.style.background = col;
      b.title = col;
      b.setAttribute('aria-label', 'Colour ' + col);
      if ((st.color || plot.color).toLowerCase() === col) b.classList.add('on');
      b.onclick = () => { sw.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); setLineStyle(ce, i, { color: col }); };
      sw.append(b);
    });
    const xr = document.createElement('div');
    xr.className = 'lpop-x';
    xr.innerHTML = '<span>x from</span><input type="text" inputmode="decimal" placeholder="−∞" aria-label="Start graph at x"><span>to</span><input type="text" inputmode="decimal" placeholder="∞" aria-label="Stop graph at x"><button type="button" class="lpop-clear" title="No x limit">Clear</button>';
    const [xa, xb] = xr.querySelectorAll('input');
    const lo0 = limOf(st, 'xmin'), hi0 = limOf(st, 'xmax');
    xa.value = lo0 == null ? '' : fmtNum(lo0);
    xb.value = hi0 == null ? '' : fmtNum(hi0);
    // accepts plain numbers and simple expressions like pi/2 or 2*pi
    const readX = (inp) => {
      const t = inp.value.trim();
      if (!t) return { ok: true, v: null };
      const r = MathEngine.analyze([{ id: 't', lines: [t] }]).get('t')[0];
      const v = r && (r.kind === 'value' || r.kind === 'expr') ? r.value : Number(t.replace(',', '.'));
      return Number.isFinite(v) ? { ok: true, v } : { ok: false };
    };
    const applyX = () => {
      const a = readX(xa), b = readX(xb);
      xa.classList.toggle('bad', !a.ok);
      xb.classList.toggle('bad', !b.ok);
      if (!a.ok || !b.ok) return;
      setLineStyle(ce, i, { xmin: a.v, xmax: b.v });
    };
    xa.oninput = applyX;
    xb.oninput = applyX;
    [xa, xb].forEach((inp) => inp.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter' || e.key === 'Escape') pop.remove(); }));
    $('.lpop-clear', xr).onclick = () => { xa.value = ''; xb.value = ''; applyX(); };
    pop.append(head, mid, sw, xr);
    ce.root.append(pop);
    pop.style.top = (ce.rows.offsetTop + row.offsetTop + row.offsetHeight) + 'px';
    setTimeout(() => {
      const off = (e) => { if (!pop.contains(e.target)) { pop.remove(); document.removeEventListener('pointerdown', off, true); } };
      document.addEventListener('pointerdown', off, true);
    }, 0);
  }

  /* ---------------- graphs ---------------- */
  function niceStep(raw) {
    const p = 10 ** Math.floor(Math.log10(raw));
    const m = raw / p;
    return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p;
  }
  function fmtTick(v, step) {
    const dec = Math.max(0, -Math.floor(Math.log10(step)));
    return String(Number(v.toFixed(Math.min(dec, 10))));
  }
  const GRAPH_DEF = { grid: true, minor: true, numbers: true, arrows: true, arrowBoth: false, xAxis: true, yAxis: true, xLabel: '', yLabel: '', xStep: 0, yStep: 0, lock: false, tickSize: 12 };
  const gopts = (c) => (c.opts = Object.assign({}, GRAPH_DEF, c.opts || {}));
  // the x and y axes can have different scales (pixels per unit)
  const scales = (v) => ({ sx: v.s, sy: v.sy || v.s });
  function graphRange(ce) {
    const c = ce.card, v = c.view, W = ce.gcv.clientWidth || c.w, H = c.gh, { sx, sy } = scales(v);
    return { xmin: v.cx - W / 2 / sx, xmax: v.cx + W / 2 / sx, ymin: v.cy - H / 2 / sy, ymax: v.cy + H / 2 / sy, W, H };
  }
  function drawArrow(g, x, y, ang) {
    const L = 9;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x - L * Math.cos(ang - 0.45), y - L * Math.sin(ang - 0.45));
    g.moveTo(x, y);
    g.lineTo(x - L * Math.cos(ang + 0.45), y - L * Math.sin(ang + 0.45));
    g.stroke();
  }
  function drawGraph(ce) {
    const c = ce.card, cv = ce.gcv, o = gopts(c);
    const W = cv.clientWidth || c.w, H = c.gh;
    if (!W || !H) return;
    const k = Math.min(4, (window.devicePixelRatio || 1) * S.zoom);
    const pw = Math.round(W * k), ph = Math.round(H * k);
    if (cv.width !== pw) cv.width = pw;
    if (cv.height !== ph) cv.height = ph;
    const g = cv.getContext('2d');
    g.setTransform(k, 0, 0, k, 0, 0);
    g.fillStyle = '#fff';
    g.fillRect(0, 0, W, H);
    const v = c.view, { sx, sy } = scales(v);
    const X = (wx) => W / 2 + (wx - v.cx) * sx, Y = (wy) => H / 2 - (wy - v.cy) * sy;
    const { xmin, xmax, ymin, ymax } = graphRange(ce);
    const stepX = o.xStep > 0 ? o.xStep : niceStep(70 / sx);
    const stepY = o.yStep > 0 ? o.yStep : niceStep(70 / sy);
    const gridLines = (stX, stY, color) => {
      g.strokeStyle = color;
      g.lineWidth = 1;
      g.beginPath();
      if ((xmax - xmin) / stX <= 400) for (let x = Math.ceil(xmin / stX) * stX; x <= xmax; x += stX) { const px = Math.round(X(x)) + 0.5; g.moveTo(px, 0); g.lineTo(px, H); }
      if ((ymax - ymin) / stY <= 400) for (let y = Math.ceil(ymin / stY) * stY; y <= ymax; y += stY) { const py = Math.round(Y(y)) + 0.5; g.moveTo(0, py); g.lineTo(W, py); }
      g.stroke();
    };
    if (o.grid) {
      if (o.minor) gridLines(stepX / 5, stepY / 5, '#f1f4f8');
      gridLines(stepX, stepY, '#dde3ea');
    }
    const x0 = X(0), y0 = Y(0);
    const showX = o.xAxis && ymin <= 0 && ymax >= 0, showY = o.yAxis && xmin <= 0 && xmax >= 0;
    g.strokeStyle = '#5d6b7d';
    g.fillStyle = '#5d6b7d';
    g.lineWidth = 1.4;
    g.lineCap = 'round';
    g.beginPath();
    if (showX) { g.moveTo(0, y0); g.lineTo(W, y0); }
    if (showY) { g.moveTo(x0, 0); g.lineTo(x0, H); }
    g.stroke();
    if (o.arrows) {
      if (showX) { drawArrow(g, W - 1.5, y0, 0); if (o.arrowBoth) drawArrow(g, 1.5, y0, Math.PI); }
      if (showY) { drawArrow(g, x0, 1.5, -Math.PI / 2); if (o.arrowBoth) drawArrow(g, x0, H - 1.5, Math.PI / 2); }
    }
    // axis numbers: black, in the size chosen in graph settings
    const ts = clamp(Number(o.tickSize) || 12, 8, 28);
    g.font = `${ts}px ${FONT}`;
    g.fillStyle = '#000';
    if (o.numbers) {
      if (o.xAxis) {
        g.textAlign = 'center';
        g.textBaseline = 'top';
        const ly = clamp(y0 + 4, 2, H - 14);
        for (let x = Math.ceil(xmin / stepX) * stepX; x <= xmax; x += stepX) if (Math.abs(x) > stepX / 2) g.fillText(fmtTick(x, stepX), X(x), ly);
      }
      if (o.yAxis) {
        g.textAlign = 'right';
        g.textBaseline = 'middle';
        const lx = clamp(x0 - 5, 30, W - 4);
        for (let y = Math.ceil(ymin / stepY) * stepY; y <= ymax; y += stepY) if (Math.abs(y) > stepY / 2) g.fillText(fmtTick(y, stepY), lx, Y(y));
      }
    }
    g.fillStyle = '#1c2430';
    g.font = 'italic 14px "Cambria Math", Cambria, serif';
    if (o.xAxis && o.xLabel) { g.textAlign = 'right'; g.textBaseline = 'bottom'; g.fillText(o.xLabel, W - 8, clamp(y0 - 6, 18, H - 4)); }
    if (o.yAxis && o.yLabel) { g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText(o.yLabel, clamp(x0 + 10, 4, W - 60), 4); }
    for (const pl of ce.plots) {
      if (pl.hidden) continue;
      g.strokeStyle = pl.color;
      g.lineWidth = pl.width || 2.5;
      g.setLineDash(pl.dash === 'dash' ? [g.lineWidth * 3.2, g.lineWidth * 2.4] : pl.dash === 'dot' ? [0.01, g.lineWidth * 2.4] : []);
      g.lineJoin = 'round';
      g.lineCap = 'round';
      g.beginPath();
      if (pl.kind === 'vline') {
        if (Number.isFinite(pl.x)) { g.moveTo(X(pl.x), 0); g.lineTo(X(pl.x), H); }
        g.stroke();
        continue;
      }
      let pen = false, prevY = 0;
      let lo = pl.xlo != null ? pl.xlo : -Infinity, hi = pl.xhi != null ? pl.xhi : Infinity;
      if (lo > hi) [lo, hi] = [hi, lo];
      const a = Math.max(xmin, lo), b = Math.min(xmax, hi);
      if (!(a <= b)) continue;
      const N = Math.max(1, Math.ceil((b - a) * sx * 2));
      for (let i = 0; i <= N; i++) {
        const wx = a + ((b - a) * i) / N, px = X(wx);
        let wy;
        try { wy = pl.fn(wx); } catch (_) { wy = NaN; }
        if (typeof wy !== 'number' || !Number.isFinite(wy)) { pen = false; continue; }
        const py = Y(wy);
        if (pen && Math.abs(py - prevY) > H * 2) pen = false;
        const cpy = clamp(py, -1e4, 1e4);
        if (pen) g.lineTo(px, cpy); else { g.moveTo(px, cpy); pen = true; }
        prevY = py;
      }
      g.stroke();
    }
    g.setLineDash([]);
    if (ce.set && !ce.set.hidden) syncGraphSettings(ce, true);
  }
  function graphLocal(ce, clientX, clientY) {
    const r = ce.gcv.getBoundingClientRect();
    const k = 1 / S.zoom;
    return { lx: (clientX - r.left) * k, ly: (clientY - r.top) * k, W: r.width * k, H: r.height * k };
  }
  function zoomGraphAt(ce, f, clientX, clientY) {
    const v = ce.card.view;
    const { sx, sy } = scales(v);
    const { lx, ly, W, H } = graphLocal(ce, clientX, clientY);
    const wx = v.cx + (lx - W / 2) / sx, wy = v.cy - (ly - H / 2) / sy;
    const nsx = clamp(sx * f, 0.02, 50000), nsy = clamp(sy * f, 0.02, 50000);
    v.cx = wx - (lx - W / 2) / nsx;
    v.cy = wy + (ly - H / 2) / nsy;
    v.s = nsx;
    if (v.sy) v.sy = nsy;
    drawGraph(ce);
  }
  function zoomGraph(ce, f) {
    const v = ce.card.view;
    v.s = clamp(v.s * f, 0.02, 50000);
    if (v.sy) v.sy = clamp(v.sy * f, 0.02, 50000);
    drawGraph(ce);
    touchNote();
  }
  function updateEqBtn(ce) {
    const b = ce.root.querySelector('.mbtn[data-a="eq"]');
    if (!b) return;
    const hide = !!ce.card.opts.hideEq;
    ce.rows.hidden = hide;
    b.innerHTML = svg(hide ? ICON.eyeOff : ICON.eye);
    b.classList.toggle('on', hide);
    b.title = hide ? 'Show equations' : 'Hide equations';
    b.setAttribute('aria-label', b.title);
    b.setAttribute('aria-pressed', String(hide));
  }
  function updateLockBtn(ce) {
    const b = ce.root.querySelector('.mbtn[data-a="lock"]');
    if (!b) return;
    const on = !!ce.card.opts.lock;
    b.innerHTML = svg(on ? ICON.lock : ICON.unlock);
    b.classList.toggle('on', on);
    b.title = on ? 'Unlock graph view' : 'Lock graph view';
    b.setAttribute('aria-label', b.title);
    b.setAttribute('aria-pressed', String(on));
    ce.gcv.style.cursor = on ? 'default' : '';
  }
  function wireGraph(ce) {
    const g = ce.gcv;
    const ptrs = new Map();
    let last = null, lastD = 0, before = null;
    const locked = () => !!ce.card.opts.lock;
    g.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (locked()) return;
      capture(g, e);
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (!before) before = JSON.stringify(ce.card.view);
      const pts = [...ptrs.values()];
      lastD = pts.length === 2 ? dist(pts[0], pts[1]) : 0;
      last = center(pts);
    });
    g.addEventListener('pointermove', (e) => {
      const v = ce.card.view;
      const { sx, sy } = scales(v);
      if (!ptrs.has(e.pointerId)) {
        const { lx, ly, W, H } = graphLocal(ce, e.clientX, e.clientY);
        ce.coord.textContent = `x ${fmtNum(Number((v.cx + (lx - W / 2) / sx).toPrecision(3)))},  y ${fmtNum(Number((v.cy - (ly - H / 2) / sy).toPrecision(3)))}`;
        return;
      }
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const pts = [...ptrs.values()];
      const c = center(pts);
      v.cx -= (c.x - last.x) / S.zoom / sx;
      v.cy += (c.y - last.y) / S.zoom / sy;
      if (pts.length === 2) {
        const d = dist(pts[0], pts[1]);
        if (lastD > 0 && d > 0) zoomGraphAt(ce, d / lastD, c.x, c.y);
        lastD = d;
      }
      last = c;
      drawGraph(ce);
    });
    const end = (e) => {
      ptrs.delete(e.pointerId);
      if (ptrs.size) { const pts = [...ptrs.values()]; last = center(pts); lastD = pts.length === 2 ? dist(pts[0], pts[1]) : 0; return; }
      if (before && before !== JSON.stringify(ce.card.view)) touchNote();
      before = null;
    };
    g.addEventListener('pointerup', end);
    g.addEventListener('pointercancel', end);
    g.addEventListener('pointerleave', () => { if (!ptrs.size) ce.coord.textContent = ''; });
    g.addEventListener('wheel', (e) => {
      if (locked()) return; // let the page scroll instead
      e.preventDefault();
      e.stopPropagation();
      zoomGraphAt(ce, Math.exp(-e.deltaY * 0.0015), e.clientX, e.clientY);
      clearTimeout(ce.wheelT);
      ce.wheelT = setTimeout(touchNote, 400);
    }, { passive: false });
  }

  /* graph settings panel inside each math card */
  function buildGraphSettings(ce) {
    const box = ce.set;
    const chk = (key, label) => `<label class="mchk"><input type="checkbox" data-o="${key}"><span>${label}</span></label>`;
    const axis = (ax) => `<div class="maxis">`
      + `<div class="maxis-top">${chk(ax + 'Axis', ax.toUpperCase() + '-axis')}<label class="mfield"><span>Label</span><input type="text" data-o="${ax}Label" placeholder="e.g. ${ax}" maxlength="24"></label></div>`
      + `<div class="mrange"><input type="text" inputmode="decimal" data-r="${ax}min" aria-label="${ax} minimum"><span class="mle">≤ <i>${ax}</i> ≤</span><input type="text" inputmode="decimal" data-r="${ax}max" aria-label="${ax} maximum">`
      + `<label class="mfield small"><span>Step</span><input type="text" inputmode="decimal" data-o="${ax}Step" placeholder="auto"></label></div></div>`;
    box.innerHTML = `<div class="mopts">${chk('grid', 'Grid')}${chk('numbers', 'Axis numbers')}${chk('minor', 'Minor gridlines')}${chk('arrows', 'Arrows')}`
      + `<span class="marrows" role="group" aria-label="Arrow style">`
      + `<button type="button" data-ab="0" title="Arrows on the positive ends" aria-label="Arrows on the positive ends">${svg('M4 12h16 M16 8l4 4-4 4 M12 20V4 M8 8l4-4 4 4')}</button>`
      + `<button type="button" data-ab="1" title="Arrows on both ends" aria-label="Arrows on both ends">${svg('M3 12h18 M17 8l4 4-4 4 M7 8l-4 4 4 4 M12 3v18 M8 7l4-4 4 4 M8 17l4 4 4-4')}</button></span>`
      + `<span class="mfs" role="group" aria-label="Axis number size"><span>Number size</span><button type="button" data-fs="-1" title="Smaller axis numbers" aria-label="Smaller axis numbers">A−</button><b class="mfs-v"></b><button type="button" data-fs="1" title="Bigger axis numbers" aria-label="Bigger axis numbers">A+</button></span></div>`
      + axis('x') + axis('y');
    const o = () => ce.card.opts;
    const changed = () => { drawGraph(ce); touchNote(); };
    box.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter' && e.target.matches('input')) e.target.blur();
    });
    box.addEventListener('change', (e) => {
      const t = e.target;
      if (t.dataset.o) {
        const key = t.dataset.o;
        if (t.type === 'checkbox') o()[key] = t.checked;
        else if (/Step$/.test(key)) { const n = Number(t.value); o()[key] = Number.isFinite(n) && n > 0 ? n : 0; }
        else o()[key] = t.value.trim();
        changed();
        syncGraphSettings(ce);
      } else if (t.dataset.r) {
        applyRange(ce, t.dataset.r[0]);
      }
    });
    box.querySelectorAll('[data-fs]').forEach((b) => b.addEventListener('click', () => {
      o().tickSize = clamp((Number(o().tickSize) || 12) + Number(b.dataset.fs), 8, 28);
      changed();
      syncGraphSettings(ce);
    }));
    box.querySelectorAll('[data-ab]').forEach((b) => b.addEventListener('click', () => {
      o().arrowBoth = b.dataset.ab === '1';
      o().arrows = true;
      changed();
      syncGraphSettings(ce);
    }));
  }
  function applyRange(ce, ax) {
    const box = ce.set;
    const lo = Number(box.querySelector(`[data-r="${ax}min"]`).value), hi = Number(box.querySelector(`[data-r="${ax}max"]`).value);
    if (!Number.isFinite(lo) || !Number.isFinite(hi) || hi <= lo) {
      toast('The first number must be smaller than the second.');
      syncGraphSettings(ce);
      return;
    }
    const v = ce.card.view, { W, H } = graphRange(ce);
    const { sx, sy } = scales(v);
    if (ax === 'x') {
      v.s = clamp(W / (hi - lo), 0.02, 50000);
      v.cx = (lo + hi) / 2;
      if (!v.sy) v.sy = sy; // keep y as it was
    } else {
      v.sy = clamp(H / (hi - lo), 0.02, 50000);
      v.cy = (lo + hi) / 2;
      v.s = v.s || sx;
    }
    drawGraph(ce);
    touchNote();
  }
  function syncGraphSettings(ce, rangesOnly) {
    const box = ce.set, o = ce.card.opts;
    if (!box) return;
    const r = graphRange(ce);
    const fmt = (n) => fmtNum(Number(n.toPrecision(6)));
    [['xmin', r.xmin], ['xmax', r.xmax], ['ymin', r.ymin], ['ymax', r.ymax]].forEach(([k, val]) => {
      const i = box.querySelector(`[data-r="${k}"]`);
      if (i && document.activeElement !== i) i.value = fmt(val);
    });
    if (rangesOnly) return;
    box.querySelectorAll('[data-o]').forEach((i) => {
      if (document.activeElement === i) return;
      const key = i.dataset.o;
      if (i.type === 'checkbox') i.checked = !!o[key];
      else if (/Step$/.test(key)) i.value = o[key] > 0 ? o[key] : '';
      else i.value = o[key] || '';
    });
    box.querySelectorAll('[data-ab]').forEach((b) => b.classList.toggle('on', (b.dataset.ab === '1') === !!o.arrowBoth));
    const fv = box.querySelector('.mfs-v');
    if (fv) fv.textContent = clamp(Number(o.tickSize) || 12, 8, 28);
  }
  let graphTimer = 0;
  function redrawGraphs() {
    clearTimeout(graphTimer);
    graphTimer = setTimeout(() => cardEls.forEach((ce) => { if (ce.plots.length) drawGraph(ce); }), 120);
  }

  /* ---------------- pictures & PDFs ---------------- */
  const loadImg = (url) => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = url; });
  async function prepImage(file) {
    const url = URL.createObjectURL(file);
    try {
      const im = await loadImg(url);
      let w = im.naturalWidth, h = im.naturalHeight;
      if (!w || !h) return null;
      let blob = file;
      const max = 2200;
      if (w > max || h > max || file.size > 2.5e6) {
        const s = Math.min(1, max / Math.max(w, h));
        const c = document.createElement('canvas');
        c.width = Math.round(w * s);
        c.height = Math.round(h * s);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.88));
        w = c.width;
        h = c.height;
      }
      return { blob, w, h };
    } catch (e) {
      return null;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  async function insertImageFiles(files, at) {
    const list = [...files].filter((f) => f.type.startsWith('image/'));
    if (!list.length) return;
    const added = [];
    let p = at || visibleCenter();
    for (const f of list) {
      const prepared = await prepImage(f);
      if (!prepared) { toast("Couldn't open that picture."); continue; }
      const id = await saveBlob(prepared.blob);
      let { w, h } = prepared;
      const maxW = 520;
      if (w > maxW) { h = (h * maxW) / w; w = maxW; }
      if (h > 700) { w = (w * 700) / h; h = 700; }
      added.push({ type: 'image', x: r1(clamp(p.x - w / 2, 0, PAGE_W - w)), y: r1(Math.max(0, p.y - h / 2)), w: r1(w), h: r1(h), blob: id });
      p = { x: p.x + 30, y: p.y + 30 };
    }
    if (!added.length) return;
    pushHistory();
    S.note.objects.push(...added);
    added.forEach((o) => autoGrow(o.y + o.h));
    setTool('select');
    S.sel = added;
    touchNote();
    selectionChanged();
    render();
    toast(added.length > 1 ? `${added.length} pictures added` : 'Picture added — drag to move, corner to resize.');
  }
  let pdfjsP = null;
  function loadPdfJs() {
    if (pdfjsP) return pdfjsP;
    pdfjsP = new Promise((res, rej) => {
      if (window.pdfjsLib) { res(window.pdfjsLib); return; }
      const s = document.createElement('script');
      s.src = PDFJS;
      s.crossOrigin = 'anonymous';
      s.onload = async () => {
        const lib = window.pdfjsLib;
        if (!lib) { rej(new Error('The PDF reader did not load.')); return; }
        try {
          const code = await (await fetch(PDFJS_WORKER)).blob();
          lib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
        } catch (e) {
          lib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
        }
        res(lib);
      };
      s.onerror = () => rej(new Error('Could not load the PDF reader. PDF import needs an internet connection the first time.'));
      document.head.append(s);
    }).catch((e) => { pdfjsP = null; throw e; });
    return pdfjsP;
  }
  async function importPDF(file) {
    let lib;
    try { lib = await loadPdfJs(); } catch (e) { toast(e.message, 5000); return; }
    toast('Opening PDF…', 10000);
    try {
      const pdf = await lib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
      const total = Math.min(pdf.numPages, 200);
      const n = makeNote(file.name.replace(/\.pdf$/i, ''), folderForNew());
      n.bg = 'blank';
      for (let i = 1; i <= total; i++) {
        const page = await pdf.getPage(i);
        const v1 = page.getViewport({ scale: 1 });
        const vp = page.getViewport({ scale: 2000 / v1.width });
        const c = document.createElement('canvas');
        c.width = Math.round(vp.width);
        c.height = Math.round(vp.height);
        const g = c.getContext('2d');
        g.fillStyle = '#fff';
        g.fillRect(0, 0, c.width, c.height);
        await page.render({ canvasContext: g, viewport: vp }).promise;
        const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.9));
        const id = await saveBlob(blob);
        let w = PAGE_W, h = (PAGE_W * vp.height) / vp.width;
        if (h > PAGE_STEP) { w = (PAGE_STEP * vp.width) / vp.height; h = PAGE_STEP; }
        const top = (i - 1) * PAGE_STEP;
        n.objects.push({ type: 'image', x: r1((PAGE_W - w) / 2), y: r1(top + (PAGE_STEP - h) / 2), w: r1(w), h: r1(h), blob: id, locked: true });
        page.cleanup();
        toast(`Importing page ${i} of ${total}…`, 10000);
      }
      n.height = total * PAGE_STEP;
      if (S.folder === 'trash' || S.folder === 'fav') S.folder = 'all';
      S.notes.push(n);
      persist(n);
      openNote(n);
      setTool('pen');
      toast(total < pdf.numPages ? `Imported the first ${total} of ${pdf.numPages} pages.` : 'PDF imported — write on it with the pen.', 4000);
    } catch (e) {
      toast("Couldn't open that PDF. It may be protected or damaged.", 5000);
    }
  }

  /* ---------------- voice recordings ---------------- */
  let rec = null;
  const recUrls = [];
  const fmtDur = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  function updateRecUI() {
    const st = $('#recState');
    st.hidden = !rec;
    if (rec) st.textContent = `● ${fmtDur((now() - rec.start) / 1000)}  Stop`;
  }
  async function toggleRecording() {
    if (rec) { rec.mr.stop(); return; }
    if (!navigator.mediaDevices || !window.MediaRecorder) { toast("Voice recording isn't supported in this browser."); return; }
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e) { toast('Microphone access was blocked. Allow it in the browser settings to record.', 4500); return; }
    const type = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'].find((t) => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t));
    const mr = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
    const r = { mr, chunks: [], start: now(), stream, note: S.note };
    rec = r;
    mr.ondataavailable = (e) => { if (e.data && e.data.size) r.chunks.push(e.data); };
    mr.onstop = async () => {
      rec = null;
      clearInterval(r.timer);
      r.stream.getTracks().forEach((t) => t.stop());
      updateRecUI();
      const blob = new Blob(r.chunks, { type: mr.mimeType || 'audio/webm' });
      if (!blob.size) return;
      const id = await saveBlob(blob);
      r.note.recordings = r.note.recordings || [];
      r.note.recordings.push({ id: uid(), blob: id, dur: Math.round((now() - r.start) / 1000), created: now(), name: `Recording ${r.note.recordings.length + 1}` });
      r.note.updated = now();
      persist(r.note);
      if (S.note === r.note) renderRecordings();
      toast('Recording saved to this note');
    };
    mr.start(1000);
    r.timer = setInterval(updateRecUI, 500);
    updateRecUI();
    toast('Recording… tap the red timer at the top to stop.', 3000);
  }
  function renderRecordings() {
    const bar = $('#recBar');
    recUrls.splice(0).forEach((u) => URL.revokeObjectURL(u));
    const list = (S.note && S.note.recordings) || [];
    bar.hidden = !list.length;
    bar.innerHTML = '';
    list.forEach((r) => {
      const item = document.createElement('div');
      item.className = 'rec-item';
      const name = document.createElement('button');
      name.className = 'rec-name';
      name.textContent = r.name;
      name.title = 'Rename recording';
      name.onclick = () => {
        const v = (prompt('Rename recording', r.name) || '').trim();
        if (v) { r.name = v; touchNote(); renderRecordings(); }
      };
      const au = document.createElement('audio');
      au.controls = true;
      au.preload = 'metadata';
      // recorded audio often reports no length until played; nudge the browser to work it out
      au.addEventListener('loadedmetadata', () => {
        if (au.duration !== Infinity && !Number.isNaN(au.duration)) return;
        const back = () => { au.removeEventListener('timeupdate', back); au.currentTime = 0; };
        au.addEventListener('timeupdate', back);
        au.currentTime = 1e101;
      });
      getBlob(r.blob).then((b) => { if (b) { const u = URL.createObjectURL(b); recUrls.push(u); au.src = u; } });
      const del = iconBtn('danger', 'Delete recording', ICON.trash, async () => {
        if (!confirm(`Delete "${r.name}"?`)) return;
        S.note.recordings = S.note.recordings.filter((x) => x !== r);
        touchNote();
        renderRecordings();
        await dropBlobs([r.blob]);
      });
      item.append(name, au, del);
      bar.append(item);
    });
  }

  /* ---------------- export, share, print, files ---------------- */
  function download(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  const safeName = (s) => (s || 'note').replace(/[\\/:*?"<>|]+/g, '').trim().slice(0, 60) || 'note';
  function roundRect(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }
  function drawCardTo(g, ce) {
    const { card, root } = ce;
    const w = root.offsetWidth, h = root.offsetHeight;
    g.save();
    g.translate(card.x, card.y);
    roundRect(g, 0, 0, w, h, 12);
    g.fillStyle = '#fff';
    g.fill();
    g.strokeStyle = '#cfd7e2';
    g.lineWidth = 1;
    g.stroke();
    g.fillStyle = '#5d6b7d';
    g.font = `600 12px ${FONT}`;
    g.textBaseline = 'middle';
    g.textAlign = 'left';
    g.fillText('MATH', 30, $('.mhead', root).offsetHeight / 2);
    for (const row of ce.rows.hidden ? [] : ce.rows.children) {
      const line = $('.mline', row), inp = $('.min', row), res = $('.mres', row), dot = $('.mdot', row), sl = $('.mslider', row);
      // every offset here is measured from the card itself
      const y = line.offsetTop + line.offsetHeight / 2;
      if (dot.classList.contains('on')) {
        g.beginPath();
        g.arc(dot.offsetLeft + 5, y, 5, 0, Math.PI * 2);
        if (dot.style.background && dot.style.background !== 'transparent') { g.fillStyle = dot.style.background; g.fill(); }
        else { g.strokeStyle = dot.style.borderColor || '#9aa6b4'; g.lineWidth = 2; g.beginPath(); g.arc(dot.offsetLeft + 5, y, 4, 0, Math.PI * 2); g.stroke(); }
      }
      if (!sl.hidden) {
        const r = $('input', sl), lo = $('.smin', sl), hi = $('.smax', sl);
        const sy = r.offsetTop + r.offsetHeight / 2, x0 = r.offsetLeft + 8, x1 = r.offsetLeft + r.offsetWidth - 8;
        const f = clamp((Number(r.value) - Number(r.min)) / ((Number(r.max) - Number(r.min)) || 1), 0, 1);
        g.lineCap = 'round';
        g.lineWidth = 4;
        g.strokeStyle = '#d6dde6';
        g.beginPath(); g.moveTo(x0, sy); g.lineTo(x1, sy); g.stroke();
        g.strokeStyle = '#2f6fd0';
        g.beginPath(); g.moveTo(x0, sy); g.lineTo(x0 + (x1 - x0) * f, sy); g.stroke();
        g.fillStyle = '#2f6fd0';
        g.beginPath(); g.arc(x0 + (x1 - x0) * f, sy, 7, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#5d6b7d';
        g.font = `11px ${FONT}`;
        g.textAlign = 'left';
        g.fillText(lo.textContent, lo.offsetLeft, sy);
        g.fillText(hi.textContent, hi.offsetLeft, sy);
      }
      g.fillStyle = '#1c2430';
      g.font = '16px "Cambria Math", Cambria, serif';
      g.textAlign = 'left';
      g.fillText(inp.value, inp.offsetLeft + 2, y);
      if (res.textContent) {
        g.fillStyle = row.classList.contains('err') ? '#b3261e' : '#2f5d8a';
        g.font = `600 15px ${FONT}`;
        g.textAlign = 'right';
        g.fillText(res.textContent, res.offsetLeft + res.offsetWidth, y);
      }
    }
    if (!ce.graphBox.hidden) g.drawImage(ce.gcv, ce.graphBox.offsetLeft, ce.graphBox.offsetTop, ce.graphBox.offsetWidth, ce.graphBox.offsetHeight);
    g.restore();
  }
  // live = draw the open note's real math cards; otherwise cards show as plain white cards (thumbnails)
  function drawNoteTo(g, n, y0, h, lw = 1, live = true) {
    paperDark = (PAPERS[n.paper] || PAPERS.white).dark;
    drawPaper(g, n, 0, y0, PAGE_W, h, lw);
    const visible = n.objects.filter((o) => { const b = bbox(o); return !(b.y > y0 + h || b.y + b.h < y0); });
    visible.filter((o) => o.locked).forEach((o) => drawObj(g, o));
    const real = live && n === S.note;
    if (real) {
      cardEls.forEach((ce) => {
        const top = ce.card.y, bottom = top + ce.root.offsetHeight;
        if (bottom >= y0 && top <= y0 + h) drawCardTo(g, ce);
      });
    } else {
      (n.cards || []).forEach((c) => {
        roundRect(g, c.x, c.y, c.w || 380, 40 + (c.lines || []).length * 38 + (c.gh || 0), 12);
        g.fillStyle = '#fff';
        g.fill();
        g.strokeStyle = '#cfd7e2';
        g.lineWidth = lw;
        g.stroke();
      });
    }
    cardsLive = real;
    try { visible.filter((o) => !o.locked).forEach((o) => drawObj(g, o)); } finally { cardsLive = true; }
  }
  function contentHeight(n) {
    let maxY = 300;
    n.objects.forEach((o) => { const b = bbox(o); maxY = Math.max(maxY, b.y + b.h); });
    cardEls.forEach((ce) => { maxY = Math.max(maxY, ce.card.y + ce.root.offsetHeight); });
    return Math.min(n.height, Math.ceil(maxY + 60));
  }
  async function renderPNG() {
    closeTextEditor();
    const n = S.note;
    await ensureImages(n);
    const H = contentHeight(n);
    const sc = Math.min(2, Math.sqrt(30e6 / (PAGE_W * H)));
    const c = document.createElement('canvas');
    c.width = Math.round(PAGE_W * sc);
    c.height = Math.round(H * sc);
    const g = c.getContext('2d');
    g.setTransform(sc, 0, 0, sc, 0, 0);
    drawNoteTo(g, n, 0, H);
    return new Promise((r) => c.toBlob(r, 'image/png'));
  }
  async function exportPNG() {
    const b = await renderPNG();
    if (b) download(b, `${safeName(S.note.title)}.png`);
    else toast('Export failed.');
  }
  async function printNote(asPdf) {
    closeTextEditor();
    const n = S.note;
    toast('Preparing pages…', 4000);
    await ensureImages(n);
    const pages = Math.max(1, Math.ceil(contentHeight(n) / PAGE_STEP));
    const sc = 1.6;
    const urls = [];
    for (let i = 0; i < pages; i++) {
      const c = document.createElement('canvas');
      c.width = Math.round(PAGE_W * sc);
      c.height = Math.round(PAGE_STEP * sc);
      const g = c.getContext('2d');
      g.setTransform(sc, 0, 0, sc, 0, -i * PAGE_STEP * sc);
      drawNoteTo(g, n, i * PAGE_STEP, PAGE_STEP);
      urls.push(c.toDataURL('image/jpeg', 0.92));
    }
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(n.title || 'Note')}</title><style>@page{size:A4;margin:0}html,body{margin:0}img{display:block;width:210mm;height:297mm;page-break-after:always;break-after:page}img:last-child{page-break-after:auto;break-after:auto}</style></head><body>${urls.map((u) => `<img src="${u}" alt="">`).join('')}</body></html>`;
    const fr = document.createElement('iframe');
    fr.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
    let printed = false;
    fr.onload = () => {
      // the frame can fire "load" twice (blank page, then the note); print only once
      const d = fr.contentDocument;
      if (printed || !d || !d.images.length) return;
      printed = true;
      setTimeout(() => {
        try { fr.contentWindow.focus(); fr.contentWindow.print(); } catch (e) { toast("Printing isn't available here."); }
        setTimeout(() => fr.remove(), 60000);
      }, 250);
    };
    fr.srcdoc = html;
    document.body.append(fr);
    if (asPdf) toast('In the print window, choose "Save as PDF" as the printer.', 6000);
  }
  async function shareNote() {
    const blob = await renderPNG();
    if (!blob) { toast('Could not prepare the note for sharing.'); return; }
    const file = new File([blob], `${safeName(S.note.title)}.png`, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: S.note.title || 'Note' }); } catch (e) { if (e.name !== 'AbortError') toast('Sharing failed.'); }
    } else {
      download(blob, file.name);
      toast("Sharing isn't available on this device, so the note was saved as a picture instead.", 4500);
    }
  }
  async function packNotes(notes) {
    const ids = new Set();
    notes.forEach((n) => blobIdsOf(n).forEach((id) => ids.add(id)));
    const blobs = {};
    for (const id of ids) {
      const b = await getBlob(id);
      if (b) blobs[id] = await blobToDataURL(b);
    }
    return { app: 'inkwell', version: 2, exported: new Date().toISOString(), folders: S.folders, notes, blobs };
  }
  async function saveNoteFile() {
    flushSaves();
    const data = await packNotes([S.note]);
    download(new Blob([JSON.stringify(data)], { type: 'application/json' }), `${safeName(S.note.title)}.inkwell.json`);
  }
  async function backup() {
    flushSaves();
    toast('Preparing backup…');
    const data = await packNotes(S.notes.filter((n) => !n.deleted));
    download(new Blob([JSON.stringify(data)], { type: 'application/json' }), `inkwell-backup-${new Date().toISOString().slice(0, 10)}.json`);
  }
  const validNote = (n) => n && typeof n.id === 'string' && Array.isArray(n.objects) && Array.isArray(n.cards) && typeof n.updated === 'number';
  async function restoreBackup(file) {
    try {
      const d = JSON.parse(await file.text());
      if (!d || d.app !== 'inkwell' || !Array.isArray(d.notes)) throw new Error('bad file');
      for (const [id, url] of Object.entries(d.blobs || {})) {
        if (typeof url !== 'string' || !url.startsWith('data:')) continue;
        const existing = await getBlob(id);
        if (existing) continue;
        const b = await dataURLToBlob(url);
        if (S.storageOk) await Store.put('blobs', { id, blob: b, created: now() }).catch(() => memBlobs.set(id, b));
        else memBlobs.set(id, b);
      }
      let added = 0, updated = 0, last = null;
      for (const n of d.notes) {
        if (!validNote(n)) continue;
        normalizeNote(n);
        n.folder = typeof n.folder === 'string' && n.folder ? n.folder : S.folders[0];
        const ex = S.notes.find((x) => x.id === n.id);
        if (!ex) { S.notes.push(n); persist(n); added++; last = n; }
        else if (n.updated > ex.updated) { Object.assign(ex, n); persist(ex); updated++; last = ex; }
      }
      (d.folders || []).forEach((f) => { if (typeof f === 'string' && f && !S.folders.includes(f)) S.folders.push(f); });
      S.notes.forEach((n) => { if (!n.deleted && !S.folders.includes(n.folder)) S.folders.push(n.folder); });
      persistFolders();
      imgCache.clear();
      if (last && d.notes.length === 1) openNote(last);
      else if (S.note) openNote(S.note.deleted ? liveNotes()[0] : S.note);
      toast(`Restored: ${added} new, ${updated} updated.`);
    } catch (e) {
      toast("That file isn't an Inkwell backup or note file.");
    }
  }

  /* ---------------- page sorter ---------------- */
  const shiftObj = (o, dy) => mapPts(o, (x, y) => [x, y + dy]);
  async function openSorter() {
    closeTextEditor();
    closeMenu();
    $('#sorter').hidden = false;
    await renderSorter();
  }
  function closeSorter() { $('#sorter').hidden = true; }
  async function renderSorter() {
    const n = S.note;
    const grid = $('#sorterGrid');
    grid.innerHTML = '';
    await ensureImages(n);
    const count = pageCount(n);
    const w = 150, h = Math.round((w * PAGE_STEP) / PAGE_W), k = Math.min(2, window.devicePixelRatio || 1);
    for (let i = 0; i < count; i++) {
      const item = document.createElement('div');
      item.className = 'pthumb';
      const cv = document.createElement('canvas');
      cv.width = w * k;
      cv.height = h * k;
      cv.style.width = w + 'px';
      cv.style.height = h + 'px';
      cv.title = `Go to page ${i + 1}`;
      const g = cv.getContext('2d');
      const s = (w / PAGE_W) * k;
      g.setTransform(s, 0, 0, s, 0, -i * PAGE_STEP * s);
      drawNoteTo(g, n, i * PAGE_STEP, PAGE_STEP, 5);
      cv.onclick = () => { closeSorter(); el.scroller.scrollTo({ top: i * PAGE_STEP * S.zoom + el.wrap.offsetTop - 12, behavior: 'smooth' }); };
      const bar = document.createElement('div');
      bar.className = 'pbar';
      const up = iconBtn('', 'Move page earlier', ICON.up, () => movePage(i, i - 1));
      up.disabled = i === 0;
      const label = document.createElement('span');
      label.textContent = i + 1;
      const dn = iconBtn('', 'Move page later', ICON.down, () => movePage(i, i + 1));
      dn.disabled = i === count - 1;
      const del = iconBtn('danger', 'Delete page', ICON.trash, () => deletePage(i));
      del.disabled = count === 1;
      bar.append(up, label, dn, del);
      item.append(cv, bar);
      grid.append(item);
    }
  }
  function movePage(i, j) {
    if (j < 0 || j >= pageCount(S.note)) return;
    pushHistory();
    const d = (j - i) * PAGE_STEP;
    S.note.objects.forEach((o) => { const p = pageOfObj(o); if (p === i) shiftObj(o, d); else if (p === j) shiftObj(o, -d); });
    S.note.cards.forEach((c) => { const p = pageOfY(c.y + 40); if (p === i) c.y += d; else if (p === j) c.y -= d; });
    S.sel = [];
    touchNote();
    renderCards();
    render();
    renderSorter();
  }
  function deletePage(i) {
    if (pageCount(S.note) <= 1) return;
    if (!confirm(`Delete page ${i + 1} and everything on it?`)) return;
    pushHistory();
    S.note.objects = S.note.objects.filter((o) => pageOfObj(o) !== i);
    S.note.objects.forEach((o) => { if (pageOfObj(o) > i) shiftObj(o, -PAGE_STEP); });
    S.note.cards = S.note.cards.filter((c) => pageOfY(c.y + 40) !== i);
    S.note.cards.forEach((c) => { if (pageOfY(c.y + 40) > i) c.y -= PAGE_STEP; });
    S.note.height -= PAGE_STEP;
    S.sel = [];
    touchNote();
    applyZoomSize();
    renderCards();
    layoutCanvas();
    renderSorter();
  }

  /* ---------------- reading mode & full screen ---------------- */
  function setReading(on) {
    S.reading = on;
    closeTextEditor();
    S.sel = [];
    document.body.classList.toggle('reading', on);
    const b = $('#act-read');
    if (b) b.classList.toggle('on', on);
    el.cv.dataset.tool = on ? 'read' : S.tool;
    el.layer.querySelectorAll('.min').forEach((i) => { i.readOnly = on; });
    requestLayout();
    render();
    toast(on ? 'Reading mode: drag to scroll. Tap Reading mode again to edit.' : 'Editing again');
  }
  function toggleFullscreen() {
    const d = document;
    if (d.fullscreenElement) { d.exitFullscreen().catch(() => {}); return; }
    if (d.documentElement.requestFullscreen) d.documentElement.requestFullscreen().then(() => setSidebar(false)).catch(() => toast("Full screen isn't available here."));
    else toast("Full screen isn't available here.");
  }

  /* ---------------- menus ---------------- */
  const menu = document.createElement('div');
  menu.id = 'menu';
  menu.className = 'menu';
  menu.hidden = true;
  menu.setAttribute('role', 'menu');
  document.body.append(menu);
  let menuAnchor = null;
  function openMenu(anchor, build) {
    if (!menu.hidden && menuAnchor === anchor) { closeMenu(); return; }
    menu.className = 'menu';
    menu.innerHTML = '';
    build(menu);
    menu.hidden = false;
    menuAnchor = anchor;
    const r = anchor.getBoundingClientRect();
    const mw = menu.offsetWidth, mh = menu.offsetHeight;
    menu.style.left = clamp(r.right - mw, 8, window.innerWidth - mw - 8) + 'px';
    let top = r.bottom + 6;
    if (top + mh > window.innerHeight - 8) top = Math.max(8, r.top - mh - 6);
    menu.style.top = top + 'px';
  }
  function closeMenu() { menu.hidden = true; menuAnchor = null; }
  function mItem(parent, label, icon, fn, cls) {
    const b = document.createElement('button');
    b.setAttribute('role', 'menuitem');
    b.innerHTML = (icon ? svg(icon) : '') + '<span></span>';
    $('span', b).textContent = label;
    if (cls) b.className = cls;
    b.onclick = () => { closeMenu(); fn(); };
    parent.append(b);
    return b;
  }
  function mLabel(parent, text) {
    const d = document.createElement('div');
    d.className = 'menu-label';
    d.textContent = text;
    parent.append(d);
  }
  const mSep = (parent) => { const d = document.createElement('div'); d.className = 'menu-sep'; parent.append(d); };
  function buildStyleMenu(m) {
    mLabel(m, 'Page template');
    const g = document.createElement('div');
    g.className = 'tpl-grid';
    TEMPLATES.forEach(([k, label]) => {
      const b = document.createElement('button');
      b.className = 'tpl' + (S.note.bg === k ? ' on' : '');
      b.innerHTML = `<canvas width="108" height="152"></canvas><span>${label}</span>`;
      const c = $('canvas', b).getContext('2d');
      const s = 108 / PAGE_W;
      c.setTransform(s, 0, 0, s, 0, 0);
      const prevDark = paperDark;
      drawPaper(c, { bg: k, paper: S.note.paper, height: PAGE_STEP }, 0, 0, PAGE_W, PAGE_STEP, 9);
      paperDark = prevDark;
      b.onclick = () => { S.note.bg = k; touchNote(); render(); closeMenu(); };
      g.append(b);
    });
    m.append(g);
    mLabel(m, 'Paper colour');
    const row = document.createElement('div');
    row.className = 'paper-row';
    Object.entries(PAPERS).forEach(([k, p]) => {
      const b = document.createElement('button');
      b.className = 'paper' + (S.note.paper === k ? ' on' : '');
      b.innerHTML = `<i style="--c:${p.bg}"></i><span>${p.name}</span>`;
      b.onclick = () => { S.note.paper = k; touchNote(); render(); closeMenu(); };
      row.append(b);
    });
    m.append(row);
  }
  function buildInsertMenu(m) {
    mItem(m, 'Picture', ICON.image, () => $('#imageInput').click());
    mItem(m, 'Take a photo', ICON.camera, () => $('#cameraInput').click());
    mItem(m, 'PDF (opens as a new note)', ICON.pdf, () => $('#pdfInput').click());
    mItem(m, rec ? 'Stop recording' : 'Voice recording', ICON.mic, toggleRecording);
    mSep(m);
    mItem(m, 'Math & graph card', ICON.math, () => { const p = visibleCenter(); addCard(p.x - 190, p.y - 120); });
    mItem(m, 'Text box', ICON.text, () => { setTool('text'); const p = visibleCenter(); openTextEditor(null, p.x - 80, p.y); });
    mItem(m, 'Blank page', ICON.addPage, addPage);
  }
  function buildSaveMenu(m) {
    mItem(m, 'Picture (PNG)', ICON.image, exportPNG);
    mItem(m, 'PDF', ICON.pdf, () => printNote(true));
    mItem(m, 'Inkwell note file', ICON.file, saveNoteFile);
  }
  function buildMoreMenu(m) {
    mLabel(m, 'Folder');
    const sel = document.createElement('select');
    sel.setAttribute('aria-label', 'Move note to folder');
    [...folderSet()].sort(natCmp).forEach((f) => { const o = document.createElement('option'); o.value = f; o.textContent = folderLabel(f); sel.append(o); });
    sel.value = S.note.folder;
    sel.onchange = () => { S.note.folder = sel.value; touchNote(); renderSidebar(); toast(`Moved to ${folderLabel(sel.value)}`); };
    m.append(sel);
    mSep(m);
    mItem(m, 'Full screen', ICON.full, toggleFullscreen);
    mItem(m, S.reading ? 'Leave reading mode' : 'Reading mode', ICON.book, () => setReading(!S.reading));
    mItem(m, 'Page sorter', ICON.pages, openSorter);
    mItem(m, 'Share', ICON.share, shareNote);
    mItem(m, 'Print', ICON.print, () => printNote(false));
    mItem(m, 'Search notes', ICON.search, openSearch);
    mSep(m);
    mItem(m, 'Handwriting recognition…', ICON.edit, () => setTimeout(() => openMenu($('#moreBtn'), buildOnlineMenu), 0));
    if (Sync) mItem(m, 'Sync with Google Drive…', ICON.cloud, () => setTimeout(() => openMenu($('#syncBtn'), buildSyncMenu), 0));
    mItem(m, 'Back up all notes', ICON.save, backup);
    mItem(m, 'Restore from file', ICON.file, () => $('#restoreInput').click());
    mSep(m);
    mItem(m, S.note.trashed ? 'Delete forever' : 'Move to Trash', ICON.trash, trashNote, 'danger');
  }
  function openSearch() { setSidebar(true); setTimeout(() => { el.search.focus(); el.search.select(); }, 250); }

  /* ---------------- top bar, rail & panel ---------------- */
  function buildActions() {
    const nav = $('#actions');
    nav.innerHTML = '';
    ACTIONS.forEach(([id, label, icon]) => {
      const b = document.createElement('button');
      b.className = 'act act-' + id;
      b.id = 'act-' + id;
      b.title = label;
      b.setAttribute('aria-label', label);
      b.innerHTML = svg(ICON[icon]) + `<span>${label}</span>`;
      b.onclick = () => doAction(id, b);
      nav.append(b);
    });
    const fav = iconBtn('', 'Add to favourites', ICON.star, () => { S.note.fav = !S.note.fav; touchNote(); updateFav(); renderSidebar(); });
    fav.id = 'favBtn';
    const more = iconBtn('dots-icon', 'More options', ICON.more, () => openMenu(more, buildMoreMenu));
    more.id = 'moreBtn';
    nav.append(fav, more);
  }
  function doAction(id, b) {
    switch (id) {
      case 'full': toggleFullscreen(); break;
      case 'read': setReading(!S.reading); break;
      case 'pages': openSorter(); break;
      case 'style': openMenu(b, buildStyleMenu); break;
      case 'insert': openMenu(b, buildInsertMenu); break;
      case 'share': shareNote(); break;
      case 'save': openMenu(b, buildSaveMenu); break;
      case 'print': printNote(false); break;
      case 'search': openSearch(); break;
      default: break;
    }
  }
  function railBtn(label, icon, fn) {
    const b = document.createElement('button');
    b.className = 'rb';
    b.title = label;
    b.setAttribute('aria-label', label);
    b.innerHTML = svg(icon);
    b.onclick = fn;
    return b;
  }
  const railSep = () => { const d = document.createElement('div'); d.className = 'rail-sep'; return d; };
  const COLOR_TOOLS = ['pen', 'highlighter', 'text', 'shape', 'tape', 'restyle'];
  const colorToolOf = () => (COLOR_TOOLS.includes(S.tool) ? S.tool : S.tool === 'select' ? 'select' : 'pen');
  S.recent = Object.assign({
    pen: ['#1c2430', '#d1453b', '#2f6fd0', '#2e9d57', '#f2b01e'],
    highlighter: ['#fff176', '#b9f6ca', '#80d8ff', '#ff9ecb', '#ffcc80'],
  }, prefs.get('recent', {}));
  const recentKey = (tool) => (tool === 'highlighter' ? 'highlighter' : 'pen');
  function pushRecent(tool, c) {
    if (!c) return;
    const k = recentKey(tool);
    S.recent[k] = [c, ...S.recent[k].filter((x) => x.toLowerCase() !== c.toLowerCase())].slice(0, 5);
    prefs.set('recent', S.recent);
  }
  function buildRail() {
    const r = el.rail;
    r.innerHTML = '';
    const addTools = (list) => list.forEach(([id, label, ic]) => {
      const b = railBtn(label, ICON[ic || S.shape], () => { if (id === 'cursor' && S.tool === id && !S.reading) return; if (S.tool === id && !S.reading) setPanel(!S.panelOpen); else setTool(id); });
      b.dataset.tool = id;
      if (COLOR_TOOLS.includes(id) && id !== 'shape') { const d = document.createElement('span'); d.className = 'cdot'; b.append(d); }
      r.append(b);
    });
    addTools(RAIL);
    r.append(railSep());
    const qc = document.createElement('div');
    qc.id = 'quickColors';
    qc.className = 'quick-colors';
    r.append(qc);
    const tb = document.createElement('button');
    tb.className = 'rb thick-btn';
    tb.id = 'thickBtn';
    tb.title = 'Thickness and more settings';
    tb.setAttribute('aria-label', tb.title);
    tb.innerHTML = '<i></i>';
    tb.onclick = () => setPanel(!S.panelOpen);
    r.append(tb, railSep());
    const u = railBtn('Undo (Ctrl+Z)', ICON.undo, undo);
    u.id = 'undoBtn';
    const re = railBtn('Redo (Ctrl+Y)', ICON.redo, redo);
    re.id = 'redoBtn';
    r.append(u, re, railSep());
    addTools(RAIL2);
    const zl = railBtn('Zoom lock', ICON.zoomLock, toggleZoomLock);
    zl.id = 'zoomLockBtn';
    r.append(zl);
  }
  function renderQuick() {
    const qc = $('#quickColors'), tb = $('#thickBtn');
    if (!qc) return;
    const tool = colorToolOf();
    const hide = ['eraser', 'math', 'cursor'].includes(S.tool);
    qc.hidden = false;
    if (tb) tb.hidden = hide;
    const curObj = S.sel.find((o) => o.color);
    const cur = tool === 'select' ? curObj && curObj.color : S.colors[tool];
    qc.innerHTML = '';
    S.recent[recentKey(tool)].forEach((c) => {
      const b = document.createElement('button');
      b.className = 'qc' + (cur && cur.toLowerCase() === c.toLowerCase() ? ' active' : '');
      b.style.setProperty('--c', c);
      b.title = c;
      b.setAttribute('aria-label', 'Colour ' + c);
      b.onclick = () => {
        if (tool === 'select') setSelColor(c);
        else { setToolColor(tool, c); if (!COLOR_TOOLS.includes(S.tool)) setTool('pen'); }
      };
      qc.append(b);
    });
    if (tb) {
      const w = tool === 'select' ? 3 : S.widths[tool] || 3;
      const i = $('i', tb);
      i.style.height = clamp(w / 3, 1.5, 9) + 'px';
    }
  }
  function updateRail() {
    el.rail.querySelectorAll('[data-tool]').forEach((b) => {
      const id = b.dataset.tool;
      b.classList.toggle('active', id === S.tool && !S.reading);
      if (id === 'shape') { const sv = $('svg', b); if (sv) sv.outerHTML = svg(ICON[S.shape]); }
      const d = $('.cdot', b);
      if (d) d.style.setProperty('--c', S.colors[id]);
    });
    const u = $('#undoBtn'), r = $('#redoBtn'), zl = $('#zoomLockBtn');
    if (u) u.disabled = !S.undo.length;
    if (r) r.disabled = !S.redo.length;
    if (zl) { zl.classList.toggle('active', !!S.zoomLock); zl.setAttribute('aria-pressed', String(!!S.zoomLock)); }
    el.cv.dataset.tool = S.reading ? 'read' : S.tool;
    // math cards can be edited with the graph tool; every other tool writes on top of them
    document.body.classList.toggle('cards-live', (S.tool === 'math' || S.tool === 'cursor') && !S.reading);
    renderQuick();
  }
  function positionPanel() {
    if (!S.panelOpen) return;
    const anchor = el.rail.querySelector(`[data-tool="${S.tool}"]`) || $('#thickBtn');
    const stage = $('#stage').getBoundingClientRect();
    const ar = anchor.getBoundingClientRect();
    const pw = el.panel.offsetWidth || 300;
    el.panel.style.left = clamp(ar.left + ar.width / 2 - stage.left - pw / 2, 8, Math.max(8, stage.width - pw - 8)) + 'px';
  }
  function setPanel(open) {
    if (open && S.reading) return;
    S.panelOpen = open;
    document.body.classList.toggle('panel-open', open);
    if (!open) sizeOpen = false;
    updateRail();
    if (open) { renderPanel(); positionPanel(); }
  }
  function setTool(t) {
    if (S.reading) setReading(false);
    if (t !== 'select' && S.sel.length) S.sel = [];
    closeTextEditor();
    S.tool = t;
    prefs.set('tool', t);
    setPanel(false);
    renderPanel();
    render();
  }
  function toggleZoomLock() {
    S.zoomLock = !S.zoomLock;
    prefs.set('zoomLock', S.zoomLock);
    updateRail();
    toast(S.zoomLock ? "Zoom locked: pinching and the zoom buttons won't change the zoom." : 'Zoom unlocked');
  }
  function setToolColor(tool, c) {
    S.colors[tool] = c;
    prefs.set('colors', S.colors);
    pushRecent(tool, c);
    if (tool === 'text') {
      if (editor) { editor.color = c; styleEditor(); }
      else {
        const texts = S.sel.filter((o) => o.type === 'text');
        if (texts.length) { pushHistory(); texts.forEach((o) => { o.color = c; }); touchNote(); render(); }
      }
    }
    updateRail();
    renderPanel();
  }
  function setSelColor(c) {
    const items = S.sel.filter((o) => o.type !== 'image' && !(o.type === 'stroke' && o.tape && o.pattern != null));
    if (!items.length) return;
    pushHistory();
    items.forEach((o) => { o.color = c; });
    pushRecent('pen', c);
    touchNote();
    render();
    updateRail();
    renderPanel();
  }

  /* panel building blocks */
  function pSection(p, label, extra) {
    const s = document.createElement('div');
    s.className = 'psec';
    if (label) {
      const l = document.createElement('div');
      l.className = 'plabel';
      l.innerHTML = '<span></span><span></span>';
      l.firstChild.textContent = label;
      if (extra) l.lastChild.textContent = extra;
      s.append(l);
    }
    p.append(s);
    return s;
  }
  function pDivider(p) { const d = document.createElement('div'); d.className = 'pdiv'; p.append(d); }
  function colorGrid(sec, colors, current, onPick, withNone) {
    const g = document.createElement('div');
    g.className = 'cgrid';
    if (withNone) {
      const b = document.createElement('button');
      b.className = 'sw none' + (current == null ? ' active' : '');
      b.title = 'None';
      b.setAttribute('aria-label', 'No colour');
      b.onclick = () => onPick(null);
      g.append(b);
    }
    colors.forEach((c) => {
      const b = document.createElement('button');
      b.className = 'sw' + (current && current.toLowerCase() === c ? ' active' : '');
      b.style.setProperty('--c', c);
      b.title = c;
      b.setAttribute('aria-label', 'Colour ' + c);
      b.onclick = () => onPick(c);
      g.append(b);
    });
    if (window.EyeDropper) {
      const e = document.createElement('button');
      e.className = 'sw-tool';
      e.title = 'Pick a colour from the screen';
      e.setAttribute('aria-label', e.title);
      e.innerHTML = svg(ICON.eyedropper);
      e.onclick = async () => { try { const r = await new window.EyeDropper().open(); onPick(r.sRGBHex); } catch (_) { /* cancelled */ } };
      g.append(e);
    }
    const ci = document.createElement('input');
    ci.type = 'color';
    ci.className = 'sw-custom';
    ci.title = 'Custom colour';
    ci.setAttribute('aria-label', 'Custom colour');
    if (current && /^#[0-9a-f]{6}$/i.test(current)) ci.value = current;
    ci.addEventListener('change', () => onPick(ci.value));
    g.append(ci);
    sec.append(g);
  }
  // slider with − and + buttons, like a size stepper
  function thickness(p, label, min, max, get, set, previewColor, onStart, kind) {
    const sec = pSection(p, label, label ? String(get()) : null);
    const step = kind === 'opacity' ? 5 : 1;
    const row = document.createElement('div');
    row.className = 'stepper' + (kind === 'opacity' ? ' opacity' : '');
    const minus = document.createElement('button');
    minus.className = 'step';
    minus.innerHTML = svg(ICON.minus);
    minus.setAttribute('aria-label', (label || (kind === 'opacity' ? 'Opacity' : 'Thickness')) + ' down');
    const plus = document.createElement('button');
    plus.className = 'step';
    plus.innerHTML = svg(ICON.plus);
    plus.setAttribute('aria-label', (label || (kind === 'opacity' ? 'Opacity' : 'Thickness')) + ' up');
    const wrapR = document.createElement('div');
    wrapR.className = 'range-wrap';
    const r = document.createElement('input');
    r.type = 'range';
    r.className = 'range';
    r.min = min;
    r.max = max;
    r.step = step;
    r.value = get();
    r.setAttribute('aria-label', label || (kind === 'opacity' ? 'Opacity' : 'Thickness'));
    const bubble = document.createElement('span');
    bubble.className = 'bubble';
    wrapR.append(r, bubble);
    if (kind === 'opacity') wrapR.style.setProperty('--c', previewColor || '#fff176');
    const paint = () => {
      const v = Number(r.value);
      bubble.textContent = v;
      bubble.style.left = `calc(${((v - min) / (max - min)) * 100}% + ${(0.5 - (v - min) / (max - min)) * 22}px)`;
      const lab = sec.querySelector('.plabel span:last-child');
      if (lab) lab.textContent = v;
    };
    const apply = (v) => { r.value = clamp(v, min, max); set(Number(r.value)); paint(); };
    minus.onclick = () => { if (onStart) onStart(); apply(Number(r.value) - step); };
    plus.onclick = () => { if (onStart) onStart(); apply(Number(r.value) + step); };
    if (onStart) r.addEventListener('pointerdown', onStart);
    r.addEventListener('input', () => { set(Number(r.value)); paint(); });
    paint();
    row.append(minus, wrapR, plus);
    sec.append(row);
  }
  function toggle(p, title, desc, get, set) {
    const l = document.createElement('label');
    l.className = 'toggle';
    l.innerHTML = '<span><b></b><small></small></span><input type="checkbox" role="switch">';
    $('b', l).textContent = title;
    $('small', l).textContent = desc || '';
    if (!desc) $('small', l).remove();
    const cb = $('input', l);
    cb.checked = !!get();
    cb.onchange = () => set(cb.checked);
    p.append(l);
  }
  function radioRows(p, items, current, onPick) {
    const box = document.createElement('div');
    box.className = 'radios';
    box.setAttribute('role', 'radiogroup');
    items.forEach(([k, label, icon]) => {
      const b = document.createElement('button');
      b.className = 'radio-row' + (current === k ? ' on' : '');
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', String(current === k));
      b.innerHTML = `<span class="radio"></span>${icon ? svg(icon) : ''}<span></span>`;
      b.lastChild.textContent = label;
      b.onclick = () => onPick(k);
      box.append(b);
    });
    p.append(box);
  }
  function pButton(parent, label, icon, fn, cls) {
    const b = document.createElement('button');
    b.className = 'pbtn' + (cls ? ' ' + cls : '');
    b.innerHTML = (icon ? svg(icon) : '') + '<span></span>';
    $('span', b).textContent = label;
    b.onclick = fn;
    parent.append(b);
    return b;
  }
  function hint(p, html) {
    const d = document.createElement('div');
    d.className = 'hint';
    d.innerHTML = html;
    p.append(d);
  }
  function iconRow(p, items, isOn, onPick, cls) {
    const row = document.createElement('div');
    row.className = 'fmt ' + (cls || '');
    items.forEach(([k, label, icon]) => {
      const b = document.createElement('button');
      b.innerHTML = svg(icon);
      b.title = label;
      b.setAttribute('aria-label', label);
      b.setAttribute('aria-pressed', String(!!isOn(k)));
      b.className = isOn(k) ? 'on' : '';
      b.onclick = () => onPick(k);
      row.append(b);
    });
    p.append(row);
    return row;
  }
  function lineStyleSvg(k) {
    const base = 'viewBox="0 0 64 16" aria-hidden="true" class="ls-svg"';
    if (k === 'taper') return `<svg ${base}><path d="M4 8Q32 1 60 8Q32 15 4 8Z" style="fill:currentColor;stroke:none"/></svg>`;
    const dash = k === 'dash' ? 'stroke-dasharray="9 6"' : k === 'dot' ? 'stroke-dasharray="0.1 7"' : '';
    return `<svg ${base}><path d="M5 8H59" ${dash} style="stroke-width:${k === 'dot' ? 3.6 : 3}"/></svg>`;
  }
  function tapeSample(cv, opts) {
    const g = cv.getContext('2d');
    const k = Math.min(2, window.devicePixelRatio || 1);
    const w = cv.clientWidth || 220, h = cv.clientHeight || 64;
    cv.width = w * k;
    cv.height = h * k;
    g.setTransform(k, 0, 0, k, 0, 0);
    const pts = [];
    for (let i = 0; i <= 30; i++) { const x = 16 + ((w - 32) * i) / 30; pts.push([x, h / 2 + Math.sin(i / 4.5) * 6, 0.5]); }
    const prev = paperDark;
    paperDark = false;
    drawObj(g, Object.assign({ type: 'stroke', pts, pr: false }, opts));
    paperDark = prev;
  }
  let sizeOpen = false;
  let favRemove = false;
  function presetOf(tool) {
    if (tool === 'pen') return { id: uid(), tool, penType: S.penType, width: S.widths.pen, color: S.colors.pen, style: S.lineStyle };
    return { id: uid(), tool, width: S.widths.highlighter, color: S.colors.highlighter, opacity: S.hlOpacity, tip: S.hlTip };
  }
  function applyFav(f) {
    if (f.tool === 'pen') {
      S.penType = f.penType || 'fountain';
      S.lineStyle = f.style || 'solid';
      S.widths.pen = f.width;
      S.colors.pen = f.color;
      prefs.set('penType', S.penType);
      prefs.set('lineStyle', S.lineStyle);
    } else {
      S.widths.highlighter = f.width;
      S.colors.highlighter = f.color;
      S.hlOpacity = f.opacity ?? 45;
      S.hlTip = f.tip || 'chisel';
      prefs.set('hlOpacity', S.hlOpacity);
      prefs.set('hlTip', S.hlTip);
    }
    prefs.set('widths', S.widths);
    prefs.set('colors', S.colors);
    updateRail();
    renderPanel();
  }
  function favSection(p, tool) {
    pDivider(p);
    const mine = S.favPens.filter((f) => f.tool === tool);
    const row = document.createElement('div');
    row.className = 'fav-row';
    mine.forEach((f) => {
      const b = document.createElement('button');
      b.className = 'fav' + (favRemove ? ' removing' : '');
      b.title = favRemove ? 'Remove this favourite' : 'Use this favourite';
      b.setAttribute('aria-label', b.title);
      b.style.setProperty('--c', f.color);
      b.innerHTML = svg(ICON[tool === 'pen' ? 'pen_' + (f.penType || 'fountain') : 'hl_' + (f.tip || 'chisel')]) + '<i></i>';
      b.onclick = () => {
        if (favRemove) {
          S.favPens = S.favPens.filter((x) => x !== f);
          prefs.set('favPens', S.favPens);
          if (!S.favPens.some((x) => x.tool === tool)) favRemove = false;
          renderPanel();
          return;
        }
        applyFav(f);
      };
      row.append(b);
    });
    if (mine.length) p.append(row);
    const ctl = document.createElement('div');
    ctl.className = 'fav-ctl';
    const add = document.createElement('button');
    add.className = 'pill-btn';
    add.title = 'Save the current settings as a favourite';
    add.setAttribute('aria-label', add.title);
    add.innerHTML = svg(ICON.plus);
    add.onclick = () => {
      if (S.favPens.filter((f) => f.tool === tool).length >= 12) { toast('You can keep up to 12 favourites here.'); return; }
      S.favPens.push(presetOf(tool));
      prefs.set('favPens', S.favPens);
      favRemove = false;
      renderPanel();
      toast('Saved to favourites');
    };
    const del = document.createElement('button');
    del.className = 'pill-btn' + (favRemove ? ' on' : '');
    del.title = favRemove ? 'Done removing' : 'Remove favourites';
    del.setAttribute('aria-label', del.title);
    del.innerHTML = svg(favRemove ? ICON.close : ICON.trash);
    del.disabled = !mine.length;
    del.onclick = () => { favRemove = !favRemove; renderPanel(); };
    ctl.append(add, del);
    p.append(ctl);
    if (!mine.length) hint(p, '<p class="center">Save your favourite settings here for quick access.</p>');
    else if (favRemove) hint(p, '<p class="center">Tap a favourite to remove it.</p>');
  }
  function renderPanel() {
    const p = el.panel;
    if (!p || !S.note) return;
    p.innerHTML = '';
    const H = (t) => { const h = document.createElement('div'); h.className = 'ph'; h.textContent = t; p.append(h); };
    const setW = (key) => (v) => { S.widths[key] = v; prefs.set('widths', S.widths); updateRail(); };
    const lineStylesRow = (current, onPick) => {
      const ls = document.createElement('div');
      ls.className = 'line-styles';
      LINE_STYLES.forEach(([k, label]) => {
        const b = document.createElement('button');
        b.className = 'ls' + (current === k ? ' on' : '');
        b.title = label;
        b.setAttribute('aria-label', label + ' line');
        b.setAttribute('aria-pressed', String(current === k));
        b.innerHTML = lineStyleSvg(k);
        b.onclick = () => onPick(k);
        ls.append(b);
      });
      p.append(ls);
    };
    const typeRow = (items, current, onPick, colour) => {
      const row = document.createElement('div');
      row.className = 'pen-types';
      items.forEach(([k, label, icon]) => {
        const b = document.createElement('button');
        b.className = 'pen-type' + (current === k ? ' on' : '');
        b.title = label;
        b.setAttribute('aria-label', label);
        b.setAttribute('aria-pressed', String(current === k));
        b.style.setProperty('--c', colour);
        b.innerHTML = svg(icon) + '<i></i>';
        b.onclick = () => onPick(k);
        row.append(b);
      });
      p.append(row);
    };
    switch (S.tool) {
      case 'pen': {
        typeRow(PEN_TYPES.map(([k, l]) => [k, l, ICON['pen_' + k]]), S.penType, (k) => { S.penType = k; prefs.set('penType', k); renderPanel(); }, S.colors.pen);
        thickness(p, null, 1, 24, () => S.widths.pen, setW('pen'), S.colors.pen);
        lineStylesRow(S.lineStyle, (k) => { S.lineStyle = k; prefs.set('lineStyle', k); renderPanel(); });
        toggle(p, 'Straighten lines', '', () => S.straighten.pen, (v) => { S.straighten.pen = v; prefs.set('straighten', S.straighten); });
        toggle(p, 'Hold to snap shapes', '', () => S.snap, (v) => { S.snap = v; prefs.set('snap', v); });
        toggle(p, 'Draw with pen only', 'Fingers scroll and zoom instead.', () => S.penOnly, (v) => { S.penOnly = v; prefs.set('penOnly', v); });
        colorGrid(pSection(p), PALETTE, S.colors.pen, (c) => setToolColor('pen', c));
        favSection(p, 'pen');
        break;
      }
      case 'highlighter': {
        typeRow([['chisel', 'Chisel tip', ICON.hl_chisel], ['round', 'Round tip', ICON.hl_round]], S.hlTip, (k) => { S.hlTip = k; prefs.set('hlTip', k); renderPanel(); }, S.colors.highlighter);
        thickness(p, null, 6, 60, () => S.widths.highlighter, setW('highlighter'), S.colors.highlighter);
        thickness(p, null, 10, 90, () => S.hlOpacity, (v) => { S.hlOpacity = v; prefs.set('hlOpacity', v); }, S.colors.highlighter, null, 'opacity');
        toggle(p, 'Straighten lines', '', () => S.straighten.highlighter, (v) => { S.straighten.highlighter = v; prefs.set('straighten', S.straighten); });
        toggle(p, 'Adjust thickness to text', '', () => S.fitText.highlighter, (v) => { S.fitText.highlighter = v; prefs.set('fitText', S.fitText); });
        colorGrid(pSection(p), HL_PALETTE.concat(PALETTE.slice(4, 32)), S.colors.highlighter, (c) => setToolColor('highlighter', c));
        favSection(p, 'highlighter');
        break;
      }
      case 'tape': {
        H('Tape');
        const pv = document.createElement('div');
        pv.className = 'tape-preview';
        const cv = document.createElement('canvas');
        pv.append(cv);
        p.append(pv);
        const sample = () => tapeSample(cv, { tape: true, width: Math.min(40, S.widths.tape), color: S.colors.tape, pattern: S.tapeKind === 'pattern' ? S.tapePattern : null });
        requestAnimationFrame(sample);
        thickness(p, null, 12, 80, () => S.widths.tape, (v) => { setW('tape')(v); sample(); }, S.colors.tape);
        toggle(p, 'Straighten lines', '', () => S.straighten.tape, (v) => { S.straighten.tape = v; prefs.set('straighten', S.straighten); });
        toggle(p, 'Adjust thickness to text', '', () => S.fitText.tape, (v) => { S.fitText.tape = v; prefs.set('fitText', S.fitText); });
        pDivider(p);
        const tabs = document.createElement('div');
        tabs.className = 'seg-pill';
        [['color', 'Colour'], ['pattern', 'Pattern']].forEach(([k, l]) => {
          const b = document.createElement('button');
          b.textContent = l;
          b.className = S.tapeKind === k ? 'on' : '';
          b.onclick = () => { S.tapeKind = k; prefs.set('tapeKind', k); renderPanel(); };
          tabs.append(b);
        });
        p.append(tabs);
        if (S.tapeKind === 'color') {
          colorGrid(pSection(p), PALETTE, S.colors.tape, (c) => setToolColor('tape', c));
        } else {
          const g = document.createElement('div');
          g.className = 'tape-grid';
          TAPE_PATTERNS.forEach((t, i) => {
            const b = document.createElement('button');
            b.className = 'tape-sw' + (S.tapePattern === i ? ' on' : '');
            b.setAttribute('aria-label', `Tape pattern ${i + 1}`);
            const c = document.createElement('canvas');
            b.append(c);
            b.onclick = () => { S.tapePattern = i; prefs.set('tapePattern', i); renderPanel(); };
            g.append(b);
            requestAnimationFrame(() => {
              const k = Math.min(2, window.devicePixelRatio || 1);
              c.width = (c.clientWidth || 100) * k;
              c.height = (c.clientHeight || 26) * k;
              const gc = c.getContext('2d');
              gc.scale(k, k);
              gc.fillStyle = tapePattern(gc, i);
              gc.fillRect(0, 0, c.width, c.height);
            });
          });
          p.append(g);
        }
        hint(p, '<p>Tap a piece of tape to show or hide what is underneath. Handy for studying.</p>');
        break;
      }
      case 'restyle':
        H('Change style');
        typeRow(PEN_TYPES.map(([k, l]) => [k, l, ICON['pen_' + k]]), S.restylePen, (k) => { S.restylePen = k; prefs.set('restylePen', k); renderPanel(); }, S.colors.restyle);
        thickness(p, null, 1, 48, () => S.widths.restyle, setW('restyle'), S.colors.restyle);
        lineStylesRow(S.restyleStyle, (k) => { S.restyleStyle = k; prefs.set('restyleStyle', k); renderPanel(); });
        colorGrid(pSection(p), PALETTE, S.colors.restyle, (c) => setToolColor('restyle', c));
        hint(p, '<p>Brush over handwriting to give it this pen type, line style, thickness and colour. Shapes take the colour and thickness; typed text takes the colour.</p>');
        break;
      case 'eraser':
        radioRows(p, [['stroke', 'Stroke eraser'], ['area', 'Area eraser']], S.eraseMode, (k) => { S.eraseMode = k; prefs.set('eraseMode', k); renderPanel(); });
        if (S.eraseMode === 'area') thickness(p, null, 8, 120, () => S.widths.eraser, setW('eraser'));
        toggle(p, 'Erase highlighter only', '', () => S.eraseHlOnly, (v) => { S.eraseHlOnly = v; if (v) S.eraseTapeOnly = false; prefs.set('eraseHlOnly', v); prefs.set('eraseTapeOnly', S.eraseTapeOnly); renderPanel(); });
        toggle(p, 'Erase tape only', '', () => S.eraseTapeOnly, (v) => { S.eraseTapeOnly = v; if (v) S.eraseHlOnly = false; prefs.set('eraseTapeOnly', v); prefs.set('eraseHlOnly', S.eraseHlOnly); renderPanel(); });
        pDivider(p);
        pButton(p, 'Erase all handwriting', null, eraseAll, 'round-btn');
        break;
      case 'select': {
        radioRows(p, [['lasso', 'Lasso', ICON.lasso], ['rect', 'Rectangle', ICON.rectSel]], S.lassoMode, (k) => { S.lassoMode = k; prefs.set('lassoMode', k); renderPanel(); });
        toggle(p, 'Include partially selected objects', '', () => S.lassoPartial, (v) => { S.lassoPartial = v; prefs.set('lassoPartial', v); });
        if (!S.sel.length) {
          if (clip) { pDivider(p); pButton(p, 'Paste', ICON.copy, pasteClip); }
          break;
        }
        pDivider(p);
        const n = S.sel.length;
        const sec = pSection(p, `${n} item${n > 1 ? 's' : ''} selected`);
        const row = document.createElement('div');
        row.className = 'prow';
        pButton(row, 'Copy', ICON.copy, () => copySel());
        pButton(row, 'Duplicate', ICON.dup, duplicateSel);
        pButton(row, 'Delete', ICON.trash, deleteSelected, 'danger');
        sec.append(row);
        if (inkStrokes().length && window.MathInk) {
          const mrow = document.createElement('div');
          mrow.className = 'prow';
          pButton(mrow, 'Convert to math', ICON.math || ICON.sliders, convertSelToMath);
          pButton(mrow, 'Teach symbol', ICON.edit, teachSymbol);
          sec.append(mrow);
        }
        const lines = S.sel.filter((o) => o.type === 'stroke' || o.type === 'shape');
        if (lines.length) thickness(p, 'Thickness', 1, 80, () => lines[0].width, (v) => { lines.forEach((o) => { o.width = v; }); touchNote(); render(); }, null, () => pushHistory());
        if (S.sel.some((o) => o.type !== 'image')) {
          const cur = S.sel.find((o) => o.type !== 'image');
          colorGrid(pSection(p, 'Change colour'), PALETTE, cur && cur.color, setSelColor);
        }
        break;
      }
      case 'text': {
        const ts = editor ? editor.style : S.textStyle;
        const sizeRow = document.createElement('div');
        sizeRow.className = 'size-row';
        sizeRow.innerHTML = `<span class="size-ic" aria-hidden="true">${svg('M4 7V5h9v2 M8.5 5v14 M6.5 19h4 M17 6v12 M14.5 8.5L17 6l2.5 2.5 M14.5 15.5L17 18l2.5-2.5')}</span>`;
        const dd = document.createElement('button');
        dd.className = 'size-dd';
        dd.setAttribute('aria-label', 'Text size');
        dd.setAttribute('aria-expanded', String(sizeOpen));
        dd.innerHTML = `<span>${ts.size}</span>${svg(ICON.chevDown)}`;
        dd.onclick = () => { sizeOpen = !sizeOpen; renderPanel(); };
        sizeRow.append(dd);
        p.append(sizeRow);
        if (sizeOpen) {
          const list = document.createElement('div');
          list.className = 'size-list';
          TEXT_SIZES.forEach((s) => {
            const b = document.createElement('button');
            b.textContent = s;
            b.className = s === ts.size ? 'on' : '';
            b.onclick = () => { sizeOpen = false; setTextStyle({ size: s }); };
            list.append(b);
          });
          p.append(list);
        }
        const f2 = document.createElement('div');
        f2.className = 'fmt spread';
        [['bold', 'B', 'Bold', 'font-weight:700'], ['italic', 'I', 'Italic', 'font-style:italic;font-family:Georgia,serif'], ['underline', 'U', 'Underline', 'text-decoration:underline'], ['strike', 'S', 'Strikethrough', 'text-decoration:line-through']].forEach(([k, t, label, css]) => {
          const b = document.createElement('button');
          b.innerHTML = `<span style="${css}">${t}</span>`;
          b.title = label;
          b.setAttribute('aria-label', label);
          b.setAttribute('aria-pressed', String(!!ts[k]));
          b.className = ts[k] ? 'on' : '';
          b.onclick = () => setTextStyle({ [k]: !ts[k] });
          f2.append(b);
        });
        p.append(f2);
        colorGrid(pSection(p, 'Text colour'), PALETTE, editor ? editor.color : S.colors.text, (c) => setToolColor('text', c));
        colorGrid(pSection(p, 'Text background'), HL_PALETTE.slice(0, 7), ts.bg, (c) => setTextStyle({ bg: c }), true);
        iconRow(p, [['check', 'Checklist', ICON.listCheck], ['bullet', 'Bulleted list', ICON.listBullet], ['number', 'Numbered list', ICON.listNumber]], (k) => ts.list === k, (k) => setTextStyle({ list: ts.list === k ? null : k }), 'spread');
        iconRow(p, [['left', 'Align left', ICON.alignLeft], ['center', 'Align centre', ICON.alignCenter], ['right', 'Align right', ICON.alignRight], ['in', 'Increase indent', ICON.indent], ['out', 'Decrease indent', ICON.outdent]],
          (k) => (k === 'in' || k === 'out' ? false : (ts.align || 'left') === k),
          (k) => {
            if (k === 'in') setTextStyle({ indent: clamp((ts.indent || 0) + 1, 0, 6) });
            else if (k === 'out') setTextStyle({ indent: clamp((ts.indent || 0) - 1, 0, 6) });
            else setTextStyle({ align: k });
          }, 'spread');
        pDivider(p);
        pButton(p, 'Add text box', ICON.text, () => { const c = visibleCenter(); setPanel(false); openTextEditor(null, c.x - 80, c.y); }, 'round-btn');
        break;
      }
      case 'shape': {
        H('Shapes');
        const sec = pSection(p, 'Shape');
        const g = document.createElement('div');
        g.className = 'shape-grid';
        SHAPES.forEach(([k, label]) => {
          const b = document.createElement('button');
          b.innerHTML = svg(ICON[k]);
          b.title = label;
          b.setAttribute('aria-label', label);
          b.className = S.shape === k ? 'on' : '';
          b.onclick = () => { S.shape = k; prefs.set('shape', k); updateRail(); renderPanel(); };
          g.append(b);
        });
        sec.append(g);
        toggle(p, 'Fill', '', () => S.fill, (v) => { S.fill = v; prefs.set('fill', v); });
        thickness(p, null, 1, 24, () => S.widths.shape, setW('shape'), S.colors.shape);
        colorGrid(pSection(p), PALETTE, S.colors.shape, (c) => setToolColor('shape', c));
        hint(p, '<p>Drag on the page to draw. Hold <code>Shift</code> for a perfect square, circle or 45° line.</p>');
        break;
      }
      case 'math':
        H('Math & graphs');
        hint(p, '<p>Tap the page to add a math card, then type one item per line:</p>'
          + '<p><code>y = x^2 - 3</code> draws a graph<br><code>f(x) = sin(x)/x</code> defines and draws a function<br><code>a = 2</code> makes a slider you can drag<br><code>15% of 80 =</code> shows the answer<br><code>f(3) =</code> uses your function</p>'
          + '<p>Drag a graph to move it; scroll or pinch to zoom. Variables are shared by every card in the note.</p>'
          + '<p>To annotate a graph, switch to the pen, highlighter or any other tool and write on top of it. Your notes move with the card. Come back to this tool to edit the equations.</p>');
        pButton(p, 'Add a math card here', ICON.math, () => { const c = visibleCenter(); setPanel(false); addCard(c.x - 190, c.y - 120); });
        break;
      default: break;
    }
    positionPanel();
  }

  function wireLibrary() {
    const ico = (id, icon) => $(id).insertAdjacentHTML('afterbegin', svg(icon));
    $('#libMenu').innerHTML = svg(ICON.menu);
    $('#homeBtn').innerHTML = svg(ICON.grid);
    ico('#libBack', ICON.chevL);
    ico('#libCreate', ICON.edit);
    ico('#libImport', ICON.pdf);
    ico('#libNewFolder', ICON.folder);
    ico('#libEmptyTrash', ICON.trash);
    ico('#libSort', ICON.sortIcon);
    $('#libMenu').onclick = () => setSidebar(document.body.classList.contains('side-collapsed'));
    $('#homeBtn').onclick = () => setLibrary(true);
    $('#libBack').onclick = () => setLibrary(false);
    $('#libCreate').onclick = newNote;
    $('#libImport').onclick = () => $('#pdfInput').click();
    $('#libNewFolder').onclick = () => newFolder();
    $('#libEmptyTrash').onclick = async () => { await emptyTrash(); setLibrary(true); };
    $('#libSearch').addEventListener('input', (e) => { S.query = e.target.value; el.search.value = S.query; renderSidebar(); });
    const sortBtn = $('#libSort');
    sortBtn.onclick = () => openMenu(sortBtn, (m) => {
      SORTS.forEach(([k, label]) => mItem(m, label, null, () => { S.sort.by = k; prefs.set('sort', S.sort); renderSidebar(); }, S.sort.by === k ? 'on' : ''));
    });
    $('#libDir').onclick = () => { S.sort.dir = S.sort.dir === 'asc' ? 'desc' : 'asc'; prefs.set('sort', S.sort); renderSidebar(); };
  }

  /* ---------------- sidebar toggle ---------------- */
  const isNarrow = () => window.matchMedia('(max-width: 760px)').matches;
  function setSidebar(open) {
    document.body.classList.toggle('side-collapsed', !open);
    setTimeout(() => { requestLayout(); redrawGraphs(); }, 240);
  }

  /* ---------------- wiring ---------------- */
  function wire() {
    el.cv.addEventListener('pointerdown', onDown);
    el.cv.addEventListener('pointermove', onMove);
    el.cv.addEventListener('pointerup', onUp);
    el.cv.addEventListener('pointercancel', onCancel);
    el.cv.addEventListener('lostpointercapture', (e) => { if (action && e.pointerId === action.pointerId && e.pointerType !== 'mouse') onCancel(e); });
    el.cv.addEventListener('dblclick', (e) => {
      if (S.tool !== 'select' || S.reading) return;
      const p = pagePt(e);
      const t = topHit(p.x, p.y, 4 / S.zoom);
      if (t && t.type === 'text') { S.sel = []; openTextEditor(t); }
    });
    el.cv.addEventListener('contextmenu', (e) => e.preventDefault());
    el.scroller.addEventListener('scroll', requestLayout, { passive: true });
    el.scroller.addEventListener('wheel', (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      setZoom(S.zoom * Math.exp(-e.deltaY * 0.0015), e.clientX, e.clientY);
    }, { passive: false });
    el.scroller.addEventListener('dragover', (e) => {
      if (![...(e.dataTransfer.types || [])].includes('Files')) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      el.scroller.classList.add('drop-hint');
    });
    el.scroller.addEventListener('dragleave', () => el.scroller.classList.remove('drop-hint'));
    el.scroller.addEventListener('drop', (e) => {
      el.scroller.classList.remove('drop-hint');
      const files = [...(e.dataTransfer.files || [])];
      if (!files.length) return;
      e.preventDefault();
      const pdf = files.find((f) => f.type === 'application/pdf' || /\.pdf$/i.test(f.name));
      if (pdf) importPDF(pdf);
      else insertImageFiles(files, pagePt(e));
    });
    const onResize = () => {
      if (libOpen) return; // the page is re-measured when it shows again
      positionPanel();
      if (S.note && S.autoFit && !S.zoomLock) {
        const before = S.zoom;
        fitZoom();
        if (Math.abs(before - S.zoom) > 1e-3) redrawGraphs();
      }
      requestLayout();
    };
    if (window.ResizeObserver) new ResizeObserver(onResize).observe(el.scroller);
    window.addEventListener('resize', onResize);

    $('#menuBtn').innerHTML = svg(ICON.menu);
    $('#newFolderBtn').innerHTML = svg(ICON.plus);
    $('#zoomInBtn').innerHTML = svg(ICON.zoomIn);
    $('#zoomOutBtn').innerHTML = svg(ICON.zoomOut);
    $('#addPageBtn').innerHTML = svg(ICON.addPage);
    $('#sorterClose').innerHTML = svg(ICON.close);
    $('#menuBtn').onclick = () => setSidebar(document.body.classList.contains('side-collapsed'));
    $('#backdrop').onclick = () => setSidebar(false);
    $('#newNoteBtn').onclick = newNote;
    $('#newFolderBtn').onclick = newFolder;
    $('#backupBtn').onclick = backup;
    const zoomBy = (f) => { if (S.zoomLock) { toast('Zoom is locked. Tap the zoom lock button to unlock it.'); return; } setZoom(S.zoom * f); };
    $('#zoomInBtn').onclick = () => zoomBy(1.2);
    $('#zoomOutBtn').onclick = () => zoomBy(1 / 1.2);
    $('#zoomLabel').onclick = editZoom;
    $('#fitWidthBtn').innerHTML = svg(ICON.fitWidth);
    $('#fitWidthBtn').onclick = fitWidth;
    $('#addPageBtn').onclick = addPage;
    $('#recState').onclick = toggleRecording;
    $('#restoreNoteBtn').onclick = () => restoreNote(S.note);
    $('#purgeNoteBtn').onclick = () => purgeNote(S.note, true);
    $('#sorterClose').onclick = closeSorter;
    $('#sorterAdd').onclick = () => { addPage(); renderSorter(); };
    $('#sorter').addEventListener('pointerdown', (e) => { if (e.target.id === 'sorter') closeSorter(); });
    $('#restoreInput').addEventListener('change', (e) => { const f = e.target.files[0]; if (f) restoreBackup(f); e.target.value = ''; });
    const onPick = (e, fn) => { const files = [...e.target.files]; e.target.value = ''; if (files.length) fn(files); };
    $('#imageInput').addEventListener('change', (e) => onPick(e, (f) => insertImageFiles(f)));
    $('#cameraInput').addEventListener('change', (e) => onPick(e, (f) => insertImageFiles(f)));
    $('#pdfInput').addEventListener('change', (e) => onPick(e, (f) => importPDF(f[0])));
    el.search.addEventListener('input', () => { S.query = el.search.value; $('#libSearch').value = S.query; renderSidebar(); });
    wireLibrary();
    el.title.addEventListener('input', () => { S.note.title = el.title.value; touchNote(); });
    el.title.addEventListener('keydown', (e) => { if (e.key === 'Enter') el.title.blur(); });
    // keep the text box focused while using text settings
    el.panel.addEventListener('mousedown', (e) => { if (editor && e.target.closest('button')) e.preventDefault(); });

    document.addEventListener('pointerdown', (e) => {
      if (!menu.hidden && !menu.contains(e.target) && !(menuAnchor && menuAnchor.contains(e.target))) closeMenu();
    });
    document.addEventListener('paste', (e) => {
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      const files = [...((e.clipboardData && e.clipboardData.files) || [])].filter((f) => f.type.startsWith('image/'));
      if (files.length) { e.preventDefault(); insertImageFiles(files); return; }
      if (clip) { e.preventDefault(); pasteClip(); }
    });
    document.addEventListener('keydown', (e) => {
      const t = e.target;
      if (e.key === 'Escape') { closeMenu(); if (!$('#sorter').hidden) closeSorter(); }
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      if (libOpen) return;
      const k = e.key.toLowerCase();
      const mod = e.ctrlKey || e.metaKey;
      if (mod && k === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if (mod && (k === 'y' || (k === 'z' && e.shiftKey))) { e.preventDefault(); redo(); return; }
      if (mod && (k === '=' || k === '+')) { e.preventDefault(); setZoom(S.zoom * 1.2); return; }
      if (mod && k === '-') { e.preventDefault(); setZoom(S.zoom / 1.2); return; }
      if (mod && k === '0') { e.preventDefault(); fitWidth(); return; }
      if (mod && k === 'c') { if (S.sel.length) { e.preventDefault(); copySel(); } return; }
      if (mod && k === 'x') { if (S.sel.length) { e.preventDefault(); cutSel(); } return; }
      if (mod && k === 'd') { e.preventDefault(); duplicateSel(); return; }
      if (mod && k === 'a') { if (S.tool === 'select') { e.preventDefault(); S.sel = S.note.objects.filter((o) => !o.locked); selectionChanged(); render(); } return; }
      if (mod && k === 'p') { e.preventDefault(); printNote(false); return; }
      if (mod || e.altKey) return;
      if (k === 'delete' || k === 'backspace') { if (S.sel.length) { e.preventDefault(); deleteSelected(); } return; }
      if (k === 'escape') { if (S.sel.length) { S.sel = []; selectionChanged(); render(); } return; }
      if (S.reading) return;
      const map = { k: 'cursor', v: 'select', l: 'select', p: 'pen', h: 'highlighter', e: 'eraser', t: 'text', m: 'math', r: 'shape', a: 'tape', c: 'restyle' };
      if (map[k]) setTool(map[k]);
    });
    document.addEventListener('fullscreenchange', () => { const b = $('#act-full'); if (b) b.classList.toggle('on', !!document.fullscreenElement); requestLayout(); });
    window.addEventListener('pagehide', flushSaves);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushSaves(); });

    let deferred = null;
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; el.installBtn.hidden = false; });
    el.installBtn.onclick = async () => {
      if (!deferred) return;
      deferred.prompt();
      try { await deferred.userChoice; } catch (_) { /* ignore */ }
      deferred = null;
      el.installBtn.hidden = true;
    };
    window.addEventListener('appinstalled', () => { el.installBtn.hidden = true; toast('Inkwell installed'); });
  }

  /* ---------------- handwritten maths ---------------- */
  const ONLINE_KEY = 'inkwell-myscript';
  const onlineKeys = () => { try { return JSON.parse(localStorage.getItem(ONLINE_KEY) || 'null'); } catch (e) { return null; } };
  let learnedInk = [];
  function inkStrokes() { return S.sel.filter((o) => o.type === 'stroke' && !isHL(o) && !isTape(o)); }
  async function convertSelToMath() {
    const ink = inkStrokes();
    if (!ink.length || !window.MathInk) { toast('Select some handwriting first.'); return; }
    const pts = ink.map((o) => o.pts.map((p) => [p[0], p[1]]));
    let lines = null, how = 'offline';
    const keys = onlineKeys();
    if (keys && keys.app && keys.hmac && navigator.onLine) {
      try { toast('Recognising…', 8000); lines = await MathInk.recognizeOnline(pts, keys); how = 'online'; }
      catch (e) { toast(e.message + ' — using offline recognition.', 3000); }
    }
    if (!lines || !lines.length) lines = MathInk.recognize(pts);
    if (!lines.length) { toast("Couldn't read that handwriting."); return; }
    let x1 = Infinity, y1 = Infinity, x2 = -Infinity;
    ink.forEach((o) => o.pts.forEach(([x, y]) => { x1 = Math.min(x1, x); y1 = Math.min(y1, y); x2 = Math.max(x2, x); }));
    pushHistory();
    S.note.objects = S.note.objects.filter((o) => !ink.includes(o));
    S.sel = [];
    const w = Math.max(360, Math.min(PAGE_W, x2 - x1 + 60));
    const c = { id: uid(), x: r1(clamp(x1 - 10, 0, PAGE_W - w)), y: r1(Math.max(0, y1 - 10)), w, gh: 240, lines, view: { cx: 0, cy: 0, s: 30 } };
    S.note.cards.push(c);
    touchNote();
    setTool('math');
    renderCards();
    autoGrow(c.y + 360);
    render();
    toast(`Read as: ${lines.join('  ·  ')}${how === 'offline' ? ' — tap a line to fix it if needed' : ''}`, 5000);
  }
  function teachSymbol() {
    const ink = inkStrokes();
    if (!ink.length || !window.MathInk) { toast('Select the handwriting of one symbol first.'); return; }
    const sym = (prompt('Which symbol is this? (for example 7, x, +, ( or sqrt)') || '').trim();
    if (!sym) return;
    let x1 = Infinity, y1 = Infinity;
    ink.forEach((o) => o.pts.forEach(([x, y]) => { x1 = Math.min(x1, x); y1 = Math.min(y1, y); }));
    const strokes = ink.map((o) => o.pts.map((p) => [Math.round(p[0] - x1), Math.round(p[1] - y1)]));
    MathInk.learn(strokes, sym);
    learnedInk.unshift({ sym, strokes });
    learnedInk = learnedInk.slice(0, 400);
    if (S.storageOk) Store.put('meta', { key: 'ink-learned', list: learnedInk, updated: now() }).catch(() => {});
    toast(`Learned "${sym}". Teach each symbol 2–3 times for the best results.`, 3500);
  }
  function buildOnlineMenu(m) {
    const k = onlineKeys() || {};
    mLabel(m, 'Handwriting recognition');
    const p = document.createElement('div');
    p.className = 'sync-info';
    p.innerHTML = '<p>Offline recognition always works and learns the symbols you teach it. For better results when online, you can add keys from a free MyScript developer account.</p>'
      + '<p class="muted">The keys are stored only on this device and never put in the app\'s code.</p>';
    const a = document.createElement('input');
    a.placeholder = 'Application key';
    a.value = k.app || '';
    const h = document.createElement('input');
    h.placeholder = 'HMAC key';
    h.type = 'password';
    h.value = k.hmac || '';
    [a, h].forEach((i) => { i.autocomplete = 'off'; i.spellcheck = false; i.setAttribute('aria-label', i.placeholder); p.append(i); });
    m.append(p);
    m.classList.add('wide');
    mItem(m, 'Save keys', ICON.save, () => {
      try {
        if (a.value.trim() && h.value.trim()) localStorage.setItem(ONLINE_KEY, JSON.stringify({ app: a.value.trim(), hmac: h.value.trim() }));
        else localStorage.removeItem(ONLINE_KEY);
        toast(a.value.trim() ? 'Online recognition is on when connected.' : 'Online recognition is off.');
      } catch (e) { toast('Could not save the keys on this device.'); }
    });
  }

  /* ---------------- sync (Google Drive, works offline first) ---------------- */
  const SYNC_TEXT = {
    off: 'Sync is off', syncing: 'Syncing…', ok: 'Synced', offline: 'Offline — saved on this device', error: 'Sync problem', auth: 'Sync paused — tap to sign in again',
  };
  const Sync = window.InkwellSync ? window.InkwellSync({
    pref: (k, d) => prefs.get(k, d), prefSet: (k, v) => prefs.set(k, v),
    metaGet: (k) => Store.get('meta', k), metaPut: (v) => Store.put('meta', v), metaDel: (k) => Store.del('meta', k),
    toast, notes: () => S.notes, folders: () => S.folders, foldersUpdated: () => S.foldersUpdated || 0,
    setFolders(list, updated) {
      const set = new Set(list.filter((f) => typeof f === 'string' && f));
      S.notes.forEach((n) => { if (!n.deleted && n.folder) set.add(n.folder); });
      if (!set.size) return;
      S.folders = [...set];
      S.foldersUpdated = updated;
      if (S.storageOk) Store.put('meta', { key: 'folders', list: S.folders, updated }).catch(() => {});
    },
    validNote, blobIdsOf, getBlob,
    hasBlob: async (id) => memBlobs.has(id) || (S.storageOk && !!(await Store.get('blobs', id).catch(() => null))),
    putBlob: async (id, blob) => { if (S.storageOk) await Store.put('blobs', { id, blob, created: now() }).catch(() => memBlobs.set(id, blob)); else memBlobs.set(id, blob); imgCache.delete(id); },
    serialize: (n) => JSON.parse(JSON.stringify(n)),
    flush: flushSaves,
    beforeLeave: flushSaves,
    isEditing: (n) => S.note === n && (!!action || !!editor || !!(document.activeElement && document.activeElement.closest && document.activeElement.closest('.mcard'))),
    addNote(r) {
      normalizeNote(r);
      if (!r.deleted && !S.folders.includes(r.folder)) { S.folders.push(r.folder); persistFolders(); }
      S.notes.push(r);
      if (S.storageOk) Store.put('notes', r).catch(() => {});
    },
    replaceNote(l, r) {
      normalizeNote(r);
      for (const k of Object.keys(l)) if (!(k in r)) delete l[k];
      Object.assign(l, r);
      if (!l.deleted && !S.folders.includes(l.folder)) { S.folders.push(l.folder); persistFolders(); }
      if (S.storageOk) Store.put('notes', l).catch(() => {});
      if (S.note === l) syncOpenNoteChanged = true;
    },
    keepConflictCopy(l) {
      const c = JSON.parse(JSON.stringify(l));
      c.id = uid();
      c.title = (l.title || 'Untitled') + ' (copy from this device)';
      c.updated = now();
      S.notes.push(c);
      persist(c);
      toast('A note was changed on two devices. Both versions were kept.', 5000);
    },
    refresh() {
      if (syncOpenNoteChanged && S.note) {
        syncOpenNoteChanged = false;
        if (S.note.deleted || S.note.trashed) { openNote(liveNotes()[0] || S.note); return; }
        const top = el.scroller.scrollTop, left = el.scroller.scrollLeft;
        S.sel = [];
        el.title.value = S.note.title;
        renderCards();
        renderRecordings();
        layoutCanvas();
        el.scroller.scrollTop = top;
        el.scroller.scrollLeft = left;
        render();
      }
      renderSidebar();
    },
    onStatus(s, d) {
      const b = $('#syncBtn');
      if (!b) return;
      b.dataset.state = s;
      b.title = SYNC_TEXT[s] + (d ? ' — ' + d : '');
      b.setAttribute('aria-label', b.title);
      b.hidden = false;
    },
  }) : null;
  let syncOpenNoteChanged = false;
  function buildSyncMenu(m) {
    const info = Sync.info();
    mLabel(m, 'Sync with Google Drive');
    const p = document.createElement('div');
    p.className = 'sync-info';
    const when = info.last ? new Date(info.last).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'not yet';
    if (info.connected) {
      p.innerHTML = '<p></p><p class="muted"></p>';
      p.children[0].textContent = SYNC_TEXT[info.status] + (info.account ? ` · ${info.account}` : '');
      p.children[1].textContent = info.detail || `Last synced: ${when}. Notes are always saved on this device first, so you can keep writing offline.`;
      m.append(p);
      if (info.status === 'auth') mItem(m, 'Sign in again', ICON.cloud, () => { try { Sync.resume(); } catch (e) { toast(e.message); } });
      else mItem(m, 'Sync now', ICON.cloud, () => Sync.syncNow());
      mSep(m);
      mItem(m, 'Disconnect this device', ICON.trash, () => {
        if (confirm('Stop syncing on this device? Your notes stay here and in Google Drive.')) Sync.disconnect().then(() => toast('Sync turned off on this device'));
      }, 'danger');
      return;
    }
    p.innerHTML = '<p>Keep notes the same on your PC and tablet. Notes are saved on each device first and work offline; when you are online they are copied to a private app folder in your own Google Drive (it does not show up among your Drive files).</p>'
      + '<p class="muted">One-time setup: create a free Google client ID (see the guide in SYNC-SETUP.md) and paste it here. Add these two addresses to it:</p>'
      + '<p class="muted">Authorised JavaScript origin</p><code class="sync-o"></code><p class="muted">Authorised redirect URI</p><code class="sync-uri"></code>';
    $('.sync-o', p).textContent = location.origin;
    $('.sync-uri', p).textContent = info.redirect;
    const inp = document.createElement('input');
    inp.placeholder = 'Google client ID';
    inp.value = info.key || '';
    inp.autocomplete = 'off';
    inp.spellcheck = false;
    inp.setAttribute('aria-label', 'Google client ID');
    p.append(inp);
    m.append(p);
    m.classList.add('wide');
    mItem(m, 'Connect Google Drive', ICON.cloud, () => { try { Sync.connect(inp.value); } catch (e) { toast(e.message); } });
  }

  /* ---------------- start ---------------- */
  async function init() {
    if (window.innerWidth < 1100) document.body.classList.add('side-collapsed');
    buildActions();
    buildRail();
    wire();
    try {
      const [notes, meta] = await Promise.all([Store.all('notes'), Store.all('meta')]);
      S.notes = (notes || []).filter(validNote).map(normalizeNote);
      const f = (meta || []).find((m) => m.key === 'folders');
      if (f && Array.isArray(f.list) && f.list.length) { S.folders = f.list; S.foldersUpdated = f.updated || 0; }
      const li = (meta || []).find((m) => m.key === 'ink-learned');
      if (li && Array.isArray(li.list) && window.MathInk) { learnedInk = li.list; MathInk.loadLearned(learnedInk); }
    } catch (e) {
      S.storageOk = false;
      toast("Storage isn't available here, so notes won't be kept after closing.", 6000);
    }
    // empty notes that sat in the Trash for more than 30 days
    const cutoff = now() - 30 * 24 * 3600 * 1000;
    for (const n of trashNotes()) if (n.trashed < cutoff) purgeNote(n, false);
    if (!liveNotes().length) {
      const w = welcomeNote();
      S.notes.push(w);
      persist(w);
      persistFolders();
    }
    const last = prefs.get('lastNote');
    openNote(liveNotes().find((n) => n.id === last) || visibleNotes()[0] || liveNotes()[0]);
    setLibrary(true); // the app opens on the folders screen; the last note waits behind it
    setTimeout(gcAllBlobs, 4000);
    const sb = $('#syncBtn');
    if (sb) { sb.innerHTML = svg(ICON.cloud) + '<i></i>'; sb.onclick = () => (Sync ? openMenu(sb, buildSyncMenu) : null); sb.hidden = !Sync; if (Sync) Sync.info && sb.setAttribute('data-state', 'off'); }
    if (Sync && S.storageOk) Sync.start();
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }
  init();
})();
