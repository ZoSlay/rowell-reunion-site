/**
 * Rowell Reunion Form Handler v6 (REUNION-INLINE-EDIT-001)
 *
 * Changes from v5:
 * - Added 'cell_update' type for inline-editable admin table cells on
 *   dashboard.html. Updates a single cell on a named sheet at a named
 *   row + column. Used by the Treasurer to mark payments PAID, edit
 *   notes/dietary/contact fields without leaving the admin page.
 * - Made onPaymentStatusEdit() read the cell value directly via
 *   e.range.getValue() instead of relying on e.value. Installable
 *   triggers fire on programmatic edits (from cell_update) but
 *   e.value may not be populated in that path — reading the range
 *   directly works for both human and programmatic edits.
 *
 * Changes in v5:
 * - Added 'document_upload' type for the admin-documents.html upload form.
 *   Decodes a base64-encoded file payload, writes it to a Drive folder
 *   ("Rowell Reunion 2026 Documents"), sets share-by-link permissions, and
 *   records metadata in a "Documents" sheet tab (auto-created on first
 *   upload). Returns the Drive URL + file ID to the client.
 * - Apps Script payload cap (~6 MB JSON) bounds file size to roughly 5 MB
 *   raw (after base64 inflation). Client enforces this pre-POST.
 *
 * Changes in v4:
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
    } else if (type === 'document_upload') {
      return handleDocumentUpload(data);
    } else if (type === 'cell_update') {
      return handleCellUpdate(data);
    } else if (type === 'status_update_create') {
      return handleStatusUpdateCreate(data);
    } else if (type === 'status_update_delete') {
      return handleStatusUpdateDelete(data);
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
 * One-time installer for the onPaymentStatusEdit trigger.
 *
 * This is a STANDALONE Apps Script (not container-bound to a specific Sheet),
 * so the trigger-creation UI does NOT offer "From spreadsheet" as an event
 * source. The trigger must be installed programmatically. Run this function
 * once from the Apps Script editor (▶ Run with installPaymentTrigger
 * selected). It is idempotent: re-running it removes any prior trigger of the
 * same name before creating a new one, so calling it again after Code.gs
 * changes is safe.
 */
function installPaymentTrigger() {
  var SHEET_ID = '1YtHlmvUvaP77cbdhgAm_PPcW_ikfz1g9hQCeG11DAeo';
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'onPaymentStatusEdit') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  ScriptApp.newTrigger('onPaymentStatusEdit')
    .forSpreadsheet(SHEET_ID)
    .onEdit()
    .create();
  Logger.log('onPaymentStatusEdit trigger installed for sheet ' + SHEET_ID);
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

    // Read the cell value directly. e.value is unreliable for programmatic
    // edits (e.g., when the inline-edit table on dashboard.html writes via
    // cell_update -> handleCellUpdate -> setValue). Reading the range
    // gives us the right answer for both human and programmatic edits.
    var newValue = String(e.range.getValue() || '').toUpperCase().trim();
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

// Pinned Drive folder for uploaded reunion documents. Lives at:
//   My Drive / Family Reunion Documunts / Rowell Reunion 2026 Documents
// If this folder is ever moved, the ID stays valid. If it is deleted or the
// script-owner loses access, upload returns a clear error rather than
// silently creating a new folder in Drive root.
var UPLOAD_FOLDER_ID = '1CWQ5sDfQHbMtcrSERK-58Gv5SBGsqtEn';

/**
 * Document upload handler — called via doPost when type === 'document_upload'.
 * Expects payload: { filename, mime_type, file_base64, title, description, uploaded_by }
 * Behavior:
 *   - Decode base64 to Blob
 *   - Open the pinned UPLOAD_FOLDER_ID Drive folder
 *   - Create file in that folder
 *   - Set sharing to anyone-with-link can view
 *   - Find-or-create the "Documents" sheet tab and append a metadata row
 *   - Return Drive URL + file ID
 */
