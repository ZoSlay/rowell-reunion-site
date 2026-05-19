# Redeploy Prompt v2 — Apps Script Status Updates + Auto-Publish Roll Call (self-contained for fresh Codex)

Paste the section below (everything between the `=== BEGIN PROMPT ===` and `=== END PROMPT ===` markers) into a fresh Codex Desktop session. This is a self-contained prompt — no prior context required.

**Note: this prompt was updated after the v2 file was first published.** It now covers two backend features in one redeploy:
- Status Updates (admin-updates.html publishing tool + public updates.html page + email broadcast)
- Auto-publish Roll Call (Generations form submissions now append directly to the public roll call on the Generations page, no manual review needed)

The Sheet ID substitution count is now **9** (was 8 in the original v2). Both features ride in the same `v3` Apps Script deployment.

---

=== BEGIN PROMPT ===

# Mission

The Rowell Family Reunion 2026 website (`https://rowell-family-reunion.netlify.app/`) just shipped two new backend features that need to go live in a single Apps Script redeploy:

**Feature 1 — Status Updates:** a CRUD admin tool that lets the operator publish announcements to the group, with an option to broadcast each update by email to every registered member. New POST handlers `status_update_create` + `status_update_delete`. New admin page at `admin-updates.html`; new public page at `updates.html`.

**Feature 2 — Auto-publish Roll Call:** the Generations form (`generations.html`) used to queue submissions for manual review. Now form submissions append directly to a `Roll Call` Sheet tab and appear on the public roll call immediately. A new admin page at `admin-roll-call.html` lets the operator delete any wrong/spam entry post-hoc. New POST handler `roll_call_delete`. The existing `handleGenerationsSubmission` was modified to ALSO write to the Roll Call tab in addition to the existing Generations Submissions audit tab.

The frontend (admin pages, public pages, sub-navs, main nav) is already live on Netlify. The **backend Apps Script that powers both features has NOT yet been redeployed**, so the new POST handlers are not in the live `/exec` URL yet. Your job is to redeploy the existing Apps Script project as a NEW VERSION of the existing deployment — preserving the live `/exec` URL — and run no-broadcast smoke tests for both features.

You have browser access. The operator (Lorenzo Slay / "Zo") is at the keyboard for credentials.

## Critical context

- **Account to use:** `rowellfamilyreunion2026@gmail.com` (operator has the password). Open an Incognito window (or a browser profile signed into only this account) to avoid wrong-account confusion.
- **Apps Script project URL:** `https://script.google.com/home/projects/11ODlzSJuBi_qi773helFNeKYxq2mVFhc6s4ccwSv1LFVybJb0-e0iE5q/edit`
- **Project name in the home listing:** `Rowell Reunion Backend`
- **Live /exec URL that MUST be preserved byte-for-byte:** `https://script.google.com/macros/s/AKfycbwT49cqzH6CK8Z4whoDYOl-qpVYfS4GuNW2Xsw4bSSheB91I3INSXeAyT3L_-fcShiAcA/exec`
- **Latest `Code.gs` source (always fetch fresh):** `https://raw.githubusercontent.com/ZoSlay/rowell-reunion-site/main/apps-script/Code.gs` — currently ~720 lines, ends with `function jsonResponse(obj) { ... }`
- **Reunion Sheet ID** (used by Apps Script via `SpreadsheetApp.openById`): `1krj2XFd-YXpwFubbNdLS3N0Bi-ZEhm9J3-PliMjPr1M`
- **Reunion upload folder ID:** `1VEt06cFBq6LjmZdb6zBiDDI60oLxKOYj`
- **Admin password (for smoke-test login):** `Rowell2026`

The GitHub raw source uses **placeholder IDs** from when the backend lived on the operator's personal Google account. You MUST find-and-replace them before saving (counts below).

## Do NOT

1. Do NOT use **"New deployment"** in the Deploy menu. That mints a new `/exec` URL and would force another site-file swap. Use **Deploy → Manage deployments → pencil-edit existing → Version: New version**.
2. Do NOT send a real email broadcast during smoke testing. The admin UI has a checkbox labeled "Email this update to all registered members" — leave it UNCHECKED for the test publish. A real broadcast is a separate operator action.
3. Do NOT modify any file in `~/rowell-reunion-site` or push to GitHub. The repo is the source-of-truth; you only paste into the live Apps Script editor.
4. Do NOT click "Deploy" if the Apps Script editor is showing a syntax-error banner. Apps Script will reject the deploy and a partial save can leave the live deployment in a half-broken state.

