# Sync your notes between devices (Dropbox)

Inkwell always saves notes on the device first, so it works fully offline.
When you are online and connected, it copies your notes to a private folder in
**your own** Dropbox (`Apps/<your app name>`) and brings in changes from your
other devices. If the same note was changed on two devices while offline, both
versions are kept.

## One-time setup (about 5 minutes, free, no card needed)

1. Go to <https://www.dropbox.com/developers/apps> and sign in to Dropbox.
2. Click **Create app**:
   - **Scoped access**
   - **App folder** (Inkwell can then only see its own folder, nothing else in your Dropbox)
   - Name: anything unique, for example `Inkwell Notes yourname`
3. Open the **Permissions** tab and tick:
   - `files.content.write`
   - `files.content.read`
   - `account_info.read`

   Then click **Submit** at the bottom.
4. Open the **Settings** tab:
   - Under **OAuth 2 → Redirect URIs** add both addresses (click *Add* after each one):
     - `https://wridoy.github.io/inkwell-notes/`
     - `http://localhost:5174/` (only needed for testing on the PC)
   - Make sure **Allow public clients (Implicit Grant & PKCE)** is set to **Allow**.
   - Copy the **App key**. It is not a password, but keep it to yourself anyway.
5. In Inkwell, tap the **cloud** button in the top bar (or **More → Sync with Dropbox…**),
   paste the App key and tap **Connect Dropbox**. Allow access when Dropbox asks.
6. Do step 5 on your other devices (PC and tablet) with the same App key.

The cloud button shows a dot: **green** = synced, **blue** = syncing,
**yellow** = offline (changes wait on the device), **red** = needs attention.

The sign-in is remembered on each device. The app key and sign-in are stored only
on your devices, never in the app's code on GitHub.

# Handwritten maths

- Write a formula with the pen, for example `A = 30°` or `y = sin(A)`.
- Choose the **lasso**, circle the handwriting, and tap **Convert to math**.
  The handwriting becomes a math line with a graph and sliders; Undo brings it back.
- If a symbol is read wrongly, lasso just that one symbol and tap **Teach symbol**.
  Teaching each tricky symbol 2–3 times makes the offline reader much better.
- Optional, for better results when online: in **More → Handwriting recognition…**
  enter keys from a free MyScript developer account (<https://developer.myscript.com>).
  Without keys, or when offline, the built-in reader is used.