function handleDocumentUpload(data) {
  // Defensive: data is undefined when handleDocumentUpload is invoked manually
  // from the Apps Script editor (no doPost wrapper). Real upload traffic always
  // arrives with a populated `data` object.
  if (!data || !data.filename || !data.file_base64) {
    return jsonResponse({ status: 'error', message: 'Missing filename or file_base64' });
  }

  // Open the pinned upload folder by ID.
  var folder;
  try {
    folder = DriveApp.getFolderById(UPLOAD_FOLDER_ID);
  } catch (err) {
    Logger.log('handleDocumentUpload: cannot open UPLOAD_FOLDER_ID ' + UPLOAD_FOLDER_ID + ': ' + err.toString());
    return jsonResponse({
      status: 'error',
      message: 'Upload folder not accessible. Folder may have been deleted or moved out of script-owner access. Contact Lorenzo.'
    });
  }

  // Decode + create file
  var decoded;
  try {
    decoded = Utilities.base64Decode(data.file_base64);
  } catch (err) {
    return jsonResponse({ status: 'error', message: 'Could not decode file_base64: ' + err.toString() });
  }

  var blob = Utilities.newBlob(
    decoded,
    data.mime_type || 'application/octet-stream',
    data.filename
  );

  var file = folder.createFile(blob);

  // Share-by-link: anyone with the URL can view
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (err) {
    // Sharing failed — file is created but only owner can see it. Surface but don't fail the upload.
    Logger.log('handleDocumentUpload: setSharing failed for ' + file.getId() + ': ' + err.toString());
  }

  var fileUrl = file.getUrl();
  var fileId = file.getId();
  var sizeBytes = file.getSize();

  // Find or create the Documents sheet tab
  var ss = SpreadsheetApp.openById('1YtHlmvUvaP77cbdhgAm_PPcW_ikfz1g9hQCeG11DAeo');
  var sheet = ss.getSheetByName('Documents');
  if (!sheet) {
    sheet = ss.insertSheet('Documents');
    sheet.appendRow([
      'timestamp', 'uploaded_by', 'title', 'description', 'filename',
      'mime_type', 'size_bytes', 'drive_url', 'drive_id'
    ]);
  }

  sheet.appendRow([
    new Date().toISOString(),
    data.uploaded_by || '',
    data.title || data.filename,
    data.description || '',
    data.filename,
    data.mime_type || '',
    sizeBytes,
    fileUrl,
    fileId
  ]);

  return jsonResponse({
    status: 'success',
    type: 'document_upload',
    drive_url: fileUrl,
    drive_id: fileId,
    size_bytes: sizeBytes
  });
}

/**
 * Inline cell update handler — called via doPost when type === 'cell_update'.
 * Expects payload: { sheet, row, column, value }
 *   - sheet:  sheet tab name (e.g., 'Registrations')
 *   - row:    1-indexed sheet row number (>=2; row 1 is header)
 *   - column: column-key string from REG_COLUMN_MAP / GENERATIONS_COLUMN_MAP
 *   - value:  new value to write (string)
 *
 * For Registrations sheet, editing payment_status (column N) will also
 * trip the installable onPaymentStatusEdit trigger and fire the auto-
 * confirmation email if value is "PAID". That's the desired chain.
 */
var REG_COLUMN_MAP = {
  'timestamp': 1, 'family_name': 2, 'first_name': 3, 'last_name': 4,
  'email': 5, 'phone': 6, 'num_adults': 7, 'num_children': 8,
  'num_under5': 9, 'dietary_notes': 10, 'payment_method': 11,
  'total_due': 12, 'amount_paid': 13, 'payment_status': 14,
  'confirmation_sent': 15, 'notes': 16
};

function handleCellUpdate(data) {
  if (!data.sheet || !data.row || !data.column) {
    return jsonResponse({ status: 'error', message: 'Missing sheet/row/column' });
  }

  var rowNum = parseInt(data.row, 10);
  if (!rowNum || rowNum < 2) {
    return jsonResponse({ status: 'error', message: 'Invalid row (must be >= 2)' });
  }

  var ss = SpreadsheetApp.openById('1YtHlmvUvaP77cbdhgAm_PPcW_ikfz1g9hQCeG11DAeo');
  var sheet = ss.getSheetByName(data.sheet);
  if (!sheet) {
    return jsonResponse({ status: 'error', message: 'Sheet not found: ' + data.sheet });
  }

  // Resolve column name -> column number. For now only Registrations sheet
  // edits are supported (the use case Cassandra needs).
  var colMap;
  if (data.sheet === 'Registrations') {
    colMap = REG_COLUMN_MAP;
  } else {
    return jsonResponse({ status: 'error', message: 'cell_update not supported on sheet: ' + data.sheet });
  }

  var colNum = colMap[data.column];
  if (!colNum) {
    return jsonResponse({ status: 'error', message: 'Unknown column: ' + data.column });
  }

  // Numeric coercion for currency columns -- strip $ and , and parse.
  // Fall back to raw value if not parseable so treasurer notes still land.
  var value = data.value == null ? '' : data.value;
  if (data.column === 'total_due' || data.column === 'amount_paid') {
    var s = String(value).replace(/[$,]/g, '').trim();
    if (s === '') {
      value = '';
    } else {
      var n = parseFloat(s);
      if (!isNaN(n)) value = n;
    }
  }

  sheet.getRange(rowNum, colNum).setValue(value);

  return jsonResponse({
    status: 'success',
    sheet: data.sheet,
    row: rowNum,
    column: data.column,
    value: value
  });
}

