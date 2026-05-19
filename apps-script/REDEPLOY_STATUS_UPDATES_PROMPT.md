# Redeploy Prompt — Pick Up Status Updates Backend (v3)

Paste the section below (everything between the `=== BEGIN PROMPT ===` and `=== END PROMPT ===` markers) into Codex Desktop. The agent will drive a browser to redeploy the reunion-account Apps Script project so the new `status_update_create` + `status_update_delete` doPost handlers go live without changing the existing `/exec` URL. After completion, paste the agent's report back to the orchestrator that originated this prompt.

---

=== BEGIN PROMPT ===

# Mission

Redeploy the reunion-Gmail Apps Script project with the latest `Code.gs` from GitHub. The repo head added a new "Status Updates" feature (admin CRUD + public listing + email-broadcast helper) along with a defensive guard on `handleDocumentUpload`. The frontend pages are already live on Netlify; this redeploy lights up the backend.

You have browser access. The operator (Lorenzo Slay / "Zo") is at the keyboard for credential entry. Drive the UI clicks and copy/paste.

**Critical:** redeploy via **Deploy → Manage deployments → pencil-edit existing → Version: New version**, NOT **"New deployment"**. The latter mints a new `/exec` URL and would require another site-file swap.

## Account

- **Reunion (only account used here):** `rowellfamilyreunion2026@gmail.com` — operator will sign in when prompted. Use an Incognito window (or a browser profile signed into only this account) to avoid wrong-account confusion.

## Current state (must be preserved across this redeploy)

- **Apps Script project:** `Rowell Reunion Backend` — find it via `https://script.google.com/home` after signing in as reunion Gmail
- **Live /exec URL (must NOT change):** `https://script.google.com/macros/s/AKfycbwT49cqzH6CK8Z4whoDYOl-qpVYfS4GuNW2Xsw4bSSheB91I3INSXeAyT3L_-fcShiAcA/exec`
- **Reunion-account Sheet (registrations/RSVPs/documents/updates):** ID `1krj2XFd-YXpwFubbNdLS3N0Bi-ZEhm9J3-PliMjPr1M`
- **Reunion-account upload folder:** ID `1VEt06cFBq6LjmZdb6zBiDDI60oLxKOYj`
- **Latest `Code.gs` source of truth:** GitHub raw URL `https://raw.githubusercontent.com/ZoSlay/rowell-reunion-site/main/apps-script/Code.gs`
- **Site (for the smoke test):** `https://rowell-family-reunion.netlify.app/`
- **Admin password (for the smoke test):** `Rowell2026`

## Constraints / safety

1. **NEW VERSION, not NEW DEPLOYMENT.** Use **Deploy → Manage deployments → pencil-edit existing → Version: New version**. Confirm the post-deploy /exec URL matches the existing one byte-for-byte before reporting back.
2. **Do NOT modify any file in the `~/rowell-reunion-site` repo or push to GitHub.** Source-of-truth lives on GitHub; you only paste into the Apps Script editor.
3. **Smoke-test publish must NOT email the group.** Use the admin-updates.html "Email this update to all registered members" checkbox UNCHECKED for the test publish. A real broadcast can be sent later by the operator on a separate intentional update.
4. After the smoke test, delete the test update through the admin UI so it doesn't appear on the public page.
5. If anything errors unexpectedly, stop and ask the operator. No destructive retries.

## Steps

### Step 1 — Fetch latest Code.gs

1. In any browser tab, open `https://raw.githubusercontent.com/ZoSlay/rowell-reunion-site/main/apps-script/Code.gs`
2. Select all (Cmd-A) → copy (Cmd-C). Keep this on the clipboard for Step 3.

### Step 2 — Open existing Apps Script project (reunion window)

1. In the incognito / reunion-account window: open `https://script.google.com/home` — verify avatar = `rowellfamilyreunion2026@gmail.com`
2. Click the project `Rowell Reunion Backend`
3. Open the `Code.gs` file in the editor

### Step 3 — Replace contents + apply substitutions

1. In the editor: select all (Cmd-A) → delete
2. Paste the clipboard contents from Step 1
3. **First Find & Replace** (Cmd-E or Edit menu → Find and replace):
   - **Find:** `1YtHlmvUvaP77cbdhgAm_PPcW_ikfz1g9hQCeG11DAeo`
   - **Replace:** `1krj2XFd-YXpwFubbNdLS3N0Bi-ZEhm9J3-PliMjPr1M`
   - Click **Replace all** — should match **8 occurrences** (2 more than the prior redeploy because the new `handleStatusUpdateCreate` and `handleStatusUpdateDelete` handlers each call `SpreadsheetApp.openById(...)`)
