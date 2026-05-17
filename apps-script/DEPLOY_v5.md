# Apps Script Deploy — v5 (Document Upload to Google Drive)

**For:** REUNION-DOCS-UPLOAD-001 (Round 5 — admin document upload page)
**Date staged:** 2026-05-17
**Operator action required:** yes — paste Code.gs + re-deploy web app + grant Drive permission on first run

---

## What changed in v5

- New `handleDocumentUpload(data)` handler called via `doPost` when `type === 'document_upload'`
- Decodes a base64-encoded file payload from the new `admin-documents.html` page
- Creates the file in a Drive folder named **"Rowell Reunion 2026 Documents"** (auto-created on first upload)
- Sets sharing to **anyone-with-link can view** so the URL in the listing is openable
- Records metadata in a new **"Documents"** sheet tab (auto-created on first upload) with columns: timestamp, uploaded_by, title, description, filename, mime_type, size_bytes, drive_url, drive_id
- Returns the Drive URL + file ID to the client so the upload UI can render an "Open file →" link

All existing handlers (registration / RSVP / feedback / generations / payment-confirm onEdit) are unchanged.

---

## Operator deploy steps (one-time)

### Step 1: Update Code.gs
1. Open the Apps Script project:
   `https://script.google.com/u/0/home/projects/1VKBTaHCQ1jFtDtyQamZ0wiA5F2PEEzwLTnqA5KcWfixivQWiEFiyuS9L/edit`
2. Replace the entire `Code.gs` contents with the current `apps-script/Code.gs` from this repo. Save (`⌘S`).

### Step 2: Re-deploy the Web App
1. `Deploy` → `Manage deployments`
2. Click the pencil-edit icon on the active web-app deployment
3. Set `Version` to `New version`
4. Description: `v5 — document upload to Drive`
5. Click `Deploy`
6. Confirm the URL is **unchanged** (same SHEETS_URL the site already calls)

### Step 3: Grant Drive permission on first upload
The first time `handleDocumentUpload` runs, Apps Script will prompt for **Google Drive permission** (DriveApp access) since the project hasn't used Drive before. To do this proactively before a real upload:

1. In the Apps Script editor, open `Code.gs`
2. From the function dropdown at the top, select `handleDocumentUpload`
3. Click `▶ Run` (it will fail because of missing input, but the *permission prompt* fires)
4. Grant access when prompted (Drive scope)
5. After granting, the function will execute and fail with `"Missing filename or file_base64"` — that error is expected from a manual run. Permissions are now granted; real uploads through the web page will work.

(If you skip this step, the first upload from the site will fail with an "Authorization required" error visible in the form's red status banner. Then come back and do step 3, and subsequent uploads will succeed.)

### Step 4: Test end-to-end with one file
1. Open `https://rowell-family-reunion.netlify.app/admin-documents.html`
2. Enter the admin password (`Rowell2026`)
3. Fill in title, your name, and pick a small test file (e.g., any PDF under 5 MB)
4. Click **Upload Document**
5. Within ~10 seconds you should see a green success banner with an "Open file →" link
6. Confirm:
   - The file opens in Google Drive
   - The file appears in the **"Existing Documents"** table on the page
   - A new tab named `Documents` exists in the Google Sheet with the metadata row
   - A new folder named `Rowell Reunion 2026 Documents` exists in your Google Drive

If something fails, check Apps Script → **Executions** (left sidebar) for the failed run + stack trace.

---

## Where files live

- **Drive folder:** `Rowell Reunion 2026 Documents` (in the root of your Google Drive — `https://drive.google.com/drive/my-drive`)
- **Drive permissions:** every uploaded file is set to "Anyone with the link can view." The folder itself is private to you by default; you can leave it that way (the per-file links work independently) or share the folder with Cassandra / other committee members if you want them to browse via Drive directly.
- **Spreadsheet listing:** `Documents` tab in the existing Rowell Reunion Sheet
- **Site-side listing:** `admin-documents.html` reads from the Documents sheet tab via gviz (same pattern as the dashboard reads Registrations)

---

## File size + security

- **Max upload size:** ~5 MB per file. Apps Script's `doPost` body cap is ~6 MB; base64 inflates by ~33%, so 5 MB raw is the safe ceiling. The client warns and blocks above 5 MB.
- **For larger files** (event-photo archives, etc.): upload to the `Rowell Reunion 2026 Documents` folder in Drive directly and they'll appear if you also add a manual row to the Documents sheet (timestamp / uploaded_by / title / drive_url / etc.). Or skip the sheet — anyone with the folder shared can browse directly.
- **Security model:** the admin page is password-gated (`Rowell2026`, same as Dashboard). Uploads only fire after unlock. **However**, every uploaded file is set to anyone-with-link-can-view — do not upload sensitive material (banking credentials, social security numbers, etc.) since the URL is effectively the access token. For genuinely sensitive docs, upload to Drive manually with restricted sharing.

---

## Reverting if v5 breaks

1. **Disable just the new handler:** `Deploy` → `Manage deployments` → pencil-edit → set Version back to v4. URL stays the same; existing handlers keep working; document upload returns "Unknown type: document_upload".
2. **The admin-documents.html page stays in the nav** unless removed separately. Clicking it without a working v5 will fail at the upload step with a red banner, but the listing (which reads from the Sheet, not Apps Script) keeps working for whatever's already there.

---

## Site-side files touched in Round 5

- `apps-script/Code.gs` — v4 → v5 (added handleDocumentUpload + branch)
- `admin-documents.html` (new) — password-gated upload form + documents listing, with sessionStorage-shared admin state so navigating between Dashboard and Documents doesn't re-prompt for password
- `dashboard.html` — added admin sub-nav linking to Documents, plus sessionStorage handling so the unlock persists between admin pages in the same browser session
- All 11 public pages — added "Admin" nav entry as the last item (sweep commit earlier in the round)
- `apps-script/DEPLOY_v5.md` — this file
