/**
 * Peninsula Residence — RSVP backend (Google Apps Script web app).
 *
 * Appends/updates RSVP rows in a PRIVATE Google Sheet owned by the host. There
 * is intentionally NO endpoint that returns the guest list — phone numbers stay
 * private to the host's Google account.
 *
 * ── Setup ────────────────────────────────────────────────────────────────────
 *  1. Create a Google Sheet in the host's Drive. Rename a tab to "RSVPs".
 *     (Run `setupSheet()` once from the editor to create the tab + header row.)
 *  2. Extensions → Apps Script. Paste this file in as `Code.gs`.
 *  3. Deploy → New deployment → type "Web app".
 *       Execute as: Me   ·   Who has access: Anyone
 *     Copy the "/exec" URL into the site's VITE_RSVP_ENDPOINT.
 *  4. Redeploy gotcha: after ANY edit here, Manage deployments → edit → deploy
 *     a NEW version (the /exec URL stays the same) or changes won't take effect.
 * ─────────────────────────────────────────────────────────────────────────────
 */

var SHEET_NAME = 'RSVPs';
var HEADERS = [
  'timestamp',
  'name',
  'phone',
  'contribution_type',
  'contribution_detail',
  'party_size',
  'confirmation_code',
  'checked_in',
];

// Column indices (1-based) for clarity.
var COL = {
  timestamp: 1,
  name: 2,
  phone: 3,
  contribution_type: 4,
  contribution_detail: 5,
  party_size: 6,
  confirmation_code: 7,
  checked_in: 8,
};

/** Health check only — deliberately returns NO guest data. */
function doGet() {
  return json({ ok: true, service: 'peninsula-rsvp' });
}

/** Receives an RSVP, dedupes on phone/code, appends or updates one row. */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    // Serialize concurrent RSVPs so two submissions can't double-append.
    lock.waitLock(20000);

    var body = JSON.parse(e.postData.contents);
    var record = {
      timestamp: body.timestamp || new Date().toISOString(),
      name: String(body.name || '').trim(),
      phone: String(body.phone || '').trim(),
      contribution_type: String(body.contribution_type || '').trim(),
      contribution_detail: String(body.contribution_detail || '').trim(),
      party_size: Number(body.party_size) > 0 ? Number(body.party_size) : 1,
      confirmation_code: String(body.confirmation_code || '').trim(),
    };

    var sheet = getSheet_();
    var rowIndex = findRow_(sheet, record);

    if (rowIndex > 0) {
      // Update guest-editable fields; preserve timestamp, code, and check-in.
      sheet.getRange(rowIndex, COL.name).setValue(record.name);
      sheet.getRange(rowIndex, COL.phone).setValue(record.phone);
      sheet.getRange(rowIndex, COL.contribution_type).setValue(record.contribution_type);
      sheet.getRange(rowIndex, COL.contribution_detail).setValue(record.contribution_detail);
      sheet.getRange(rowIndex, COL.party_size).setValue(record.party_size);
      return json({ ok: true, row: rowIndex, updated: true });
    }

    sheet.appendRow([
      record.timestamp,
      record.name,
      record.phone,
      record.contribution_type,
      record.contribution_detail,
      record.party_size,
      record.confirmation_code,
      '', // checked_in — the attendant ticks this by hand on arrival.
    ]);
    return json({ ok: true, row: sheet.getLastRow(), updated: false });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/** Find an existing row by confirmation code, else by normalized phone. */
function findRow_(sheet, record) {
  var last = sheet.getLastRow();
  if (last < 2) return -1; // header only

  var values = sheet
    .getRange(2, 1, last - 1, HEADERS.length)
    .getValues();

  var wantPhone = normalizePhone_(record.phone);
  var wantCode = record.confirmation_code;

  for (var i = 0; i < values.length; i++) {
    var rowCode = String(values[i][COL.confirmation_code - 1] || '').trim();
    var rowPhone = normalizePhone_(String(values[i][COL.phone - 1] || ''));
    if ((wantCode && rowCode === wantCode) || (wantPhone && rowPhone === wantPhone)) {
      return i + 2; // +2: skip header, convert to 1-based row number
    }
  }
  return -1;
}

/** Digits-only canonical phone, mirroring the client's normalization. */
function normalizePhone_(raw) {
  var digits = String(raw || '').replace(/[^\d]/g, '');
  if (digits.indexOf('00') === 0) digits = digits.substring(2);
  return digits;
}

/** Get the RSVPs sheet, creating the tab + header row if needed. */
function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/** Run once from the editor to initialize the sheet. */
function setupSheet() {
  getSheet_();
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
