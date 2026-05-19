# Redeploy Recovery Prompt — Reset Editor + Retry v3 Status Updates Redeploy

Paste the section below (everything between the `=== BEGIN PROMPT ===` and `=== END PROMPT ===` markers) into Codex Desktop. This continues the prior `REDEPLOY_STATUS_UPDATES_PROMPT.md` run that hit a `SyntaxError: Unexpected token '*' line: 661` on save. The canonical `Code.gs` on GitHub is only 659 lines long, so line 661 is residue from a partial earlier paste — the fix is to fully discard the corrupted buffer before re-pasting.

---

=== BEGIN PROMPT ===

# Mission (continuation)

The prior REDEPLOY_STATUS_UPDATES_PROMPT.md run got partway through but the Apps Script editor's buffer is now corrupted: a save attempt produced `SyntaxError: Unexpected token '*' line: 661 file: Code.gs` and the "Unsaved changes" banner is still showing. The canonical `Code.gs` on GitHub is **659 lines** and ends cleanly with the `jsonResponse` function — so the error is residue from a prior incomplete paste, not a problem in the source.

This prompt resets the editor buffer to a known-good state, re-pastes from raw GitHub, re-applies the two ID substitutions, saves, redeploys as a NEW VERSION of the existing deployment (preserving the existing `/exec` URL), and runs the same smoke tests as the prior prompt.

You have browser access. The operator is at the keyboard for credentials.

## Account + critical IDs (unchanged from prior prompt)

- **Reunion Gmail (only account used):** `rowellfamilyreunion2026@gmail.com`
- **Apps Script project URL (now confirmed):** `https://script.google.com/home/projects/11ODlzSJuBi_qi773helFNeKYxq2mVFhc6s4ccwSv1LFVybJb0-e0iE5q/edit`
- **Live /exec URL (MUST be preserved):** `https://script.google.com/macros/s/AKfycbwT49cqzH6CK8Z4whoDYOl-qpVYfS4GuNW2Xsw4bSSheB91I3INSXeAyT3L_-fcShiAcA/exec`
- **Reunion Sheet ID:** `1krj2XFd-YXpwFubbNdLS3N0Bi-ZEhm9J3-PliMjPr1M`
- **Reunion upload folder ID:** `1VEt06cFBq6LjmZdb6zBiDDI60oLxKOYj`
- **Latest Code.gs raw URL:** `https://raw.githubusercontent.com/ZoSlay/rowell-reunion-site/main/apps-script/Code.gs` (659 lines, sha256 will change on any future commit — fetch fresh each time)
- **Admin password (for smoke test):** `Rowell2026`

## Constraints

1. **NEW VERSION of EXISTING deployment**, NOT "New deployment". `/exec` URL must match byte-for-byte after redeploy.
2. **Smoke-test publish: "Email this update to all registered members" checkbox MUST be UNCHECKED.** Real broadcast is a separate operator action.
3. **Do NOT push to GitHub** — source-of-truth stays on GitHub; you only paste into the live editor.

## Steps

### Step R1 — Hard reset the editor buffer

The current editor buffer has unsaved corrupted content. Discard it cleanly:

1. Make sure the Apps Script editor tab is the active tab.
2. **Hard-reload the editor tab: Cmd-Shift-R** (or Ctrl-Shift-R on non-Mac). 
3. If the browser prompts about losing unsaved changes, **accept the loss** — the GitHub raw source is canonical; nothing in the unsaved buffer is worth preserving.
4. After the reload, the editor should show the last-saved version of `Code.gs`. The "Unsaved changes" banner should be gone. The syntax-error banner should also be gone.
5. If `Cmd-Shift-R` does not work or the editor still shows "Unsaved changes" / a syntax-error banner: close the tab entirely, then re-open `https://script.google.com/home/projects/11ODlzSJuBi_qi773helFNeKYxq2mVFhc6s4ccwSv1LFVybJb0-e0iE5q/edit` in a fresh tab. The last-saved state will load.

### Step R2 — Verify the last-saved baseline (sanity check)

1. Scroll to the bottom of `Code.gs` in the editor. Note the last function name visible.
2. If the bottom of the file shows `function handleStatusUpdateCreate` or `function handleStatusUpdateDelete` or `function broadcastUpdateEmail`, the prior partial save somehow DID land — skip directly to Step R5 (smoke test the existing deployment first). If it doesn't work, return here and continue with R3.
3. Otherwise (last function is `handleCellUpdate` or `jsonResponse`, ending around the original ~530 line range), proceed to Step R3 to install v3.

### Step R3 — Replace contents fresh from raw GitHub

1. Open `https://raw.githubusercontent.com/ZoSlay/rowell-reunion-site/main/apps-script/Code.gs` in a new tab. 
2. **Cmd-A** to select all → **Cmd-C** to copy. Total should be 659 lines (no trailing blank lines after the final `}`).
3. Switch back to the Apps Script editor tab.
4. Click anywhere in the `Code.gs` editor pane.
5. **Cmd-A** to select EVERYTHING in the editor → **Delete** (or Backspace). The editor pane should now be empty.
6. **Cmd-V** to paste. The editor should now show 659 lines of new source ending with `function jsonResponse(obj) { ... }`.
7. Scroll to the very bottom. Confirm the LAST line of content is `}` (the closing brace of `jsonResponse`), with no trailing junk, no stray `*`, no orphan comment fragments. If you see anything past the `jsonResponse` closing brace, manually delete it.

