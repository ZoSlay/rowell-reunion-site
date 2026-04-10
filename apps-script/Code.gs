/**
 * Rowell Reunion Form Handler v2 (REUNION-019)
 *
 * Changes from v1:
 * - Registration payload: removed hotel_intent, breakfast_count, museum_count, estimated_total
 * - Registration payload: added total_due
 * - Registrations tab headers updated to match new schema
 *
 * Deploy as: Web App → Execute as me → Anyone has access
 * After pasting, create a NEW deployment (do not edit existing v1).
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
  // Placeholder for REUNION-021 — feedback email integration
  return jsonResponse({ status: 'success', type: 'feedback' });
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
