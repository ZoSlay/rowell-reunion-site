/**
 * Rowell Reunion Form Handler v4 (REUNION-PAYMENT-CONFIRM-001)
 *
 * Changes from v3:
 * - Added onPaymentStatusEdit(e) handler — fires when the payment_status
 *   column on the Registrations sheet flips to PAID. Auto-generates a
 *   confirmation number (RFR-2026-NNN), writes it to the confirmation_sent
 *   column, and emails the registrant.
 * - Idempotent: re-edits to a row that already has a confirmation number
 *   do NOT re-send the email.
 * - REQUIRES INSTALLABLE TRIGGER: simple onEdit cannot send email to
 *   non-script-owner addresses. Operator must add the trigger manually
 *   via Edit -> Current project's triggers -> Add trigger ->
 *   choose function "onPaymentStatusEdit", event source "From spreadsheet",
 *   event type "On edit".
 *
 * Changes in v3:
 * - Added 'generations_submission' type for the generations.html intake form
 * - Auto-creates 'Generations Submissions' sheet tab on first submission
 * - Sends a notification email to rowellfamilyreunion2026@gmail.com for each submission
 *
 * Changes in v2:
 * - Registration payload: removed hotel_intent, breakfast_count, museum_count, estimated_total
 * - Registration payload: added total_due
 * - Registrations tab headers updated to match new schema
 *
 * Deploy as: Web App → Execute as me → Anyone has access
 * Re-deploy after pasting: Deploy → Manage deployments → pencil-edit current →
 *   New version → save. (Keeps the same SHEETS_URL so the site code does not change.)
 */

