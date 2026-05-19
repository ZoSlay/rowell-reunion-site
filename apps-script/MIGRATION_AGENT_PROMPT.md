# Migration Agent Prompt — Move Reunion Backend to Reunion Gmail

Paste the section below (everything between the `=== BEGIN PROMPT ===` and `=== END PROMPT ===` markers) into Codex Desktop or Claude Cowork. The agent will drive a browser to perform the migration. After completion, paste the agent's final report back to the orchestrator that originated this prompt.

---

=== BEGIN PROMPT ===

# Mission

You are migrating the backend of the Rowell Family Reunion 2026 website from the operator's personal Google account to a dedicated reunion Gmail account. You have browser access. The operator (Lorenzo Slay / "Zo") is at the keyboard and will handle credential entry; you drive the UI clicks and copy/paste.

## Accounts

- **Personal (source):** `lorenzo.slay@slaycorp.co` — operator will sign in when prompted
- **Reunion (destination):** `rowellfamilyreunion2026@gmail.com` — operator has the password; you'll prompt them for it when needed

Use **separate browser profiles** or **different browsers** to avoid "wrong account" confusion. Recommended: do all reunion-account work in an Incognito window where only the reunion account is signed in. Keep the personal-account work in a regular window.

## Current state (what exists, on the personal account)

