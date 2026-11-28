# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Inkwell Notes is a handwriting and live-maths notes app for PC and tablet (S Pen). It is an installable, offline-first PWA written in plain browser JavaScript. There is no framework, no bundler, no `package.json`, no dependencies, no linter and no test suite. Everything under `app/` is served as-is.

## Commands

- Run locally: `node app\server.js`, then open http://localhost:5173 (set `PORT` to change the port). In this app, start it with the `inkwell` config in `.claude/launch.json` (preview_start).
- Deploy: push to `main`. `.github/workflows/pages.yml` uploads the `app/` folder unchanged to GitHub Pages at https://wridoy.github.io/inkwell-notes/.
- Checking a change means running it in the browser preview. Nothing else verifies the code.

## Architecture

`app/index.html` loads three classic scripts in this order, and each one exposes one global:

1. `sync.js` → `window.InkwellSync(host)`: a factory for Google Drive sync.
2. `mathink.js` → `window.MathInk`: turns handwriting into maths.
3. `app.js`: the whole app inside one IIFE (about 5,000 lines). It is split into sections marked `/* ---------------- name ---------------- */` (storage, state, notes, folders, library, history, drawing, pointer input, math engine, math cards, graphs, pictures & PDFs, sync, start, …). Grep for those markers to find your way around.

Key points:

- **State and storage.** All runtime state lives in one object, `S`, in `app.js`. Notes, blobs (images and audio) and meta records (folders, sync state, sync auth, learned symbols) are stored in IndexedDB (`inkwell`, version 2, stores `notes` / `meta` / `blobs`) through the `Store` helper. UI preferences go in `localStorage['inkwell-prefs']` through `prefs.get/set`. When IndexedDB is unavailable, `S.storageOk` is false and blobs fall back to the in-memory `memBlobs`.
- **Coordinates.** A page is `PAGE_W = 1000` units wide. Each A4 page is `PAGE_STEP = 1414` units tall.
- **Folders** are nested as `"Parent/Child"` path strings.
- **Sync boundary.** `sync.js` never touches app state directly. `app.js` passes in a host adapter (`InkwellSync({ pref, metaGet, metaPut, notes, addNote, replaceNote, putBlob, isEditing, flush, ... })`). Keep that contract when you change either side.
  - Sync uses Google OAuth implicit flow (`response_type=token`, so no client secret) with the `drive.appdata` scope. Files live in the hidden `appDataFolder`.
  - Changes are pulled through the Drive changes API.
  - A remote update for a note that is being edited is held back until editing stops. When both devices changed the same note, both versions are kept.
  - The user enters their own Client ID (`BUILT_IN_CLIENT_ID` is empty). The OAuth redirect URI is `location.origin + location.pathname`.
- **MathInk.** Offline recognition is a point-cloud matcher in the style of $P. It uses built-in symbol templates plus symbols the user teaches it (saved in meta, loaded with `MathInk.loadLearned`). A layout parser handles lines, fractions and powers. Online recognition through MyScript is optional and uses keys the user keeps in `localStorage`.
- **The math engine and graphs** (expression parsing and evaluation, sliders, graph-line styles) are in `app.js`, not in `mathink.js`.
- **PDF import** loads pdf.js from cdnjs the first time it is needed (`PDFJS` constant). It is the only external runtime dependency.

## Releasing changes (service worker)

`app/sw.js` fetches from the network first and falls back to the cache named `CACHE` (for example `inkwell-v14`).

- **Bump `CACHE`** on every release. Past commits did this every time.
- **Keep `ASSETS` up to date** when you add or rename a file in `app/`.

`app.js` checks for a new service worker whenever the app comes back to the front, and every 30 minutes. It reloads only when the user isn't drawing or typing (`action`/`editor` are both unset), and it calls `flushSaves()` first.

## Conventions

- Plain ES2020+ with `'use strict'`, no modules and no build step. Don't add npm dependencies or tooling unless asked.
- User-facing text (toasts, menus, `SYNC-SETUP.md`) is short and plain-English, written for a non-technical user.
- `SYNC-SETUP.md` is the end-user guide for Drive sync, handwritten maths and graph line styles. Update it when those features change.
- The cloud sync button exists twice (`#syncBtn` in the note top bar and `#libSync` on the home screen); both carry `.sync-btn` and are updated together.
