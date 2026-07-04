/**
 * Career Pakistan — Form-to-Sheet writer (multi-spreadsheet version)
 * ------------------------------------------------------------
 * Your 7 content types live in 7 SEPARATE Google Sheets files. This
 * script looks up each one by its real ID and writes to the exact tab
 * name inside it (tab names below were verified directly against your
 * actual spreadsheets, including the emoji prefixes).
 *
 * This is pre-filled with YOUR real spreadsheet IDs -- no placeholders
 * to fill in. Just paste this in and deploy.
 * ------------------------------------------------------------
 */

var SPREADSHEET_IDS = {
  'Jobs':                 '1FHpbi8Nqu_4jdxvHOf3qGJp2IWvghAJmcesP0aIC_lM',
  'Scholarships':         '1oe7RUOQVRLzQ2yezrFA2_dcZEdCRsLb3mGfmdNBeqdY',
  'Internships':          '1z9BmR427Ry_gXu8iETnIpvnw7hX3QnfiMYPfNq1lHyw',
  'Exams':                '1LwK_lXmWZiN4wcexpIBE1BB7bgMw8tQU8QU7quIVNTU',
  'Books':                '1pvzbGt1cb_YXsUGjLintpLUtD5_pXo-ZSkRoz48tm58',
  'Blogs':                '1L_vnFxWf4_AIEu2GB8nRR-W_Sh8MFxl91PIbsKewXIY',
  'UniversityAdmissions': '1PKIbmqTHrhGt7tFLPRK2BUFOldoi-NNYWDqGXdF2edw',
};

// Exact tab name inside each spreadsheet (verified against your files —
// several include the emoji as part of the actual tab name).
var TAB_NAMES = {
  'Jobs':                 '💼 Jobs',
  'Scholarships':         '🎓 Scholarships',
  'Internships':          '🚀 Internships',
  'Exams':                '📋 Exams',
  'Books':                '📚 Books',
  'Blogs':                'Blogs',
  'UniversityAdmissions': 'Sheet1',
};

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var sheetKey = String(payload.sheet || '').trim();
    var fields = payload.fields || {};

    var spreadsheetId = SPREADSHEET_IDS[sheetKey];
    if (!spreadsheetId) {
      return respond({ ok: false, error: 'Sheet "' + sheetKey + '" is not configured in SPREADSHEET_IDS.' });
    }

    var ss = SpreadsheetApp.openById(spreadsheetId);
    var tabName = TAB_NAMES[sheetKey] || sheetKey;
    var sheet = ss.getSheetByName(tabName);
    if (!sheet) {
      return respond({ ok: false, error: 'No tab named "' + tabName + '" found in the ' + sheetKey + ' spreadsheet.' });
    }

    var lastCol = sheet.getLastColumn();
    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

    // Build the row in the EXACT column order of the sheet, matching
    // each header (e.g. "Title", "Apply Link") to the value sent from
    // the website. Any header with no matching field is left blank.
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

// Visiting the deployed URL directly in a browser hits this -- confirms
// the deployment is live without needing to submit a real form.
function doGet() {
  return respond({ ok: true, message: 'Career Pakistan form-to-sheet endpoint is running.' });
}

function respond(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