function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({
      status: 'ok',
      message: 'Rowell Reunion Form Handler is running',
      timestamp: new Date().toISOString()
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var type = data.type;

    if (type === 'registration') {
      return handleRegistration(data);
    } else if (type === 'rsvp') {
      return handleRsvp(data);
    } else if (type === 'feedback') {
      return handleFeedback(data);
    } else if (type === 'generations_submission') {
      return handleGenerationsSubmission(data);
    } else {
      return jsonResponse({ status: 'error', message: 'Unknown type: ' + type });
    }
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

function handleRegistration(data) {
  var ss = SpreadsheetApp.openById('1YtHlmvUvaP77cbdhgAm_PPcW_ikfz1g9hQCeG11DAeo');
  var sheet = ss.getSheetByName('Registrations');

  // REUNION-019 schema: removed hotel_intent, breakfast_count, museum_count, estimated_total
  // Added total_due. Server-managed fields: amount_paid, payment_status, confirmation_sent
  sheet.appendRow([
    new Date().toISOString(),      // timestamp
    data.family_name || '',        // family_name
    data.first_name || '',         // first_name
    data.last_name || '',          // last_name
    data.email || '',              // email
    data.phone || '',              // phone
    data.num_adults || 0,          // num_adults
    data.num_children || 0,        // num_children
    data.num_under5 || 0,          // num_under5
    data.dietary_notes || '',      // dietary_notes
    data.payment_method || '',     // payment_method
    data.total_due || 0,           // total_due
    '',                            // amount_paid (manual entry)
    '',                            // payment_status (manual entry)
    '',                            // confirmation_sent (manual entry)
    data.notes || ''               // notes
  ]);

  return jsonResponse({ status: 'success', type: 'registration' });
}

function handleRsvp(data) {
  var ss = SpreadsheetApp.openById('1YtHlmvUvaP77cbdhgAm_PPcW_ikfz1g9hQCeG11DAeo');
  var sheet = ss.getSheetByName('RSVPs');

  sheet.appendRow([
    new Date().toISOString(),
    data.name || '',
    data.email || '',
    data.num_adults || 0,
    data.num_children || 0,
    data.dietary_restrictions || '',
    data.attending || ''
  ]);

  return jsonResponse({ status: 'success', type: 'rsvp' });
}

function handleFeedback(data) {
  var recipient = 'rowellfamilyreunion2026@gmail.com';
  var category = data.category || 'General';
  var subject = 'Reunion Site Feedback — ' + category;

  var body = 'Rowell Family Reunion — Feedback Submission\n'
    + '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n'
    + 'Name: ' + (data.name || 'Not provided') + '\n'
    + 'Email: ' + (data.email || 'Not provided') + '\n'
    + 'Category: ' + category + '\n\n'
    + 'Message:\n' + (data.message || '') + '\n\n'
    + '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'
    + 'Submitted: ' + new Date().toISOString() + '\n'
    + 'Source: Reunion website feedback form\n';

  var emailOptions = {
    to: recipient,
    subject: subject,
    body: body
  };

  if (data.email) {
    emailOptions.replyTo = data.email;
  }

  MailApp.sendEmail(emailOptions);

  return jsonResponse({ status: 'success', type: 'feedback' });
}

function handleGenerationsSubmission(data) {
  var ss = SpreadsheetApp.openById('1YtHlmvUvaP77cbdhgAm_PPcW_ikfz1g9hQCeG11DAeo');
  var sheet = ss.getSheetByName('Generations Submissions');
  if (!sheet) {
    sheet = ss.insertSheet('Generations Submissions');
    sheet.appendRow([
      'timestamp',
      'submitter_name',
      'submitter_email',
      'submission_type',
      'person_full_name',
      'generation',
      'parent_name',
      'parent_not_listed',
      'birth_date',
      'marriage_date',
      'death_date',
      'spouse_name',
      'notes',
      'review_status'
    ]);
  }

  sheet.appendRow([
    new Date().toISOString(),
    data.submitter_name || '',
    data.submitter_email || '',
    data.submission_type || '',
    data.person_full_name || '',
    data.generation || '',
    data.parent_name || '',
    data.parent_not_listed ? 'yes' : '',
    data.birth_date || '',
    data.marriage_date || '',
    data.death_date || '',
    data.spouse_name || '',
    data.notes || '',
    ''  // review_status — manual entry (pending / applied / declined)
  ]);

  var subject = 'Generations Submission — ' + (data.submission_type || 'unknown') + ' — ' + (data.person_full_name || 'unnamed');
  var body = 'Rowell Family Reunion — Generations Submission\n'
    + '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n'
    + 'Submitter: ' + (data.submitter_name || '') + ' <' + (data.submitter_email || '') + '>\n'
    + 'Type: ' + (data.submission_type || '') + '\n\n'
    + 'Person: ' + (data.person_full_name || '') + '\n'
    + 'Generation: ' + (data.generation || '(not specified)') + '\n'
    + 'Parent: ' + (data.parent_name || '(not specified)') + (data.parent_not_listed ? ' [PARENT NOT ON PAGE — manual review]' : '') + '\n'
    + 'Birth date: ' + (data.birth_date || '—') + '\n'
    + 'Marriage date: ' + (data.marriage_date || '—') + '\n'
    + 'Death date: ' + (data.death_date || '—') + '\n'
    + 'Spouse: ' + (data.spouse_name || '—') + '\n\n'
    + 'Notes:\n' + (data.notes || '(none)') + '\n\n'
    + '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'
    + 'Submitted: ' + new Date().toISOString() + '\n'
    + 'Source: Reunion website Generations intake form\n'
    + 'Review in: Generations Submissions sheet tab\n';

  var emailOptions = {
    to: 'rowellfamilyreunion2026@gmail.com',
    subject: subject,
    body: body
  };
  if (data.submitter_email) {
    emailOptions.replyTo = data.submitter_email;
  }
  MailApp.sendEmail(emailOptions);

  return jsonResponse({ status: 'success', type: 'generations_submission' });
}

/**
 * Installable onEdit trigger for the Registrations sheet.
 * Fires the auto-confirmation email when payment_status flips to PAID.
 *
 * Registrations sheet schema (1-indexed columns):
 *   1: timestamp        9: num_under5     13: amount_paid
 *   2: family_name     10: dietary_notes  14: payment_status   <-- watching this
 *   3: first_name      11: payment_method 15: confirmation_sent
 *   4: last_name       12: total_due      16: notes
 *   5: email
 *   6: phone
 *   7: num_adults
 *   8: num_children
 */
function onPaymentStatusEdit(e) {
  try {
    if (!e || !e.range) return;
    var sheet = e.range.getSheet();
    if (sheet.getName() !== 'Registrations') return;

    var col = e.range.getColumn();
    if (col !== 14) return;  // only the payment_status column

    var row = e.range.getRow();
    if (row < 2) return;  // skip header row

    var newValue = String(e.value || '').toUpperCase().trim();
    if (newValue !== 'PAID') return;  // only fire on PAID flip

    // Read the row data
    var rowData = sheet.getRange(row, 1, 1, 16).getValues()[0];
    var firstName        = String(rowData[2] || '').trim();
    var lastName         = String(rowData[3] || '').trim();
    var email            = String(rowData[4] || '').trim();
    var amountPaid       = rowData[12];
    var totalDue         = rowData[11];
    var existingConfirm  = String(rowData[14] || '').trim();

    if (!email) {
      // No email -- can't send. Log only.
      Logger.log('onPaymentStatusEdit: row ' + row + ' has no email; skipping email send.');
      return;
    }

    if (existingConfirm) {
      // Already confirmed -- idempotent guard, do not re-send.
      Logger.log('onPaymentStatusEdit: row ' + row + ' already has confirmation "' + existingConfirm + '"; skipping.');
      return;
    }

    // Generate confirmation number: RFR-2026-NNN (row-padded)
    var confirmationNumber = 'RFR-2026-' + ('00' + row).slice(-3);

    // Compose the email
    var displayName = (firstName + ' ' + lastName).trim() || 'Family';
    var subject = 'Rowell Family Reunion 2026 — Payment Confirmed (' + confirmationNumber + ')';

    var amountLine = '';
    if (amountPaid !== '' && amountPaid != null) {
      amountLine = 'Amount received: $' + amountPaid + '\n';
    } else if (totalDue !== '' && totalDue != null) {
      amountLine = 'Registration total: $' + totalDue + '\n';
    }

    var body = 'Hi ' + (firstName || displayName) + ',\n\n'
      + 'Your registration payment for the Rowell Family Reunion 2026 has been received.\n\n'
      + '────────────────────────────────────────\n'
      + 'CONFIRMATION NUMBER: ' + confirmationNumber + '\n'
      + amountLine
      + '────────────────────────────────────────\n\n'
      + 'Please keep this confirmation number for your records.\n\n'
      + 'See you July 17–19, 2026 at the Hilton Alexandria Old Town in Washington, DC!\n\n'
      + 'Lorenzo Slay\n'
      + '2026 Reunion President\n'
      + 'rowellfamilyreunion2026@gmail.com\n';

    MailApp.sendEmail({
      to: email,
      subject: subject,
      body: body,
      replyTo: 'rowellfamilyreunion2026@gmail.com'
    });

    // Stamp the confirmation number into the sheet (idempotent guard for future edits)
    sheet.getRange(row, 15).setValue(confirmationNumber);

    Logger.log('onPaymentStatusEdit: sent confirmation ' + confirmationNumber + ' to ' + email + ' (row ' + row + ')');
  } catch (err) {
    Logger.log('onPaymentStatusEdit ERROR: ' + err.toString());
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
