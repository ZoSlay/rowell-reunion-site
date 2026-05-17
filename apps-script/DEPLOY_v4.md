# Apps Script Deploy — v4 (Payment Confirmation Auto-Email)

**For:** REUNION-PAYMENT-CONFIRM-001 (Round 4 of Reunion Package overhaul)
**Date staged:** 2026-05-17
**Operator action required:** yes — paste Code.gs + re-deploy web app + **add installable onEdit trigger** + brief account owner

---

## What changed in v4

- New function `onPaymentStatusEdit(e)` watches the **Registrations** sheet
- When the **payment_status** cell (column N, the 14th column) flips to `PAID` on any registrant row, it:
  1. Generates a confirmation number `RFR-2026-NNN` (NNN = sheet row, zero-padded to 3 digits)
  2. Writes that number into the **confirmation_sent** cell (column O, 15th column) on the same row
  3. Emails the registrant a confirmation with the number, amount, and reply-to set to `rowellfamilyreunion2026@gmail.com`
- **Idempotent:** if `payment_status` is edited again on a row that already has a confirmation number, no duplicate email is sent
- All existing handlers (registration / RSVP / feedback / generations) are unchanged

---

## Operator deploy steps (one-time)

### Step 1: Update Code.gs
1. Open the Apps Script project:
   `https://script.google.com/u/0/home/projects/1VKBTaHCQ1jFtDtyQamZ0wiA5F2PEEzwLTnqA5KcWfixivQWiEFiyuS9L/edit`
2. Replace the entire `Code.gs` contents with the current `apps-script/Code.gs` from this repo. Save (`⌘S`).

### Step 2: Re-deploy the existing Web App
1. `Deploy` → `Manage deployments`
2. Click the pencil-edit icon on the active web-app deployment
3. Set `Version` to `New version`
4. Description: `v4 — payment confirmation auto-email`
5. Click `Deploy`
6. Confirm the URL is **unchanged** (same SHEETS_URL the site already calls)

### Step 3: Add the installable onEdit trigger (the critical new piece)

The auto-email **will not fire** without this step. Apps Script's "simple" onEdit triggers can't send email — only installable triggers can.

1. In the Apps Script editor, click the **clock icon** in the left sidebar (Triggers)
2. Click `+ Add Trigger` (bottom right)
3. Fill in:
   - **Choose which function to run:** `onPaymentStatusEdit`
   - **Choose which deployment should run:** `Head`
   - **Select event source:** `From spreadsheet`
   - **Select event type:** `On edit`
   - **Failure notification settings:** `Notify me immediately` (so you catch silent breakages)
4. Click `Save`
5. Google will prompt for permissions — grant them (the trigger needs MailApp + SpreadsheetApp access on your account)

### Step 4: Test end-to-end with one row
1. Open the Google Sheet (Registrations tab)
2. Pick a real or test registrant row
3. In the `payment_status` column (column N), type `PAID` and press Enter
4. Within ~5 seconds, confirm:
   - The `confirmation_sent` column (column O) auto-fills with `RFR-2026-NNN`
   - The registrant receives an email with subject `Rowell Family Reunion 2026 — Payment Confirmed (RFR-2026-NNN)`
5. Edit the same row's `payment_status` again (still `PAID`) and confirm **no second email is sent** (idempotency check)

If something doesn't work, check Apps Script's **Executions** tab in the left sidebar — failed runs surface there with stack traces.

---

## Account owner onboarding (one-time)

The Venmo account owner — **Treasurer Cassandra Rowell Miller (`casmille@san.rr.com`)** — sees the inbound payment notifications and is responsible for confirming payment for all registrants. She needs to mark `PAID` in the Sheet so the auto-confirmation fires.

### Step A: Share Sheet edit access
- Open the Google Sheet (`https://docs.google.com/spreadsheets/d/1YtHlmvUvaP77cbdhgAm_PPcW_ikfz1g9hQCeG11DAeo/edit`)
- `Share` → add Cassandra's Google account (`casmille@san.rr.com` or her preferred Google login) with **Editor** access
- Send her the link + the one-pager below

### Step B: Brief them with this one-pager

> **How to confirm a Rowell Reunion registrant's payment:**
>
> 1. When you receive a Venmo notification email from a registrant (memo will say "Rowell Reunion - [their family name]"), open the Google Sheet (link in your email)
> 2. Go to the **Registrations** tab
> 3. Find the registrant's row by searching for their name (`⌘F` / `Ctrl+F`)
> 4. In the **amount_paid** column (column M), type the actual amount received
> 5. In the **payment_status** column (column N), type **PAID** and press Enter
> 6. Done. The Sheet automatically generates a confirmation number and emails it to the registrant within a few seconds.
>
> **If a payment is partial or wrong amount:** type `PARTIAL` instead of `PAID`, and contact the registrant directly. No auto-email goes out until `PAID` is set.
>
> **If you mark `PAID` by mistake:** the confirmation email has already gone out and cannot be unsent. Contact the registrant directly to apologize and reconcile.

---

## What the registrant sees

1. They register via the website → land on thank-you.html with a big "Pay $X via Venmo" button pre-filled with their amount + memo
2. They tap → Venmo app opens (mobile) or profile page (desktop) with the amount + memo pre-filled
3. They confirm payment in Venmo
4. **Some time later** (could be minutes if account owner is watching, could be hours/days otherwise) the account owner marks PAID in the Sheet
5. Registrant receives `Rowell Family Reunion 2026 — Payment Confirmed (RFR-2026-NNN)` email with their confirmation number
6. They keep the confirmation number for their records

---

## Reverting if something breaks

If v4 causes problems:
1. **Disable the trigger first:** Apps Script → Triggers (clock icon) → find `onPaymentStatusEdit` → click 3-dot menu → Delete trigger. This stops the auto-email.
2. Optionally revert Code.gs to v3 via `Deploy` → `Manage deployments` → set version back to v3.
3. Marking `PAID` manually in the sheet will then have no auto-email side-effect (back to fully manual workflow).

---

## Site-side files touched in this round

- `apps-script/Code.gs` — v3 → v4 (added onPaymentStatusEdit handler + header)
- `thank-you.html` — added Venmo deep-link button (reads amount + name from localStorage that register.html already saves)
- `apps-script/DEPLOY_v4.md` — this file
