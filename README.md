# Inkwell Notes

Handwritten notes with live maths graphs for PC and tablet (S Pen), as an installable web app
that works offline and can sync through your own Google Drive.

**Use it:** <https://wridoy.github.io/inkwell-notes/>. On a tablet, open it in Chrome →
⋮ → *Add to home screen* → *Install*.

## What's in this folder

| Path | What it is |
| --- | --- |
| `app/` | The app itself. Everything in here is published to the website. |
| `app/index.html`, `app/styles.css`, `app/app.js` | Page, look and main logic (pen, tools, notes, maths cards, graphs). |
| `app/sync.js` | Offline-first sync through Google Drive. |
| `app/mathink.js` | Handwriting → maths reader (offline, with optional online upgrade). |
| `app/sw.js`, `app/manifest.webmanifest`, `app/icons/` | What makes it installable and work offline. |
| `app/server.js` | Tiny local web server for trying the app on this PC. |
| `SYNC-SETUP.md` | How to set up Google Drive sync, handwritten maths and graph line styles. |
| `.github/workflows/pages.yml` | Publishes `app/` to GitHub Pages on every push to `main`. |
| `.claude/launch.json` | Lets Claude start the local preview. |

## Try it on this PC

```powershell
node app\server.js
```

Then open <http://localhost:5173>.

## Publish changes

Commit, then push to `main`. The website updates by itself within about a minute.
