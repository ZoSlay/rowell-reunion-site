# Migration Follow-up Prompt — Budget Tracker Move + Code.gs Redeployment

Paste the section below (everything between the `=== BEGIN PROMPT ===` and `=== END PROMPT ===` markers) into Codex Desktop or Claude Cowork. The agent will drive a browser to perform two bundled follow-ups to the S108 reunion-Gmail migration. After completion, paste the agent's final report back to the orchestrator that originated this prompt.

---

=== BEGIN PROMPT ===

# Mission

You are completing two follow-ups to the prior reunion-Gmail backend migration. Both run in the operator's browser; the operator (Lorenzo Slay / "Zo") is at the keyboard for credential entry. You drive UI clicks and copy/paste.

**Task A — Move Budget Tracker:** copy the Budget Tracker Sheet from the operator's personal Google account to the reunion Gmail account (deferred from the prior migration). New copy needs anyone-with-link reader + per-user Editor grants.

**Task B — Redeploy Apps Script with updated Code.gs:** the live reunion-account Apps Script has a small defect (manual-invocation TypeError at line 374) plus a hardening commit landed in GitHub. Pick up the latest source from GitHub raw, re-paste, re-apply ID substitutions, and **redeploy as a NEW VERSION of the EXISTING deployment** so the live `/exec` URL stays the same.

## Accounts

- **Personal:** `lorenzo.slay@slaycorp.co` — owns Budget Tracker source
- **Reunion:** `rowellfamilyreunion2026@gmail.com` — owns Apps Script project + new Sheet (from prior migration)

Use **separate browser profiles** or **different browsers** to avoid "wrong account" confusion. Recommended: Incognito window for the reunion-account work, regular window for personal-account work.

## Current state (as of this prompt)

- **Personal Budget Tracker Sheet:** ID `1q8zLK-iidjgzKxMD7h9NPhTigya73O62P9BAPRUHT8I` — `https://docs.google.com/spreadsheets/d/1q8zLK-iidjgzKxMD7h9NPhTigya73O62P9BAPRUHT8I/edit` — owned by `lorenzo.slay@slaycorp.co`; anyone-with-link reader; Cassandra Rowell Miller (`casmille@san.rr.com`) has Editor; 4 tabs (Summary, Details, Payments, README)
- **Reunion-account Apps Script project:** find via `https://script.google.com/home` while signed in as reunion Gmail → project name `Rowell Reunion Backend`
- **Live /exec URL (must NOT change):** `https://script.google.com/macros/s/AKfycbwT49cqzH6CK8Z4whoDYOl-qpVYfS4GuNW2Xsw4bSSheB91I3INSXeAyT3L_-fcShiAcA/exec`
- **Reunion-account Sheet (registrations/RSVPs/documents — from prior migration):** ID `1krj2XFd-YXpwFubbNdLS3N0Bi-ZEhm9J3-PliMjPr1M`
- **Reunion-account upload folder (from prior migration):** ID `1VEt06cFBq6LjmZdb6zBiDDI60oLxKOYj`
- **Latest `Code.gs` source of truth:** GitHub repo `ZoSlay/rowell-reunion-site` raw URL: `https://raw.githubusercontent.com/ZoSlay/rowell-reunion-site/main/apps-script/Code.gs`

## Constraints / safety

1. **Do NOT use "New deployment"** in Apps Script for Task B. Use **Deploy → Manage deployments → pencil-edit existing → Version: New version → Deploy**. The existing /exec URL must be preserved; a "New deployment" mints a new URL that would require another site-file swap.
2. **Do NOT delete the personal-account Budget Tracker.** It stays as fallback. The orchestrator will handle decommissioning later.
3. **Do NOT modify any file in the `~/rowell-reunion-site` repo or push to GitHub.** Code.gs source-of-truth lives on GitHub; you only paste it into Apps Script.
4. **Do NOT change ownership** of personal-account assets. Task A is a copy, not a transfer.
5. After Task A, **explicitly set anyone-with-link reader on the new Budget Tracker** (the prior migration learned that `File → Make a copy` resets sharing to Restricted, breaking gviz reads from the public dashboard).
6. If anything errors unexpectedly, stop and ask the operator. No destructive retries.

## Task A — Move Budget Tracker

### Step A1 — Share personal Budget Tracker with reunion account (operator-driven, personal window)

1. In a non-incognito window where the operator is signed into `lorenzo.slay@slaycorp.co`:
2. Open `https://docs.google.com/spreadsheets/d/1q8zLK-iidjgzKxMD7h9NPhTigya73O62P9BAPRUHT8I/edit`
3. Click **Share** (top right) → add `rowellfamilyreunion2026@gmail.com` with **Editor** access → uncheck "Notify people" → **Share**

### Step A2 — Make a copy under reunion account (reunion window)

1. In the incognito / reunion-account window:
2. Open `https://docs.google.com/spreadsheets/d/1q8zLK-iidjgzKxMD7h9NPhTigya73O62P9BAPRUHT8I/edit` — you should now see the Sheet (granted in Step A1)
3. **File → Make a copy**
4. Name: `Rowell Family Reunion 2026 — Budget Tracker`
5. Folder: **My Drive** (root of reunion account)
6. Uncheck "Copy comments" if asked
7. Click **Make a copy**
8. Once the copy opens, **copy its Sheet ID from the URL** (the segment between `/d/` and `/edit`). Save this. Call it `NEW_BUDGET_SHEET_ID`.

### Step A3 — Verify SUMIF formulas + tab structure intact

