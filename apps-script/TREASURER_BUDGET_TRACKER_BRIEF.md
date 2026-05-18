# Rowell Reunion 2026 — Budget Tracker Treasurer Brief

**For:** Cassandra Rowell Miller (Treasurer)
**From:** Zo Slay (Reunion President)
**Sheet:** [Rowell Family Reunion 2026 — Budget Tracker](https://docs.google.com/spreadsheets/d/1q8zLK-iidjgzKxMD7h9NPhTigya73O62P9BAPRUHT8I/edit) (you have Editor access)

---

## What this tracker does

Every dollar planned and every dollar spent for the 2026 reunion lives here. The admin dashboard at https://rowell-family-reunion.netlify.app/dashboard.html pulls its Financial Summary numbers directly from this tracker — when you update it, the dashboard updates automatically within ~10 seconds on the next page load.

## The 4 tabs

| Tab | What you do |
|---|---|
| **Summary** | Read-only dashboard. Don't edit cells here — they roll up automatically from Details. |
| **Details** | **Where you do all your work.** Every line item lives here. |
| **Payments** | Optional running log of each payment as it's made (good for reconciling with your bank). |
| **README** | The original "how to use" notes — same info as this brief. |

## Where you edit (Details tab)

The columns you'll touch most:

| Column | Field | When to edit |
|---|---|---|
| **D** Qty | Number of units (40 attendees, 1 venue rental, etc.) | When line item is first created |
| **E** Unit Cost | Per-unit price | When line item is first created |
| **F** Planned Total | Auto-calculates = D × E. **Or** type a flat total directly here if Qty/Unit doesn't make sense | Auto |
| **G** Actual Total | The real invoice amount (may differ from Planned) | When you receive an invoice |
| **H** Deposit Paid | How much we've actually paid toward this line | Each time a payment goes out |
| **I** Balance Due | Auto = F − H | Auto |
| **J** Payment Status | Auto: PAID / PARTIAL / UNPAID | Auto |
| **K** Notes / Contact | Vendor email, phone, deadlines | Anytime |

**Currency: just type the number.** No dollar sign needed. Google Sheets formats it.

## How the dashboard reads it

The admin dashboard pulls exactly two numbers:
- **Total Obligation** = Summary cell B21 = sum of all Planned Totals
- **Deposit Paid** = Summary cell B28 = sum of all Deposit Paid amounts

That's it. Whatever you put into Details propagates to Summary, then to the dashboard.

## Common workflows

### A vendor sends an invoice
1. Find the matching row on **Details**
2. Fill in **G (Actual Total)** with the invoice amount
3. If the invoice differs from the planned amount, the Variance column on Summary will reflect it automatically
4. Add a note in **K** about the invoice (date, invoice number, contact)

### You make a payment
1. Find the row on **Details**
2. Add (or update) **H (Deposit Paid)** — running total of what we've paid on this line
3. Optionally: add a row to the **Payments** tab with the date, vendor, amount, method, reference
4. Column J auto-updates to PAID / PARTIAL / UNPAID

### A new expense comes up that's not yet on the list
1. Add a new row at the bottom of **Details**
2. Required: **A** (Item / Description) + **B** (Category — must match Summary categories: Venue, AV / Production, Food / Catering, Lodging, Decor, Transportation, Activities, Invitations / Printing, Photography, or Misc)
3. Fill in D + E (or F directly), and the row will roll into Summary via the category match

### A line item is over-budget
- Don't edit Planned (F) after the fact unless the scope actually changed. Let Variance (D column on Summary) show the gap — that's the audit trail.
- If scope did change (e.g., we decided to add Sunday brunch), update F and document the change in K.

## What NOT to touch

- **Summary tab cells** — they're formulas. If you accidentally type over one, undo (Cmd-Z) immediately.
- **Sheet structure** — don't rename tabs, don't delete columns, don't reorder rows on the Details header. The dashboard reads specific cell addresses; structure changes will break it.
- **The first 4 rows of Details** (title / instructions / header) — start your edits at row 5 or later.

## When in doubt

Text/call Zo. Don't worry about breaking things — Google Sheets auto-saves every keystroke, and there's full edit history under `File → Version history → See version history`.

## One-line for your phone

> **Where to edit:** Details tab, columns D-H. **Don't touch:** Summary tab cells (they roll up automatically).
