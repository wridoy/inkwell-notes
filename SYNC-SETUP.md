# Sync your notes between devices (Google Drive)

Inkwell always saves notes on the device first, so it works fully offline.
When you are online and connected, it copies your notes, pictures and folders
to a private app folder in **your own** Google Drive and brings in changes from
your other devices. This folder is hidden: it does not show up among your Drive
files, and Inkwell cannot see any of your other files. If the same note was
changed on two devices while offline, both versions are kept.

## One-time setup (about 10 minutes, free, no card needed)

1. Go to <https://console.cloud.google.com/> and sign in with your Google account.
   Accept the terms if asked.
2. At the top, click the project picker → **New project**. Name it `Inkwell Notes` → **Create**,
   then make sure the new project is selected.
3. Turn on Google Drive for it: search for **Google Drive API** in the top search bar →
   open it → **Enable**.
4. Set up the sign-in screen: search for **Google Auth Platform** (also called
   *OAuth consent screen*) → **Get started**:
   - App name: `Inkwell Notes`, support email: your email → Next
   - Audience: **External** → Next
   - Contact email: your email → Next → agree → **Create**
5. Still in Google Auth Platform, open **Audience** → under **Test users** click
   **Add users** and add your own Google address. (The app stays in "testing" mode,
   which is fine for personal use.)
6. Open **Clients** → **Create client**:
   - Application type: **Web application**, name: `Inkwell`
   - **Authorised JavaScript origins** → add:
     - `https://wridoy.github.io`
     - `http://localhost:5173` (only for testing on the PC)
   - **Authorised redirect URIs** → add:
     - `https://wridoy.github.io/inkwell-notes/`
     - `http://localhost:5173/`
   - Click **Create** and copy the **Client ID** (it ends in `.apps.googleusercontent.com`).
     You do **not** need the client secret. Never paste it anywhere.
7. In Inkwell, tap the **cloud** button: it is at the top of the folders screen, and in the top bar
   when a note is open (or use **More → Sync with Google Drive…** inside a note).
   Then paste the Client ID and tap **Connect Google Drive**.
   Google will say it hasn't verified the app: that's expected for your own app.
   Tap **Continue** and allow access.
8. Do step 7 on your other devices (PC and tablet) with the same Client ID.

## Good to know

- The cloud button shows a dot: **green** = synced, **blue** = syncing,
  **yellow** = offline (changes wait on the device), **red** = needs attention.
- Google gives browser apps a sign-in pass that lasts one hour. When you open
  Inkwell, it renews this automatically. The page jumps to Google and back for a moment.
  If you keep writing for more than an hour, the dot turns red. Tap it and choose
  **Sign in again**; usually no password is needed. Your notes are safe on the
  device the whole time and sync as soon as you sign in.
- Your pen, highlighter and other tool settings, your colour swatches, saved favourite
  pens and the default style for new notes sync too. The last change wins.
  A few settings belong to each device and stay there: **Draw with pen only**, zoom lock,
  and which note or tool is open.
  A device you connect for the first time takes the settings your other devices already share.
- The Client ID and sign-in are stored only on your devices, never in the app's code on GitHub.

# Handwritten maths

- Write a formula with the pen, for example `y = sin(x)` or `a = 2`.
- Choose the **lasso**, circle the handwriting, and tap **Convert to math**.
  The handwriting becomes a math line with a graph and sliders; Undo brings it back.
- If a symbol is read wrongly, lasso just that one symbol and tap **Teach symbol**.
  Teaching each tricky symbol 2–3 times makes the offline reader much better.
- Optional, for better results when online: in **More → Handwriting recognition…**
  enter keys from a free MyScript developer account (<https://developer.myscript.com>).
  Without keys, or when offline, the built-in reader is used.

# Graph lines

In a math card, tap the coloured dot next to a graph line to change its colour,
thickness and line style (solid, dashed, dotted), or switch the line off.