/**
 * Status update create handler — called via doPost when type === 'status_update_create'.
 * Expects payload: { subject, message, attached_doc_url?, attached_doc_id?, email_group? }
 *
 * If email_group is truthy, BCCs every unique non-empty email in Registrations tab.
 * Appends a row to the Status Updates tab (auto-creates it on first call). Returns
 * the created update_id (= absolute sheet row number) and count of emails sent.
 */
function handleStatusUpdateCreate(data) {
  if (!data || !data.subject || !data.message) {
    return jsonResponse({ status: 'error', message: 'Missing subject or message' });
  }

  var ss = SpreadsheetApp.openById('1YtHlmvUvaP77cbdhgAm_PPcW_ikfz1g9hQCeG11DAeo');
  var sheet = ss.getSheetByName('Status Updates');
  if (!sheet) {
    sheet = ss.insertSheet('Status Updates');
    sheet.appendRow([
      'timestamp', 'update_id', 'subject', 'message',
      'attached_doc_url', 'attached_doc_id', 'sent_to_count', 'status'
    ]);
  }

  // update_id = the absolute row number this new row will land on.
  // sheet.getLastRow() returns the current bottom; +1 is where appendRow will write.
  var updateId = sheet.getLastRow() + 1;

  var sentCount = 0;
  if (data.email_group) {
    sentCount = broadcastUpdateEmail(ss, data.subject, data.message, data.attached_doc_url || '');
  }

  sheet.appendRow([
    new Date().toISOString(),
    updateId,
    data.subject,
    data.message,
    data.attached_doc_url || '',
    data.attached_doc_id || '',
    sentCount,
    'published'
  ]);

  return jsonResponse({
    status: 'success',
    type: 'status_update_create',
    update_id: updateId,
    sent_to_count: sentCount
  });
}

/**
 * Status update delete handler — soft delete by setting the status column to 'deleted'.
 * The row stays in the sheet for audit trail; the public page and admin list filter it out.
 * Expects payload: { update_id }
 */
function handleStatusUpdateDelete(data) {
  if (!data || !data.update_id) {
    return jsonResponse({ status: 'error', message: 'Missing update_id' });
  }

  var ss = SpreadsheetApp.openById('1YtHlmvUvaP77cbdhgAm_PPcW_ikfz1g9hQCeG11DAeo');
  var sheet = ss.getSheetByName('Status Updates');
  if (!sheet) {
    return jsonResponse({ status: 'error', message: 'Status Updates tab not found' });
  }

  var updateId = parseInt(data.update_id, 10);
  if (!updateId || updateId < 2) {
    return jsonResponse({ status: 'error', message: 'Invalid update_id' });
  }

  // status column is column 8 (H) per the Status Updates schema
  sheet.getRange(updateId, 8).setValue('deleted');

  return jsonResponse({
    status: 'success',
    type: 'status_update_delete',
    update_id: updateId
  });
}

/**
 * Email broadcast helper — BCCs all unique non-empty emails in Registrations tab.
 * Returns the count of unique recipient emails.
 *
 * Apps Script MailApp daily quota is 100 messages for free Google accounts. A single
 * message with N BCC recipients counts as 1 message regardless of N, so this is safe.
 */
function broadcastUpdateEmail(ss, subject, message, attachedDocUrl) {
  var regSheet = ss.getSheetByName('Registrations');
  if (!regSheet) return 0;

  var lastRow = regSheet.getLastRow();
  if (lastRow < 2) return 0;

  // Email column is column E (5) per REG schema. Skip header (row 1).
  var emails = regSheet.getRange(2, 5, lastRow - 1, 1).getValues();
  var unique = {};
  for (var i = 0; i < emails.length; i++) {
    var e = String(emails[i][0] || '').trim();
    if (e && e.indexOf('@') > 0) unique[e.toLowerCase()] = e;
  }
  var bccList = Object.keys(unique).map(function (k) { return unique[k]; });
  if (bccList.length === 0) return 0;

  var body = 'Rowell Family Reunion 2026 — Update\n'
    + '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n'
    + message + '\n\n'
    + (attachedDocUrl ? 'Attached document: ' + attachedDocUrl + '\n\n' : '')
    + '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'
    + 'View all updates at https://rowell-family-reunion.netlify.app/updates.html\n'
    + 'Reunion President: Lorenzo Slay <rowellfamilyreunion2026@gmail.com>\n';

  MailApp.sendEmail({
    to: 'rowellfamilyreunion2026@gmail.com',
    bcc: bccList.join(','),
    subject: 'Rowell Reunion 2026 — ' + subject,
    body: body,
    replyTo: 'rowellfamilyreunion2026@gmail.com'
  });

  return bccList.length;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
