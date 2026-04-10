// ===================================================
// ギター練習記録アプリ — Google Apps Script
// ===================================================
// 【設定】デプロイ前にここを書き換える
// GoogleスプレッドシートのURLに含まれるID
// 例: https://docs.google.com/spreadsheets/d/【ここがID】/edit
var SHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';

// シート名（デフォルトは「シート1」）
var SHEET_NAME = 'シート1';

// ===================================================

/**
 * GETリクエスト — デプロイURLの動作確認用
 * ブラウザでデプロイURLを開いたとき {"status":"ok"} が返れば正常
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'Guitar Log GAS is running.' }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * POSTリクエスト — HTMLアプリからデータを受け取りスプレッドシートに追記
 *
 * 受け取るJSON:
 *   {
 *     date:      "2026-04-10"   // 日付 (YYYY-MM-DD)
 *     song:      "Linoleum / NOFX"
 *     startTime: "14:32"        // 開始時間 (HH:MM)
 *     endTime:   "14:47"        // 終了時間 (HH:MM)
 *     duration:  15             // 練習時間（分・整数）
 *   }
 *
 * 書き込む列:
 *   A: 日付
 *   B: 曲名
 *   C: 開始時間
 *   D: 終了時間
 *   E: 練習時間（分）
 *   F: 通算回数（COUNTIF数式で自動計算）
 */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      return errorResponse('シート「' + SHEET_NAME + '」が見つかりません');
    }

    var lastRow = sheet.getLastRow();
    var newRow = lastRow + 1;

    // A〜E列にデータを書き込む
    sheet.getRange(newRow, 1).setValue(data.date);
    sheet.getRange(newRow, 2).setValue(data.song);
    sheet.getRange(newRow, 3).setValue(data.startTime);
    sheet.getRange(newRow, 4).setValue(data.endTime);
    sheet.getRange(newRow, 5).setValue(data.duration);

    // F列: COUNTIF数式（同じ曲名が何行目まであるかカウント → 通算回数）
    // 2行目から現在行までのB列を対象にする（1行目はヘッダー）
    var countifFormula = '=COUNTIF(B$2:B' + newRow + ',B' + newRow + ')';
    sheet.getRange(newRow, 6).setFormula(countifFormula);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', row: newRow }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return errorResponse(err.message);
  }
}

function errorResponse(message) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'error', message: message }))
    .setMimeType(ContentService.MimeType.JSON);
}
