# Apps Script Deploy — v6 (Inline-Editable Registrants Table)

**For:** REUNION-INLINE-EDIT-001 (Round 6 — editable admin table)
**Date staged:** 2026-05-17
**Operator action required:** yes — paste Code.gs + re-deploy web app. **No new triggers needed** (the existing v4 onPaymentStatusEdit trigger still does its job).

---

## What changed in v6

- **New `handleCellUpdate(data)` handler** called via `doPost` when `type === 'cell_update'`. Updates a single cell on a named sheet at a named row + column. Powers the inline-editable table on `dashboard.html`.
  - Only the `Registrations` sheet is currently supported (the use case the Treasurer needs).
  - Column-name → column-number lookup via `REG_COLUMN_MAP` (16 known columns).
  - Currency columns (`total_due`, `amount_paid`) get `$` / `,` stripped and parsed to a number before writing, so the sheet stays numerically typed.
  - Returns `{status:"success", row, column, value}` on save, `{status:"error", message}` otherwise.

- **`onPaymentStatusEdit()` robustness fix.** The installable trigger now reads the cell value via `e.range.getValue()` instead of `e.value`. Installable triggers fire on programmatic edits (which is what `cell_update` does under the hood), but `e.value` may not be populated in that path. Reading the range directly works for both human and programmatic edits.
  - Net effect: when the Treasurer marks `payment_status = PAID` on the dashboard's inline-editable table, the same auto-confirmation email flow fires that would have fired if she'd typed `PAID` directly in the Google Sheet.

All existing handlers (registration / RSVP / feedback / generations / document_upload) are unchanged.

---

## Operator deploy steps

### Step 1: Update Code.gs
1. Open the Apps Script project: `https://script.google.com/u/0/home/projects/1VKBTaHCQ1jFtDtyQamZ0wiA5F2PEEzwLTnqA5KcWfixivQWiEFiyuS9L/edit`
2. Replace the entire `Code.gs` contents with the current `apps-script/Code.gs` from this repo. Save (`⌘S`).

### Step 2: Re-deploy the Web App
1. `Deploy` → `Manage deployments`
2. Click the pencil-edit icon on the active web-app deployment
3. Set `Version` to `New version`
4. Description: `v6 — inline-editable Registrants table`
5. Click `Deploy`
6. Confirm the URL is **unchanged**

### Step 3: Test end-to-end
1. Open `https://rowell-family-reunion.netlify.app/dashboard.html`, enter the admin password
2. On the Registrants table, find a row and click into the **Notes** column. Type something, then click out (or press Tab/Enter).
3. The cell should briefly grey-out (saving) then flash green (saved). Refresh the page — the Notes value should persist (reading from the Sheet).
4. Try the same on the **Status** column: type `PAID`. The cell should save AND within a few seconds the Confirmation column should auto-populate with `RFR-2026-NNN` (from the v4 trigger) AND the registrant should receive the confirmation email.
5. Try the **Paid** column: type `353` (or whatever amount). The cell should save and the value should re-display as `$353.00` after the auto-refresh.

If something fails, check Apps Script → **Executions** for the trace.

---

## What's editable vs read-only on the dashboard table

| Column | Editable? | Sheet column | Notes |
|---|---|---|---|
| Family / Name / Adults / Children / Under 5 / Method / Due | read-only | (varied) | Registrant-provided values; not normally edited by treasurer |
| **Email / Phone** | editable | email / phone | For typo fixes |
| **Dietary** | editable | dietary_notes | For accommodation tracking |
| **Paid** | editable | amount_paid | Currency: `$` and `,` stripped before save |
| **Status** | editable | payment_status | Setting to `PAID` triggers auto-confirmation email |
| **Confirmation** | editable | confirmation_sent | Auto-fills on PAID; can be overridden manually |
| **Notes** | editable | notes | General notes |

The editable columns visually highlight on hover; click to edit, then click away or press Tab/Enter to save. Press Escape to cancel mid-edit.

---

## Reverting if v6 breaks

1. `Deploy` → `Manage deployments` → pencil-edit → set Version back to v5
2. URL stays the same; existing handlers keep working; inline edits return `Unknown type: cell_update` (table cells will still appear editable on the page but saves will fail with a red error banner)
3. The robustness fix to `onPaymentStatusEdit` reverts too — back to relying on `e.value`. Auto-confirmation still works for human-typed edits, just not for programmatic ones.

---

## Site-side files touched in Round 6

- `apps-script/Code.gs` — v5 → v6 (added handleCellUpdate + branch + fixed onPaymentStatusEdit)
- `dashboard.html` — registrants table now has 14 columns (added Confirmation + Notes); CSS for editable cells; JS for inline edit + save-on-blur + save-state feedback (saving/saved/save-failed)
- `admin-documents.html` — auto-fill title from filename; Download link alongside Open; Filename column; clearer empty-state
- `apps-script/DEPLOY_v6.md` — this file