## Steps

### Step 1 — Open the project

1. In the incognito / reunion-account window, navigate to the project URL: `https://script.google.com/home/projects/11ODlzSJuBi_qi773helFNeKYxq2mVFhc6s4ccwSv1LFVybJb0-e0iE5q/edit`
2. Confirm the top-right avatar shows `rowellfamilyreunion2026@gmail.com`. If not, sign out + sign back in as the reunion account.
3. Click the `Code.gs` file in the left sidebar to open it in the editor.

### Step 2 — Paste fresh source

1. Open `https://raw.githubusercontent.com/ZoSlay/rowell-reunion-site/main/apps-script/Code.gs` in a separate tab.
2. **Cmd-A** → **Cmd-C** to copy the entire raw source (should be 659 lines, ending with `function jsonResponse(obj) { ... }`).
3. Switch back to the Apps Script editor tab.
4. Click anywhere in the `Code.gs` editor pane.
5. **Cmd-A** to select EVERYTHING in the editor → press **Delete** (or Backspace). The editor pane must be COMPLETELY empty before pasting — any residual content will corrupt the buffer.
6. **Cmd-V** to paste.
7. Scroll to the very bottom of the editor. The last visible content must be a closing `}` (the closing brace of `jsonResponse`). If there is anything past that — stray characters, blank lines with junk, comment fragments — manually delete it so the file ends cleanly at `}`.

### Step 3 — Apply two find-and-replace substitutions

1. Open the find dialog (Cmd-E or Edit menu → Find and replace).
2. **First substitution:**
   - Find: `1YtHlmvUvaP77cbdhgAm_PPcW_ikfz1g9hQCeG11DAeo`
   - Replace: `1krj2XFd-YXpwFubbNdLS3N0Bi-ZEhm9J3-PliMjPr1M`
   - Click **Replace all** — must report exactly **9 occurrences replaced**. If the count differs, STOP and report the actual number.
3. **Second substitution:**
   - Find: `1CWQ5sDfQHbMtcrSERK-58Gv5SBGsqtEn`
   - Replace: `1VEt06cFBq6LjmZdb6zBiDDI60oLxKOYj`
   - Click **Replace all** — must report exactly **1 occurrence replaced**.
4. Close the find dialog (Esc).

### Step 4 — Save

1. **Cmd-S** to save.
2. Watch for:
   - **Success:** "Unsaved changes" banner clears, no syntax error shown. Proceed to Step 5.
   - **Syntax error banner:** STOP. Report the exact line number and message. Common cause: the editor wasn't fully cleared before pasting (residual content past the canonical 659-line end). Recovery: Cmd-Shift-R to hard-reload the editor tab (discards unsaved changes), then redo Step 2 + Step 3 + Step 4 carefully.

### Step 5 — Redeploy as NEW VERSION of EXISTING deployment

1. Top-right **Deploy → Manage deployments** (NOT "New deployment").
2. Click the **pencil icon** on the existing deployment row to edit it.
3. **Version** dropdown → select **New version**.
4. **Description:** `v3 — status updates handlers + broadcast email helper + auto-publish roll call (generations submission append to Roll Call tab + roll_call_delete handler) + handleDocumentUpload defensive guard`
5. **Execute as:** Me (rowellfamilyreunion2026@gmail.com) — should already be selected.
6. **Who has access:** Anyone — should already be selected.
7. Click **Deploy**. If a permission consent dialog fires (new scopes — Status Updates handler reads from Registrations for the BCC list which may trigger a fresh consent), grant the permission as the reunion account.
8. Copy the **Web app URL** from the confirmation dialog.
9. Verify it matches **byte-for-byte**: `https://script.google.com/macros/s/AKfycbwT49cqzH6CK8Z4whoDYOl-qpVYfS4GuNW2Xsw4bSSheB91I3INSXeAyT3L_-fcShiAcA/exec`. If the URL differs, you accidentally created a new deployment — STOP and report.

### Step 6 — Backend GET smoke test

1. Paste the `/exec` URL into a new tab.
2. Confirm JSON banner: `{"status":"ok","message":"Rowell Reunion Form Handler is running","timestamp":"..."}` with a timestamp within the last minute.

### Step 7 — Status-update round-trip smoke test (NO broadcast)

