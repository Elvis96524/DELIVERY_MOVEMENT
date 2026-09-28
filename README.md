# Delivery Record

Installable web app (PWA). All data lives in `data.json` in your GitHub repo, so every phone sees the same information. Changes upload and refresh **automatically**.

## Files (all go in the repo root)

| File | Purpose |
|---|---|
| `index.html`, `manifest.json`, `service-worker.js`, `icon-192.png`, `icon-512.png` | The app |
| `data.json` | The shared data (starts empty) |

No `config.json` is needed. (It is optional — see "Optional: Cloudflare Worker" at the bottom.)

## Setup (one time, ~10 minutes)

### 1. GitHub repo + Pages
1. Upload all the files above to your repo (*Add file → Upload files*, replace the old ones).
2. *Settings → Pages → Deploy from a branch → `main` / `(root)` → Save.* The app is then at `https://YOUR-USERNAME.github.io/REPO-NAME/`.

### 2. Create the access token
GitHub → *Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token*
- Expiration: choose the longest you are allowed (and note the date — see "If the token expires").
- Repository access: **Only select repositories** → this repo
- Permissions → Repository permissions → **Contents: Read and write** (nothing else)
- Copy the `github_pat_…` value.

### 3. Connect your own phone (admin)
Open the app address. The first screen says **Connect this phone** → paste the token → **Connect this phone**.
Then create the **admin PIN** (do this right away — whoever connects first sets it).

### 4. Connect the drivers' phones (one tap each)
1. Sign in as admin → **🔒 Admin → Connect a driver's phone**.
2. Tap **Copy link** (or **Share…**) and send the link to the driver, e.g. by WhatsApp.
3. The driver opens the link. Their phone connects by itself and asks for their ID and PIN. The token is removed from the address bar immediately.
4. *Add to Home Screen* (iPhone: Safari → Share → Add to Home Screen; Android: Chrome → Install app).
   If the home-screen icon asks to **Connect this phone** again, open the same link from inside the icon (or paste it into the box) — on some phones the icon has its own storage.

## Sign-in (IDs and PINs)

- Nobody gets in without an ID and PIN.
- **Admin:** ID is `admin`, plus the admin PIN. After signing in, tap **🔒 Admin** to manage drivers.
- **Drivers:** in **🔒 Admin → Manage driver access**, create a **Driver ID** (3–20 letters/numbers, e.g. `ahmad01`), the driver's name and a 4–6 digit PIN. Give the ID and PIN to the driver. IDs are not case-sensitive.
- **Reset PIN** or **Delete** a driver from the same screen. A deleted driver is locked out the next time their phone refreshes.
- Once signed in, a phone **stays signed in until someone taps Log out**. A driver is signed out automatically only if the admin deletes their ID, and the admin is signed out if the admin PIN is changed.

## Automatic saving and updating

- Every change uploads within a couple of seconds. Every phone checks for other people's changes every 20 seconds, when the app is reopened, and when the phone comes back online. **⟳ Refresh** does it immediately.
- **Two people saving at the same time is fine.** The app combines both people's changes instead of overwriting one.
- **No signal?** The change is kept on the phone (even if the app is closed) and uploads by itself, retrying every few seconds, once the connection is back.
- **The badge tells you the state:** **● Synced** = saved and up to date · **○ Saving…** = uploading · **⚠ Offline — will retry** = waiting for a connection · **⚠ Access problem** = this phone's token no longer works (see below).

## If the token expires (or you want to cut access)

Phones show **⚠ Access problem** (their unsent changes stay safe on the phone). To fix:
1. Create a new token on GitHub (step 2). Delete the old one there if you want to cut access immediately.
2. On your phone: **⚙ Sync settings** → paste the new token → **Save & connect**.
3. **🔒 Admin → Connect a driver's phone** → send the new link to the drivers. Opening it reconnects them; they stay signed in.

## Good to know

- **The token is on every phone that uses the link.** It only allows reading and writing this one repo's files, but anyone holding it (or anyone who reads it from a phone) can change your data — and, because the app itself is in the same repo, could also change the app. Only send the link to people you trust, and never post it anywhere public. Do not put the token in any file in the repo: GitHub cancels tokens it finds in public repos automatically.
- The PINs control the *screens*, not the data file. Every save is a GitHub commit, so a bad change can be restored from the repo's *History* on `data.json`.
- A public repo means `data.json` is readable by anyone. Keep the repo private if the data is sensitive (GitHub Pages on private repos needs a paid plan).
- After uploading a new `index.html`, change `CACHE_VERSION` in `service-worker.js` (e.g. `v8` → `v9`) so installed copies update.
- Pre-filled address (only needed if the app is NOT on `USERNAME.github.io/REPO`): add `?gh_owner=USERNAME&gh_repo=REPO` to the app address.

## Optional: Cloudflare Worker (phones without tokens)

If you'd rather not put the token on phones, a small free Cloudflare Worker can hold it instead. Paste `cloudflare-worker/worker.js` into a new Worker, add the settings listed at the top of that file (`GITHUB_TOKEN` as a Secret, `GITHUB_OWNER`, `GITHUB_REPO`, `ALLOWED_ORIGIN`), then add a `config.json` to the repo root containing:

```json
{ "syncUrl": "https://YOUR-WORKER.YOUR-SUBDOMAIN.workers.dev" }
```

Phones then connect automatically with nothing to enter. Skip this if you use the token method above.
