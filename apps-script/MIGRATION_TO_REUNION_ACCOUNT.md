# Migration Runbook — Move backend to `rowellfamilyreunion2026@gmail.com`

**Goal:** move the Google Sheet + Apps Script project from your personal Google account to the dedicated reunion account (`rowellfamilyreunion2026@gmail.com`), so all reunion infrastructure lives under one account that can be handed off to future organizers.

**Estimated time:** ~45 min focused work.

**Strategy:** do this in one sitting if possible. Between when the new Apps Script is deployed and when the site is updated to point at the new URL, the site keeps working off the old URL (we don't deactivate the old script until the cutover is complete).

---

## What's moving (and why each piece matters)

| Asset | Current owner | Why move it |
|---|---|---|
| **Google Sheet** `1YtHlmvUvaP77cbdhgAm_PPcW_ikfz1g9hQCeG11DAeo` (tabs: Registrations, RSVPs, Documents, Generations Submissions) | personal account | Source of truth for all registration + document metadata. |
| **Apps Script project** `1VKBTaHCQ1jFtDtyQamZ0wiA5F2PEEzwLTnqA5KcWfixivQWiEFiyuS9L` (~470 lines of `Code.gs` handling form posts, document uploads, payment-confirmation triggers, inline cell edits) | personal account | Backend logic the website calls into. |
| **Drive folder** `Rowell Reunion 2026 Documents` (where admin-documents.html uploads land) | personal account | Created on first document upload. Will be recreated under the reunion account on first upload after migration. |
| **Installable onEdit trigger** (`onPaymentStatusEdit`) | personal account | Triggers can't be transferred; will be re-created under reunion account. |

---

## Pre-flight

1. Confirm you can log into `rowellfamilyreunion2026@gmail.com` (have the password handy).
2. In a fresh browser window (or Chrome profile), log out of all Google accounts then log in *only* as `rowellfamilyreunion2026@gmail.com`. Single-account browsing avoids "wait, which account did I just do that in?" mistakes.
3. Open this runbook in another tab so you can copy/paste step by step.

---

## Step 1 — Copy the Google Sheet to the reunion account (~3 min)

Working with copies (not moves) is safer — the original stays untouched until cutover.

1. While logged in as `rowellfamilyreunion2026@gmail.com`, open: `https://docs.google.com/spreadsheets/d/1YtHlmvUvaP77cbdhgAm_PPcW_ikfz1g9hQCeG11DAeo/edit`
2. If Google says "you need permission to access this file," switch to your personal account, open the Sheet, click `Share`, add `rowellfamilyreunion2026@gmail.com` with **Editor** access, then switch back to the reunion account and reopen the link.
3. Once you can see it, click `File → Make a copy`. Name the copy `Rowell Family Reunion 2026 — Master`. Untick "Copy comments" if asked. Save to **My Drive** (which is the reunion account's Drive).
4. **Copy the new Sheet's ID** from the URL — the long string between `/d/` and `/edit`. It'll look like `1AbCDeFGHiJkLmNopQrStUvWxYzABCdefGHijKlmNopQrSt`. **Save this somewhere you can paste it later.** I'll need it.
5. Open the new copy. Verify all the tabs are present: `Registrations`, `RSVPs`, `Documents`, `Generations Submissions`.

## Step 2 — Re-share the new Sheet with Cassandra (~1 min)

1. In the new Sheet, click `Share` (top-right).
2. Add `casmille@san.rr.com` (or whatever Google login Cassandra uses for the existing Sheet) with **Editor** access.
3. Send.

## Step 3 — Create a new Apps Script project under the reunion account (~10 min)

1. Open `https://script.google.com/home` (logged in as `rowellfamilyreunion2026@gmail.com`)
2. Click `New project` (top-left)
3. Project name (top-left of the editor): rename from "Untitled project" to `Rowell Reunion Backend`
4. The editor has a default `Code.gs` with a stub `myFunction()`. Delete everything in that file.
5. Open `apps-script/Code.gs` from this repo in a separate browser window. Copy the *entire* file contents. Paste into the Apps Script editor's `Code.gs`. Save (`⌘S` or disk icon).
6. **Critically:** find the line `SpreadsheetApp.openById('1YtHlmvUvaP77cbdhgAm_PPcW_ikfz1g9hQCeG11DAeo')` — it appears **5 times** in the file (`handleRegistration`, `handleRsvp`, `handleGenerationsSubmission`, `handleDocumentUpload`, `handleCellUpdate`). Replace all 5 occurrences with the **new Sheet ID from Step 1**. Use Find & Replace (`⌘E`) to do this in one shot. Save again.

## Step 4 — Deploy the new Apps Script as a Web App (~3 min)

1. In the Apps Script editor, click `Deploy → New deployment`
2. Click the gear icon next to "Select type" → choose `Web app`
3. Fill in:
   - Description: `v6 — initial deployment on reunion account`
   - Execute as: `Me (rowellfamilyreunion2026@gmail.com)`
   - Who has access: `Anyone`
4. Click `Deploy`
5. Google will prompt for permissions — `Authorize access` → pick the reunion account → "Advanced" → "Go to Rowell Reunion Backend (unsafe)" — yes click through, this is your own script. Grant all requested scopes (Spreadsheet, Drive, Mail, External requests).
6. **Copy the resulting Web App URL** — looks like `https://script.google.com/macros/s/AKfyc[long string]/exec`. **Save this somewhere — I'll need it.**

## Step 5 — Set up the installable onEdit trigger (~3 min)

This is what powers the auto-confirmation email when payment_status flips to PAID.

1. In the Apps Script editor, click the **clock icon** (Triggers) in the left sidebar
2. Click `+ Add Trigger` (bottom right)
3. Fill in:
   - Choose function: `onPaymentStatusEdit`
   - Deployment: `Head`
   - Event source: `From spreadsheet`
   - Event type: `On edit`
   - Failure notification: `Notify me immediately`
4. Click `Save`
5. Google will prompt for permissions again — grant.

## Step 6 — Pre-grant Drive permission (~1 min)

Optional but prevents the *first* document upload from failing with an OAuth prompt:

1. In the editor, from the function dropdown at the top, select `handleDocumentUpload`
2. Click `▶ Run` — it will error with `"Missing filename or file_base64"` (that's expected from a manual run with no input). The point is just the permission prompt fires.
3. Grant Drive access if prompted. Done.

## Step 7 — Smoke test (~5 min)

While still logged in as the reunion account, in a new tab:

1. **Test write path (registration):** open the live site's `register.html` — but **wait until after Step 9** (the site still points at the old URL until we update it). Skip this for now.
2. **Test inline edit:** open the new Sheet in the reunion account → `Registrations` tab → if there's a test row, edit `payment_status` in column N to `PAID` → confirm the `onPaymentStatusEdit` trigger fires (check the registrant's email + confirm `confirmation_sent` column auto-fills). If there are no test rows yet, add one manually with your own email and try.
3. **Test the deployed URL responds:** paste the new Web App URL from Step 4 into a browser. You should see `{"status":"ok","message":"Rowell Reunion Form Handler is running","timestamp":"..."}`.

## Step 8 — Hand me the new IDs

Reply in our chat with:

```
NEW_SHEET_ID:        <paste from Step 1>
NEW_APPS_SCRIPT_URL: <paste from Step 4>
NEW_PROJECT_URL:     <paste — open the Apps Script editor and copy from your address bar>
```

I'll do **one commit** updating these constants across `dashboard.html`, `admin-documents.html`, `register.html`, `generations.html`, `feedback.html` — plus the docs in `apps-script/DEPLOY_v*.md` that point at the old project URL.

## Step 9 — Cutover (~2 min after my commit lands)

Once the site is pointing at the new URL:
1. **Don't kill the old script yet.** Leave it running for ~48 hours as a safety net.
2. Live-test the new setup: submit a registration on the live site, confirm it lands in the *new* Sheet (not the old one). Submit feedback. Upload a document.
3. If anything looks wrong, page me and we revert by re-pointing site constants back to old IDs.

## Step 10 — Decommission the old script + old Sheet (~3 min, after 48hr soak)

Once you're confident the new setup is humming:

1. **Old Sheet:** open `https://docs.google.com/spreadsheets/d/1YtHlmvUvaP77cbdhgAm_PPcW_ikfz1g9hQCeG11DAeo` in your personal account. Add a note in cell A1 of the first tab: `ARCHIVED 2026-05-17 — see Rowell Family Reunion 2026 — Master in rowellfamilyreunion2026@gmail.com Drive`. You can leave it shared but read-only, or move it to a personal-account "Archive" folder.
2. **Old Apps Script:** `https://script.google.com/u/0/home/projects/1VKBTaHCQ1jFtDtyQamZ0wiA5F2PEEzwLTnqA5KcWfixivQWiEFiyuS9L/edit` → `Deploy → Manage deployments` → click the active deployment's 3-dot menu → `Archive deployment`. The old web-app URL stops responding. Site is fully on the new account.
3. **Old trigger:** Apps Script project → Triggers → delete the `onPaymentStatusEdit` trigger. Otherwise it'll keep firing on edits to the old Sheet (harmless but pointless).

## Step 11 (optional, do anytime) — Import the Budget Tracker

When you're ready to wire the dashboard's financial summary to live data (see prior chat):

1. In the new reunion Sheet, `File → Import → Upload → pick Rowell_Family_Reunion_Budget_Tracker.xlsx → "Insert new sheet(s)"`. The xlsx's tabs (Summary, Details, Payments, README) land as new tabs.
2. Reply to me with the tab names + the cell references for `Total Obligation` and `Deposit Paid` (per my earlier parse, those are `Summary!B21` and a sum of `Details!H:H` — but verify after import). I'll wire the dashboard's financial summary.

---

## Two-Apps-Script-deployments caveat (worth knowing)

The site currently uses **two different Web App URLs**:

- `…dGIhHkT8Isk9dOv-_rKcXCf0N-eMg/exec` — used by `dashboard.html`, `admin-documents.html`, `generations.html` (newer code paths)
- `…UnKm_Q/exec` — used by `register.html`, `feedback.html` (older code paths, from REUNION-019 era)

Both point at the same `Code.gs` source but were deployed separately. The migration consolidates these to **one new URL** on the reunion account. All 5 site files get the new single URL.

(If you want to keep two deployments for some reason — e.g., versioning — possible but adds operational complexity for no real gain. Consolidation is the recommended path.)