4. **Second Find & Replace:**
   - **Find:** `1CWQ5sDfQHbMtcrSERK-58Gv5SBGsqtEn`
   - **Replace:** `1VEt06cFBq6LjmZdb6zBiDDI60oLxKOYj`
   - Click **Replace all** — should match **1 occurrence** (unchanged from prior redeploy)
5. **Cmd-S** to save. Confirm the editor shows no unsaved-changes indicator.

### Step 4 — Redeploy as NEW VERSION of EXISTING deployment

1. Top-right **Deploy → Manage deployments** (NOT "New deployment")
2. The list shows the existing deployment. Click the **pencil icon** next to it to edit.
3. **Version** dropdown → select **New version**
4. **Description:** `v3 — status updates: create + delete handlers + broadcast email helper + handleDocumentUpload defensive guard`
5. **Execute as:** Me (rowellfamilyreunion2026@gmail.com) — should already be selected
6. **Who has access:** Anyone — should already be selected
7. Click **Deploy**
8. After deploy completes, copy the **Web app URL** from the confirmation dialog.
9. Verify it is **identical** to: `https://script.google.com/macros/s/AKfycbwT49cqzH6CK8Z4whoDYOl-qpVYfS4GuNW2Xsw4bSSheB91I3INSXeAyT3L_-fcShiAcA/exec`
10. If the URL differs, you accidentally created a new deployment — STOP and report; do not proceed.

### Step 5 — Backend GET smoke test

1. Paste the /exec URL into a new tab.
2. Confirm JSON banner: `{"status":"ok","message":"Rowell Reunion Form Handler is running","timestamp":"..."}`. The timestamp should be a few seconds old (proving the new deployment is serving).

### Step 6 — Status-update create + read + delete smoke test (NO email)

1. In the reunion-account window, open `https://rowell-family-reunion.netlify.app/admin-updates.html`
2. Enter admin password `Rowell2026` → Unlock
3. Confirm the admin sub-nav shows three tabs: `Dashboard | Documents | Status Updates` (Status Updates active)
4. Fill the publish form:
   - **Subject:** `S108 backend smoke test — please ignore`
   - **Message:** `Confirming new status-update handlers are live after the v3 redeploy. Will be deleted immediately.`
   - **Optional document attachment:** leave empty
   - **"Email this update to all registered members" checkbox:** UNCHECK IT (important — do not send a real broadcast during the smoke test)
5. Click **Publish Update**
6. Confirm the status banner says `Published as #N. Not emailed (checkbox was unchecked).` where N is the row number assigned (will be 2 if this is the first publish, larger if other updates exist).
7. Confirm the test update appears in the "Published Updates" list below the form, with `#N · <date> · Not emailed`.
8. In another tab, open `https://rowell-family-reunion.netlify.app/updates.html` and hard-refresh (Cmd-Shift-R). Confirm the test update appears as the topmost card with the expected subject + message text.
9. Back on `admin-updates.html`, click **Delete** on the test row. Accept the confirm dialog.
10. Confirm the test update disappears from the admin list.
11. Hard-refresh `updates.html` again. Confirm the test update is also gone from the public page.

### Step 7 — Report back

Reply with **all** of the following pasted in a single message back to the orchestrator that issued this prompt:

```
Step 3 Sheet ID substitution:       <count actually matched, e.g., "8 of 8">
Step 3 folder ID substitution:      <count actually matched, e.g., "1 of 1">
Step 4 /exec URL after redeploy:    <full URL — must match expected byte-for-byte>
Step 5 GET smoke test:              <pass / fail + banner snippet>
Step 6 publish #N:                  <update_id assigned by backend>
Step 6 admin list shows test row:   <yes / no>
Step 6 public updates.html shows:   <yes / no — confirm subject text matched>
Step 6 delete + verify removal:     <yes / no — confirm removal from BOTH admin list AND public page>

Anything weird (auth prompts, errors, deviations):
- ...

Time spent: <X minutes>
```

The orchestrator will then mark the Status Updates feature live and update the S108 carry checklist. Do not perform any additional actions or send any real broadcast email. Stop after Step 7.

=== END PROMPT ===