1. Confirm 4 tabs: `Summary`, `Details`, `Payments`, `README`
2. On the `Summary` tab, confirm cell **B21** (Planned Grand Total) shows a numeric value (should be around `$13,378.34`) — not `#REF!` and not a literal formula string
3. Confirm cell **B28** (Total deposits paid) shows a numeric value (around `$1,097.95`)
4. If either shows `#REF!` or formulas-as-text, **stop** and report — the SUMIF references didn't carry over cleanly

### Step A4 — Set anyone-with-link reader on the new Budget Tracker (CRITICAL)

This was the gotcha from the prior migration. Without this step, the live dashboard at `https://rowell-family-reunion.netlify.app/dashboard.html` cannot fetch budget values via gviz.

1. Open the new Budget Tracker (still in reunion-account window)
2. Click **Share** (top right)
3. Bottom section **"General access"** → click `Restricted` → change to **Anyone with the link**
4. Confirm role is **Viewer** (NOT Editor)
5. **Done** (no save button)

### Step A5 — Per-user Editor grants on the new Budget Tracker

1. Still in the same Share dialog (or reopen it):
2. Add `lorenzo.slay@slaycorp.co` with **Editor** → uncheck "Notify"
3. Add `casmille@san.rr.com` with **Editor** → uncheck "Notify"
4. Click **Share**

## Task B — Redeploy Apps Script

### Step B1 — Fetch latest Code.gs

1. In any browser tab, open `https://raw.githubusercontent.com/ZoSlay/rowell-reunion-site/main/apps-script/Code.gs`
2. Select all (Cmd-A) → copy (Cmd-C). Hold this on the clipboard for Step B3.

### Step B2 — Open existing Apps Script project (reunion window)

1. Open `https://script.google.com/home` — verify avatar = reunion Gmail
2. Click the project `Rowell Reunion Backend`
3. Open the `Code.gs` file in the editor

### Step B3 — Replace contents + apply substitutions

1. In the editor: select all (Cmd-A) → delete
2. Paste the clipboard contents from Step B1
3. **Find & Replace** (Cmd-E or Edit menu → Find and replace):
   - **Find:** `1YtHlmvUvaP77cbdhgAm_PPcW_ikfz1g9hQCeG11DAeo`
   - **Replace:** `1krj2XFd-YXpwFubbNdLS3N0Bi-ZEhm9J3-PliMjPr1M`
   - Click **Replace all** (should match 6 occurrences — confirm the count in the dialog)
4. **Second Find & Replace:**
   - **Find:** `1CWQ5sDfQHbMtcrSERK-58Gv5SBGsqtEn`
   - **Replace:** `1VEt06cFBq6LjmZdb6zBiDDI60oLxKOYj`
   - Click **Replace all** (should match 1 occurrence)
5. **Cmd-S** to save

### Step B4 — Redeploy as NEW VERSION of EXISTING deployment (preserves /exec URL)

This is the critical step — read it carefully before clicking.

1. Top-right **Deploy → Manage deployments** (NOT "New deployment")
2. A list appears showing existing deployments. There should be exactly one (the live one). Click the **pencil icon** next to it to edit.
3. **Version** dropdown → select **New version**
4. **Description:** `v2 — Code.gs:374 defensive guard + post-migration cleanup`
5. **Execute as:** Me (rowellfamilyreunion2026@gmail.com) — should already be selected
6. **Who has access:** Anyone — should already be selected
7. Click **Deploy**
8. After deploy completes, a confirmation dialog shows the **Web app URL**. Verify it is **identical** to: `https://script.google.com/macros/s/AKfycbwT49cqzH6CK8Z4whoDYOl-qpVYfS4GuNW2Xsw4bSSheB91I3INSXeAyT3L_-fcShiAcA/exec`
9. If the URL is DIFFERENT, you accidentally created a new deployment. Stop and report — the orchestrator will need to do another site-file swap.

### Step B5 — Smoke test

1. Paste the /exec URL into a new tab. Confirm JSON banner: `{"status":"ok","message":"Rowell Reunion Form Handler is running","timestamp":"..."}`
2. Open the reunion-account Sheet `Registrations` tab: `https://docs.google.com/spreadsheets/d/1krj2XFd-YXpwFubbNdLS3N0Bi-ZEhm9J3-PliMjPr1M/edit#gid=0`
3. If there's a test row from the prior migration, pick a payment_status cell on a row that has NOT yet been marked PAID and type `PAID` + Enter. Within ~5 sec, `confirmation_sent` should auto-fill. If there's no suitable test row, you can manually add a row with a fake email and toggle `payment_status` to PAID. Confirm the trigger still fires after redeploy.

## Step C — Report back

Reply with **all** of the following pasted in a single message back to the orchestrator that issued this prompt:

```
NEW_BUDGET_SHEET_ID:           <from Step A2>
A3 SUMIF verification:         <pass / fail + which cell failed>
A4 anyone-with-link reader:    <confirmed / failed>
A5 per-user Editor grants:     <both added / which failed>

B3 Sheet ID substitution:      <count actually matched, e.g., "6 of 6">
B3 folder ID substitution:     <count actually matched, e.g., "1 of 1">
B4 /exec URL after redeploy:   <full URL — should match the expected one byte-for-byte>
B5 GET smoke test:             <pass / fail + banner snippet>
B5 trigger smoke test:         <pass / fail + which row, what RFR-2026-NNN appeared>

Anything weird (auth prompts, errors, deviations):
- ...

Time spent: <X minutes>
```

The orchestrator will then:
- Swap `NEW_BUDGET_SHEET_ID` into `dashboard.html` line 232 (`BUDGET_SHEET_ID` constant) in a single commit
- Smoke-test the live dashboard against the new Budget Tracker
- Keep the old personal-account Budget Tracker alive for 48h as fallback

Do not proceed with any site-file edits or decommissioning yourself. Stop after Step C.

=== END PROMPT ===
