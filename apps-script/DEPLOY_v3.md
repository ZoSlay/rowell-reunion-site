# Apps Script Deploy — v3 (Generations Intake)

**For:** REUNION-GENERATIONS-INTAKE-001
**Date staged:** 2026-05-16
**Operator action required:** yes (paste new Code.gs + re-deploy)

---

## What changed in v3

- New submission type: `generations_submission`
- New sheet tab auto-created on first submission: **`Generations Submissions`**
- Each submission also sends a notification email to `rowellfamilyreunion2026@gmail.com`
- All existing handlers (registration / rsvp / feedback) are unchanged

---

## Operator deploy steps

1. **Open the Apps Script project**
   `https://script.google.com/u/0/home/projects/1VKBTaHCQ1jFtDtyQamZ0wiA5F2PEEzwLTnqA5KcWfixivQWiEFiyuS9L/edit`

2. **Replace the entire `Code.gs` contents** with the current contents of `apps-script/Code.gs` from this repo. (Copy the file in this repo, paste over the editor contents, save with the disk icon or `⌘S`.)

3. **Re-deploy the existing Web App** so the new code goes live at the same URL the site already calls:
   - `Deploy` → `Manage deployments`
   - Click the pencil-edit icon on the active web-app deployment (the one whose URL ends in `…dGIhHkT8Isk9dOv-_rKcXCf0N-eMg/exec` — same URL used by `script.js` for RSVP / Feedback)
   - Set `Version` to `New version`
   - Add description: `v3 — generations submissions`
   - Click `Deploy`
   - Confirm the resulting URL is **unchanged** (this is the whole point of editing the existing deployment vs creating a new one)

4. **Sanity-check** by submitting one test submission from the live site at `https://zoslay.github.io/rowell-reunion-site/generations.html`:
   - Use your own name/email
   - Pick "Correction" type, person "Test Submission", generation 5th, parent any 4th-gen name
   - Submit
   - Confirm three things: (a) the "Thank you!" message appears in green on the page, (b) a new tab named `Generations Submissions` exists in the Google Sheet with a header row + your test row, (c) a notification email landed at `rowellfamilyreunion2026@gmail.com`
   - Delete the test row from the sheet

5. **If submission fails** (red error message in the form), most likely cause: the re-deploy didn't go through. Re-check step 3, particularly that you picked "New version" (not just "Save"). Apps Script web-app code only goes live when you explicitly deploy a new version.

---

## What the operator sees post-submission

Each new submission produces:

- A **row in the `Generations Submissions` sheet tab** (auto-created on first hit). Schema:
  | Column | Notes |
  |---|---|
  | timestamp | ISO 8601, server time |
  | submitter_name | required field on form |
  | submitter_email | required field on form |
  | submission_type | `new_birth` / `marriage_or_name` / `passed` / `new_spouse` / `correction` |
  | person_full_name | required |
  | generation | `1`–`6` or empty |
  | parent_name | from dropdown OR free text |
  | parent_not_listed | `yes` if submitter picked "Parent not listed" (manual review needed) |
  | birth_date / marriage_date / death_date | conditional on type |
  | spouse_name | optional, for future tree expansion |
  | notes | free text |
  | review_status | **manual entry** — fill with `pending` / `applied` / `declined` as you triage |

- An **email** to `rowellfamilyreunion2026@gmail.com` with the same fields formatted readably, `Reply-To` set to the submitter's email so you can respond directly.

---

## Reverting if something breaks

If the v3 deploy causes problems with the existing forms (registration / RSVP / feedback):

1. `Deploy` → `Manage deployments` → pencil-edit the same deployment
2. Set `Version` back to the previous version number (was likely `v2`)
3. Click `Deploy`
4. URL stays the same; site goes back to v2 behavior

The v3 code adds a new branch in `doPost()` and a new handler — it doesn't modify any v2 code paths — so a regression would be surprising, but the rollback is one-click.

---

## Site-side files touched

- `apps-script/Code.gs` — v2 → v3 (added handler + branch)
- `generations.html` — replaced "Email an Update" CTA card with the intake form + inline JS for cascading dropdown + submit handling