- **Reunion Sheet:** ID `1YtHlmvUvaP77cbdhgAm_PPcW_ikfz1g9hQCeG11DAeo` — https://docs.google.com/spreadsheets/d/1YtHlmvUvaP77cbdhgAm_PPcW_ikfz1g9hQCeG11DAeo/edit
- **Apps Script project:** ID `1VKBTaHCQ1jFtDtyQamZ0wiA5F2PEEzwLTnqA5KcWfixivQWiEFiyuS9L` — https://script.google.com/u/0/home/projects/1VKBTaHCQ1jFtDtyQamZ0wiA5F2PEEzwLTnqA5KcWfixivQWiEFiyuS9L/edit
- **Current live /exec URL:** `https://script.google.com/macros/s/AKfycbxQ3C2_EIwWM3pcUe5QJDO71EZYpM3UXQnscKDqQZgjJ23Oms14dWFkrVb250luUnKm_Q/exec`
- **Latest `Code.gs` source of truth:** GitHub repo `ZoSlay/rowell-reunion-site`, file `apps-script/Code.gs` — raw URL: https://raw.githubusercontent.com/ZoSlay/rowell-reunion-site/main/apps-script/Code.gs
- **Site:** https://rowell-family-reunion.netlify.app/  (admin password: `Rowell2026`)
- **Treasurer:** Cassandra Rowell Miller, email `casmille@san.rr.com` — needs Editor access on the new Sheet
- **Budget Tracker xlsx (local on operator's Mac):** `/Users/slaycorp/Documents/Family Reunion Documunts/Final planning/Rowell_Family_Reunion_Budget_Tracker.xlsx`

## Constraints / safety

1. **Do not delete or archive the old Apps Script project, old Sheet, or old /exec URL** during this migration. They stay alive as a fallback for 48+ hours while the operator soaks the new setup. The orchestrator that issued this prompt will handle decommissioning later.
2. **Do not modify any file in the `~/rowell-reunion-site` repo or push to GitHub.** Site-side URL swap is the orchestrator's job, not yours. You just gather the new IDs and hand them back.
3. **Do not change ownership of the personal-account Sheet or files.** You're making *copies* under the reunion account, not transferring.
4. If anything errors unexpectedly, stop and ask the operator before proceeding. Do not retry destructively.

## Steps

### Step 1 — Pre-flight (operator only)

1. Ask the operator: "Have the password for `rowellfamilyreunion2026@gmail.com` ready?"
2. Open a fresh Incognito (or new browser profile) window. Sign into `rowellfamilyreunion2026@gmail.com` *only* (sign out of all other Google accounts in this window).
3. Open a second tab in the same window: https://drive.google.com/  Verify the top-right account avatar shows `rowellfamilyreunion2026@gmail.com`. If it shows anything else, sign out and try again.

### Step 2 — Share source assets from personal → reunion (operator-driven)

The personal account currently owns the source Sheet + Apps Script. The reunion account needs read access so you can copy them.

1. In a *separate* browser window (NOT incognito), have the operator sign into `lorenzo.slay@slaycorp.co` if not already.
2. Open https://docs.google.com/spreadsheets/d/1YtHlmvUvaP77cbdhgAm_PPcW_ikfz1g9hQCeG11DAeo/edit
3. Click **Share** (top right) → add `rowellfamilyreunion2026@gmail.com` with **Editor** access → uncheck "Notify people" → **Share**
4. Open the Apps Script project: https://script.google.com/u/0/home/projects/1VKBTaHCQ1jFtDtyQamZ0wiA5F2PEEzwLTnqA5KcWfixivQWiEFiyuS9L/edit  Apps Script doesn't have a Share button at the project level the same way; instead, share it via Drive:
   - Open https://drive.google.com/  in the personal-account window
   - Search for "Rowell" — find the Apps Script project file (icon looks like `</>`)
   - Right-click → **Share** → add `rowellfamilyreunion2026@gmail.com` with **Editor** → **Share**
   - If you can't find it via Drive search, skip this step — Apps Script project doesn't strictly need to be shared since you're creating a new one in the reunion account in Step 4, not copying the existing one.

### Step 3 — Make a copy of the Sheet under the reunion account

Switch to the reunion-account browser window.

1. Open https://docs.google.com/spreadsheets/d/1YtHlmvUvaP77cbdhgAm_PPcW_ikfz1g9hQCeG11DAeo/edit  You should see the Sheet (granted access in Step 2).
2. **File → Make a copy**
3. Name: `Rowell Family Reunion 2026 — Master`
4. Folder: **My Drive** (root of reunion account)
5. Uncheck "Copy comments" if asked
6. Click **Make a copy**
7. Once the copy opens, **copy its Sheet ID from the URL** — the long string between `/d/` and `/edit`. Save this. Call it `NEW_SHEET_ID`.
8. Verify the copy has tabs: `Registrations`, `RSVPs`. (May also have `Documents` and `Generations Submissions` if those were populated — fine either way.)

### Step 4 — Create the upload folder under the reunion account

1. In the reunion-account browser window, open https://drive.google.com/  (My Drive root).
2. **New → Folder** → name it `Rowell Reunion 2026 Documents` → **Create**
3. Open the folder. Copy the folder ID from the URL: it's the segment after `/folders/` and before any `?`. Save this. Call it `NEW_UPLOAD_FOLDER_ID`.

### Step 5 — Create a new Apps Script project under the reunion account

1. Open https://script.google.com/home  (verify avatar = reunion account)
2. Click **New project** (top-left)
3. The default `Code.gs` has a stub `myFunction()`. **Select all + delete** the contents.
4. In a new tab, fetch the latest `Code.gs` source: https://raw.githubusercontent.com/ZoSlay/rowell-reunion-site/main/apps-script/Code.gs  Copy the entire raw text.
5. Paste into the Apps Script editor's `Code.gs`.
6. **Critical substitutions before saving:**
   - **Find & Replace** (Edit menu, or Cmd-E / Ctrl-H):
     - Find: `1YtHlmvUvaP77cbdhgAm_PPcW_ikfz1g9hQCeG11DAeo`
     - Replace: `<NEW_SHEET_ID from Step 3>`
     - Replace **All** (should match 6 occurrences — confirm in the replace dialog)
   - Second Find & Replace:
     - Find: `1CWQ5sDfQHbMtcrSERK-58Gv5SBGsqtEn`
     - Replace: `<NEW_UPLOAD_FOLDER_ID from Step 4>`
     - Replace **All** (should match 1 occurrence)
7. **Cmd-S / Ctrl-S** to save.
8. Rename the project: click "Untitled project" at the top-left → rename to `Rowell Reunion Backend`.
9. Copy the project URL from your browser's address bar. Save this. Call it `NEW_PROJECT_URL`.

### Step 6 — Deploy as a Web App

1. **Deploy → New deployment** (top right)
2. Gear icon next to "Select type" → choose **Web app**
3. Fill in:
   - Description: `v1 — initial deployment on reunion account`
   - Execute as: **Me (rowellfamilyreunion2026@gmail.com)**
   - Who has access: **Anyone**
4. Click **Deploy**
5. Permission consent dialog appears → **Authorize access** → pick the reunion account → click **Advanced** → **Go to Rowell Reunion Backend (unsafe)** → **Allow** (grants Spreadsheet, Drive, Mail, External requests scopes — all needed)
6. Deployment completes. Copy the **Web app URL** — it looks like `https://script.google.com/macros/s/AKfyc[long]/exec`. Save this. Call it `NEW_EXEC_URL`.
7. Verify in the browser: paste `NEW_EXEC_URL` into a new tab. You should see JSON: `{"status":"ok","message":"Rowell Reunion Form Handler is running","timestamp":"..."}`. If you see "Page Not Found" instead, the deployment didn't take — retry.

### Step 7 — Install the onEdit trigger programmatically

The Apps Script editor's "Add Trigger" UI doesn't expose "From spreadsheet" for standalone scripts. The pasted `Code.gs` already includes a function `installPaymentTrigger` that creates the trigger programmatically against the new Sheet.

1. In the Apps Script editor, top-bar function dropdown (next to ▶ Run) → select `installPaymentTrigger`
2. Click **▶ Run**
3. Permission consent fires again (different scopes this time — ScriptApp) → **Review permissions** → reunion account → **Advanced → Go to … (unsafe) → Allow**
4. Execution completes. Check the bottom log panel — should say `onPaymentStatusEdit trigger installed for sheet <NEW_SHEET_ID>`.

**Important:** the `installPaymentTrigger` function inside the pasted Code.gs has a hardcoded `SHEET_ID` constant near the top of the function. Verify it now points to `NEW_SHEET_ID` (it should, since Find & Replace in Step 5 covered it). If it still shows the old ID, edit the function body to use `NEW_SHEET_ID`, save, and re-run.

5. Verify in the Triggers panel (clock icon, left sidebar) — you should see one row: `onPaymentStatusEdit · Head · From spreadsheet · On edit`.

### Step 8 — Pre-grant Drive permission

Optional but prevents the first real upload from failing with a fresh OAuth prompt.

1. Function dropdown → `handleDocumentUpload`
2. **▶ Run**
3. If a Drive permission prompt fires, grant it. The function execution itself will fail with `"Missing filename or file_base64"` — that's the expected error from a manual run with empty input. Ignore it; permissions are now granted.

### Step 9 — Share the new Sheet with the personal account + the Treasurer

So the orchestrator (which has OAuth tied to the personal account) can read/write the new Sheet, and the Treasurer can mark payments PAID.

1. Open the new Sheet (in reunion-account window). Click **Share** (top right).
2. Add `lorenzo.slay@slaycorp.co` with **Editor** access → uncheck "Notify"
3. Add `casmille@san.rr.com` with **Editor** access → uncheck "Notify"
4. Click **Share**.

### Step 10 — Share the new upload folder with the personal account

Same reason — orchestrator needs to inspect/clean it.

1. Open https://drive.google.com/ in the reunion-account window → My Drive → find `Rowell Reunion 2026 Documents` folder.
2. Right-click → **Share** → add `lorenzo.slay@slaycorp.co` with **Editor** → uncheck "Notify" → **Share**.

### Step 11 — Import the Budget Tracker xlsx into the new Sheet

Optional but recommended — keeps the Budget Tracker in the reunion account's Drive instead of the operator's personal Drive.

1. Ask the operator to upload the Budget Tracker xlsx to the reunion account's Drive. They'll do this themselves: drag-and-drop `/Users/slaycorp/Documents/Family Reunion Documunts/Final planning/Rowell_Family_Reunion_Budget_Tracker.xlsx` into the reunion-account Drive window, into a new folder they create called `Family Reunion Documunts` (matching the personal-Drive structure).
2. Once the xlsx is in the reunion Drive, right-click it → **Open with → Google Sheets** to convert it to a native Sheet. Rename the converted Sheet to `Rowell Family Reunion 2026 — Budget Tracker`.
3. Copy the new Budget Tracker Sheet ID from its URL. Save this. Call it `NEW_BUDGET_SHEET_ID`.
4. Share the new Budget Tracker Sheet with `lorenzo.slay@slaycorp.co` (Editor, no notify).

### Step 12 — Smoke test the new deployment

1. **GET test:** paste `NEW_EXEC_URL` into a browser tab. Confirm JSON response `{"status":"ok","message":"Rowell Reunion Form Handler is running","timestamp":"..."}`.
2. **Trigger test:** open the new Sheet → `Registrations` tab → add a test row with at least: timestamp / first_name / email (use a test email you can check) / num_adults / total_due. Then in the `payment_status` column (column N) type `PAID` and press Enter. Within ~5 seconds, the `confirmation_sent` column (O) should auto-fill with `RFR-2026-NNN` AND the test email address should receive a confirmation email. If not — check Apps Script → Executions (left sidebar) for the trace.

### Step 13 — Report back

Reply with **all** of the following pasted in a single message back to the orchestrator that issued this prompt:

```
NEW_SHEET_ID:           <from Step 3>
NEW_UPLOAD_FOLDER_ID:   <from Step 4>
NEW_PROJECT_URL:        <from Step 5>
NEW_EXEC_URL:           <from Step 6>
NEW_BUDGET_SHEET_ID:    <from Step 11, or "skipped">

Step 12 GET test:       <pass / fail + details>
Step 12 trigger test:   <pass / fail + details>

Anything weird that happened (auth prompts, errors, deviations from plan):
- ...

Time spent: <X minutes>
```

The orchestrator will then:
- Swap `NEW_EXEC_URL` into 6 site files (`dashboard.html`, `admin-documents.html`, `register.html`, `feedback.html`, `generations.html`, `script.js`) in a single commit
- Update the dashboard's Budget Tracker constants to `NEW_BUDGET_SHEET_ID`
- Smoke-test the full site against the new backend
- Keep the old `lorenzo.slay@slaycorp.co`-owned assets running in parallel for 48h as a fallback
- After the soak window, run decommissioning of old assets per `MIGRATION_TO_REUNION_ACCOUNT.md` Step 10

Do not proceed with decommissioning yourself. Stop after Step 13.

=== END PROMPT ===
