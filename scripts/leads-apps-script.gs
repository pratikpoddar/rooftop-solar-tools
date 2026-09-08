/**
 * Phase 0 lead sink for the rooftop solar tools (spec §6, §8).
 *
 * Deploy:
 *   1. Create a Google Sheet. Extensions → Apps Script, paste this file. Save.
 *   2. Deploy → New deployment → type "Web app".
 *        Execute as:      Me
 *        Who has access:  Anyone        <-- see the warning below
 *   3. Authorize when prompted. Google will show "hasn't verified this app";
 *      Advanced → Go to ... (this is your own script).
 *   4. Copy the Web app URL ending in /exec into SHEETS_WEBHOOK_URL.
 *
 * WATCH OUT — "Who has access" is the one that breaks this.
 *   Anything other than "Anyone" makes the endpoint return a 403 HTML page
 *   ("Access denied. You need access") to every request, because your server
 *   posts anonymously and can never authenticate. "Anyone with a Google
 *   account" fails the same way. It must be literally "Anyone".
 *
 *   To change it without minting a new URL: Deploy → Manage deployments →
 *   pencil/edit on the active deployment → set access → Deploy. Creating a
 *   *New* deployment instead issues a different /exec URL, and you must then
 *   update SHEETS_WEBHOOK_URL or leads will 502.
 *
 * Because "Anyone" means unauthenticated, anyone holding the URL can append
 * rows. The URL is unguessable, which is obscurity rather than security — add
 * a shared token check here and in /api/lead before this carries real volume.
 *
 * The header row is created on first write. Column order is fixed, so new
 * fields must be appended to FIELDS rather than inserted, or historical rows
 * will not line up.
 *
 * Consent note: consentText and consentGiven are stored verbatim with every
 * row. That record is what makes a later introduction defensible, so do not
 * drop those columns to tidy the sheet.
 */

var SHEET_NAME = 'leads';

var FIELDS = [
  'receivedAt',
  'name',
  'phone',
  'phoneVerified',
  'pin',
  'stateSlug',
  'citySlug',
  'kw',
  'monthlyBill',
  'language',
  'tool',
  'sourcePage',
  'consentGiven',
  'consentText',
  'routingStatus',
];

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);

    // Refuse anything without consent, the same rule the API enforces.
    if (payload.consentGiven !== true || !payload.consentText) {
      return json({ ok: false, error: 'consent required' });
    }

    var sheet = getSheet();
    var row = FIELDS.map(function (field) {
      var value = payload[field];
      return value === undefined || value === null ? '' : value;
    });
    sheet.appendRow(row);

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(FIELDS);
    sheet.getRange(1, 1, 1, FIELDS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