### Step R4 — Apply substitutions + save

1. Cmd-E (Find and replace).
2. **First substitution:**
   - Find: `1YtHlmvUvaP77cbdhgAm_PPcW_ikfz1g9hQCeG11DAeo`
   - Replace: `1krj2XFd-YXpwFubbNdLS3N0Bi-ZEhm9J3-PliMjPr1M`
   - Click **Replace all** — should report **8 occurrences replaced**. If you see a different number, STOP and report.
3. **Second substitution:**
   - Find: `1CWQ5sDfQHbMtcrSERK-58Gv5SBGsqtEn`
   - Replace: `1VEt06cFBq6LjmZdb6zBiDDI60oLxKOYj`
   - Click **Replace all** — should report **1 occurrence replaced**.
4. Close the Find dialog (Esc or the X).
5. **Cmd-S** to save. Watch for either:
   - **Success:** the "Unsaved changes" banner clears. Proceed to Step R5.
   - **Syntax error banner:** STOP. Report the exact line number and message. Do NOT attempt to deploy with a syntax error — Apps Script will reject it anyway.

### Step R5 — Redeploy as NEW VERSION

1. Top-right **Deploy → Manage deployments** (NOT "New deployment")
2. Click the **pencil icon** on the existing deployment row.
3. **Version** dropdown → **New version**
4. **Description:** `v3 — status updates handlers + broadcast email helper + handleDocumentUpload defensive guard`
5. **Execute as:** Me (rowellfamilyreunion2026@gmail.com). **Who has access:** Anyone. (Both should already be selected.)
6. Click **Deploy**.
7. Copy the **Web app URL** from the confirmation dialog.
8. Verify it is byte-for-byte: `https://script.google.com/macros/s/AKfycbwT49cqzH6CK8Z4whoDYOl-qpVYfS4GuNW2Xsw4bSSheB91I3INSXeAyT3L_-fcShiAcA/exec`
9. If the URL differs, you created a new deployment — STOP and report.

### Step R6 — Backend GET smoke test

1. Paste the /exec URL into a new tab.
2. Confirm JSON banner: `{"status":"ok","message":"Rowell Reunion Form Handler is running","timestamp":"..."}` with a fresh timestamp (within the last minute).

### Step R7 — Status-update full round-trip smoke test (NO email broadcast)

1. Open `https://rowell-family-reunion.netlify.app/admin-updates.html` in the reunion-account window.
2. Hard-refresh (Cmd-Shift-R) to bust any cached HTML.
3. Enter admin password `Rowell2026` → Unlock.
4. Confirm admin sub-nav shows three tabs: `Dashboard | Documents | Status Updates` (Status Updates active).
5. Fill the publish form:
   - **Subject:** `S108 backend smoke test — please ignore`
   - **Message:** `Confirming the v3 redeploy lit up the status_update handlers. Will be deleted immediately.`
   - **Optional document attachment:** leave empty
   - **"Email this update to all registered members" checkbox: UNCHECK IT.** This is critical — do not fire a real broadcast.
6. Click **Publish Update**.
7. Confirm the success banner: `Published as #N. Not emailed (checkbox was unchecked).`
8. Confirm the test row appears in the "Published Updates" list with `#N · <date> · Not emailed`.
9. In a new tab, open `https://rowell-family-reunion.netlify.app/updates.html` and hard-refresh (Cmd-Shift-R). Confirm the test update appears as the topmost card.
10. Back on admin-updates.html, click **Delete** on the test row. Accept the confirm dialog.
11. Confirm the test row disappears from the admin list.
12. Hard-refresh updates.html. Confirm the test update is gone.

### Step R8 — Report back

Reply with ALL of the following in a single message to the orchestrator:

```
Step R1 hard reset: <success / had to close tab / other>
Step R2 baseline last function: <handleCellUpdate / jsonResponse / handleStatusUpdateCreate / other>
Step R3 final line count after paste: <should be 659>
Step R3 trailing-junk check: <clean / had to delete N extra lines>
Step R4 Sheet ID substitution count: <should be 8>
Step R4 folder ID substitution count: <should be 1>
Step R4 save: <success / syntax error with line+message>
Step R5 /exec URL after deploy: <full URL — must match byte-for-byte>
Step R6 GET smoke test: <pass / fail + banner snippet + timestamp>
Step R7 publish #N: <update_id assigned>
Step R7 admin list shows test row: <yes / no>
Step R7 public updates.html shows test row: <yes / no>
Step R7 delete removes from BOTH admin and public: <yes / no>

Anything weird:
- ...

Time spent (this recovery run): <X minutes>
```

Stop after Step R8. Do not perform any additional actions. Do not send a real broadcast email.

=== END PROMPT ===
