/**
 * Career Pakistan — Form-to-Sheet writer
 * ------------------------------------------------------------
 * WHERE THIS GOES: paste into the Google Sheet that holds your Jobs /
 * Scholarships / Internships / Exams / Books / Blogs / University
 * Admissions tabs → Extensions → Apps Script. Full click-by-click
 * steps are in apps-script/SETUP-GUIDE.md.
 *
 * WHAT IT DOES: your site's /api/submit.js sends JSON like:
 *   { "sheet": "Jobs", "fields": { "Title": "...", "Apply Link": "...", ... } }
 * This script finds the tab named "Jobs" in this spreadsheet, reads
 * its header row (row 1), lines up each field to the matching column
 * by NAME (not position), and appends it as a brand-new row.
 * ------------------------------------------------------------
 */

// Only these tabs are allowed to receive public submissions.
var ALLOWED_SHEETS = [
  'Jobs', 'Scholarships', 'Internships', 'Exams', 'Books', 'Blogs', 'UniversityAdmissions'
];

// If your University Admissions tab is literally named differently
// (e.g. "University Admissions" with a space), map it here:
var SHEET_NAME_OVERRIDES = {
  'UniversityAdmissions': 'University Admissions',
};

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var sheetKey = String(payload.sheet || '').trim();
    var fields = payload.fields || {};

    if (ALLOWED_SHEETS.indexOf(sheetKey) === -1) {
      return respond({ ok: false, error: 'Sheet "' + sheetKey + '" is not allowed to receive submissions.' });
    }

    var actualName = SHEET_NAME_OVERRIDES[sheetKey] || sheetKey;
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(actualName);
    if (!sheet) {
      return respond({ ok: false, error: 'No tab named "' + actualName + '" found in this spreadsheet.' });
    }

    var lastCol = sheet.getLastColumn();
    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

    // Build the row in the EXACT column order of the sheet, matching
    // each header (e.g. "Title", "Apply Link") to the value sent from
    // the website. Any header with no matching field is left blank —
    // this is what keeps your ID / Is Featured columns untouched if
    // you manage those separately.
    var row = headers.map(function (h) {
      var key = String(h || '').trim();
      if (!key) return '';
      return fields.hasOwnProperty(key) ? fields[key] : '';
    });

    sheet.appendRow(row);

    return respond({ ok: true, sheet: sheetKey, row: sheet.getLastRow() });
  } catch (err) {
    return respond({ ok: false, error: err.message });
  }
}

// Visiting the deployed URL directly in a browser hits this — lets you
// confirm the deployment is live without needing to submit a real form.
function doGet() {
  return respond({ ok: true, message: 'Career Pakistan form-to-sheet endpoint is running.' });
}

function respond(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
