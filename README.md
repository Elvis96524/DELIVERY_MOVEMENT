# Delivery Record

Installable web app (PWA). All data lives in `data.json` in your GitHub repo, so every device sees the same information.

**How saving works:** regular devices need **no token**. They talk to a tiny free Cloudflare Worker that holds the GitHub token privately and writes to `data.json` for them. Admins can still connect a device straight to GitHub with a token if they want (⚙ Sync settings, visible only after admin sign-in).

## What goes where

| Goes in the GitHub repo (root) | Purpose |
|---|---|
| `index.html`, `manifest.json`, `service-worker.js`, `icon-192.png`, `icon-512.png` | The app |
| `data.json` | The shared data (starts empty) |
| `config.json` | Holds the sync address (you fill it in at step 4) |

`cloudflare-worker/worker.js` does **not** go in the repo. It is pasted into Cloudflare (step 3).

## Setup (one time, ~15 minutes)

### 1. GitHub repo + Pages
1. Create a repo and upload all the repo files above (*Add file → Upload files*).
2. *Settings → Pages → Deploy from a branch → `main` / `(root)` → Save.* Your app will be at `https://YOUR-USERNAME.github.io/REPO-NAME/`.

### 2. Create the token (used only by the Worker, never by devices)
GitHub → *Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token*
- Repository access: **Only select repositories** → this repo
- Permissions → Repository permissions → **Contents: Read and write**
- Copy the `github_pat_…` value.

### 3. Create the Worker (free Cloudflare account)
1. dash.cloudflare.com → *Workers & Pages → Create → Create Worker* → name it e.g. `delivery-record-sync` → *Deploy*.
2. *Edit code* → delete the sample → paste the contents of `worker.js` → *Deploy*.
3. *Settings → Variables and Secrets* → add:

| Name | Type | Value |
|---|---|---|
| `GITHUB_TOKEN` | **Secret** | the token from step 2 |
| `GITHUB_OWNER` | Text | your GitHub username |
| `GITHUB_REPO` | Text | the repo name |
| `ALLOWED_ORIGIN` | Text | `https://YOUR-USERNAME.github.io` (no repo name, no trailing `/`) |
| `GITHUB_BRANCH` | Text | optional — only if not `main` |
| `DATA_PATH` | Text | optional — only if not `data.json` |

4. Test: open `https://delivery-record-sync.YOUR-SUBDOMAIN.workers.dev/data` in a browser. You should see text starting `{"sha":"…","content":"…"}`. If you see an error message, it says which setting is wrong.

### 4. Point the app at the Worker
In your GitHub repo, open `config.json` → pencil icon → set:
```json
{
  "syncUrl": "https://delivery-record-sync.YOUR-SUBDOMAIN.workers.dev"
}
```
(no `/data` on the end) → *Commit*. Wait ~1 minute for Pages to update.

### 5. Use it
Open the app URL on any device — it connects automatically (badge shows **Synced**). Then *Add to Home Screen / Install app*.

**First time only:** the sign-in page asks you to create the **admin PIN**. Do this yourself right away — whoever opens a brand-new app first gets to set it. Then add your drivers (next section).

## Sign-in (IDs and PINs)

- Nobody gets in without an ID and PIN: the sign-in page appears on any device that isn't signed in.
- **Admin:** ID is `admin`, plus the admin PIN you created. After signing in, tap **🔒 Admin** to manage drivers.
- **Drivers:** in **🔒 Admin → Manage driver access**, create a **Driver ID** (3–20 letters/numbers, e.g. `ahmad01`), the driver's name and a 4–6 digit PIN. Give the ID and PIN to the driver. IDs are not case-sensitive.
- **Reset PIN** or **Delete** a driver from the same screen. A deleted driver is locked out the next time their device refreshes.
- Once signed in, a device **stays signed in until someone taps Log out** (even after closing the app). A driver is signed out automatically only if the admin deletes their ID, and the admin is signed out if the admin PIN is changed.

## Good to know

- Devices refresh about every 30 seconds and when the app is reopened; **⟳ Refresh** does it immediately.
- **Not hardened security.** Anyone who has the app address can read and change the data; the driver/admin PINs control the *screens*, not the file. `ALLOWED_ORIGIN` blocks other websites, not determined people. Every save is a GitHub commit, so a bad change can be restored from the repo's *History* on `data.json`.
- A public repo means `data.json` is readable by anyone. Keep the repo private if the data is sensitive (GitHub Pages on private repos needs a paid plan).
- If two devices save at nearly the same moment, the second one is asked to redo its change.
- After uploading a new `index.html`, change `CACHE_VERSION` in `service-worker.js` (e.g. `v6` → `v7`) so installed copies update.
- No Worker? Leave `syncUrl` empty and the app works the old way: each device pastes a token in ⚙ Sync settings.