1. Open `https://rowell-family-reunion.netlify.app/admin-updates.html` in the reunion-account window.
2. Hard-refresh (Cmd-Shift-R) to bust any cached HTML.
3. Enter admin password `Rowell2026` → click **Unlock**.
4. Confirm the admin sub-nav shows four tabs: `Dashboard | Documents | Status Updates | Roll Call` (Status Updates active).
5. Fill the publish form:
   - **Subject:** `S108 backend smoke test — please ignore`
   - **Message:** `Confirming the v3 redeploy lit up the status_update handlers. Will be deleted immediately.`
   - **Optional document attachment:** leave empty
   - **"Email this update to all registered members" checkbox: UNCHECK IT** (critical guardrail — do not fire a real broadcast).
6. Click **Publish Update**.
7. Confirm the green success banner reads: `Published as #N. Not emailed (checkbox was unchecked).` where N is a small integer.
8. Confirm the test row appears in the "Published Updates" list below the form.
9. In a new tab, open `https://rowell-family-reunion.netlify.app/updates.html` and hard-refresh. Confirm the test update appears as the topmost card with the matching subject + message.
10. Back on admin-updates.html, click **Delete** on the test row. Accept the confirm dialog.
11. Confirm the test row disappears from the admin list immediately.
12. Hard-refresh `updates.html`. Confirm the test update is also gone.

### Step 8 — Auto-publish Roll Call smoke test

This tests Feature 2 — that a Generations form submission appears on the public roll call immediately, and that the admin moderation tool can delete it.

1. Open `https://rowell-family-reunion.netlify.app/generations.html` and hard-refresh.
2. Scroll down to the Family Roll Call section. Confirm the roll call has loaded with ~91 seeded entries grouped into First Generation through Fifth Generation sections. (If you see "Loading roll call…" indefinitely, STOP and report — the gviz fetch failed.)
3. Scroll to the bottom — the "Submit a Generations Update" form should be there.
4. Fill the form:
   - **Your name:** `Smoke Test`
   - **Your email:** any throwaway email
   - **What are you submitting?:** `New birth or addition`
   - **Person's full name:** `Z S108 Smoke Test — please delete`
   - **Generation:** `Sixth Generation` (so it's easy to spot)
   - **Parent's name dropdown:** select any entry; "Parent not listed" is also fine
   - Leave date fields empty; **Additional notes:** `Smoke test row — safe to delete.`
5. Click **Submit Update**.
6. Confirm the success banner reads roughly: `Thank you! Your submission has been added to the roll call above. Scroll up to verify…`
7. Scroll up to the Family Roll Call section. Confirm a new "Sixth Generation" section now exists with `Z S108 Smoke Test — please delete` as its only entry. (If the section doesn't auto-appear, refresh the page; it should appear via the gviz fetch.)
8. Open `https://rowell-family-reunion.netlify.app/admin-roll-call.html` and hard-refresh.
9. Enter admin password `Rowell2026` → Unlock.
10. Confirm the admin sub-nav shows four tabs: `Dashboard | Documents | Status Updates | Roll Call` (Roll Call active).
11. Find the `Z S108 Smoke Test — please delete` row (use the "Name contains" filter with `S108` to make it easy).
12. Click **Delete** on that row. Accept the confirm dialog.
13. Confirm the row disappears from the admin list immediately.
14. Switch back to the Generations page tab. Hard-refresh. Confirm the test entry is gone from the Sixth Generation section (and the entire Sixth Generation section disappears since the test entry was its only member).

### Step 9 — Report back

Reply with ALL of the following in a single message to the orchestrator that issued this prompt:

```
Step 2 final line count after paste: <should be ~720>
Step 2 trailing-junk check: <clean / had to delete N extra lines>
Step 3 Sheet ID substitution count: <should be exactly 9>
Step 3 folder ID substitution count: <should be exactly 1>
Step 4 save: <success / syntax error with line+message>
Step 5 /exec URL after deploy: <full URL — must match byte-for-byte>
Step 6 GET smoke test: <pass + banner timestamp / fail with reason>

Status Updates feature (Step 7):
- publish update_id: <N>
- admin list shows test row: <yes / no>
- public updates.html shows test row: <yes / no>
- delete removes from both views: <yes / no>

Auto-publish Roll Call feature (Step 8):
- initial roll call load: <91 seeded entries / something else>
- form submit success banner: <appeared / failed>
- test entry visible on public generations roll call: <yes / no — after which action>
- admin roll call list shows test entry: <yes / no>
- delete removes from both admin AND public views: <yes / no>

Anything weird (auth prompts, errors, deviations):
- ...

Time spent: <X minutes>
```

Stop after Step 9. Do not perform any additional actions. Do not send a real broadcast email.

=== END PROMPT ===
