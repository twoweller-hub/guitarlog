// ===================================================
// ギター練習記録アプリ — Google Apps Script
// ===================================================
var SHEET_ID = '12pZVt7aGA5NzBeRZN_wo6cDh4ryW7aTrGZfpOTeDpEk';
var SHEET_NAME = '練習記録';       // 練習記録シート
var SONGS_SHEET_NAME = '曲リスト'; // 曲名管理シート

// ===================================================

/**
 * GETリクエスト — 曲リストを返す（JSONP対応）
 * ?callback=関数名 を付けるとJSONP形式で返す
 */
function doGet(e) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(SONGS_SHEET_NAME);

  var songs = [];
  if (sheet) {
    var lastRow = sheet.getLastRow();
    if (lastRow > 0) {
      var data = sheet.getRange(1, 1, lastRow, 1).getValues();
      songs = data.map(function(row) { return '' + row[0]; }).filter(function(v) { return v !== ''; });
    }
  }

  var result = JSON.stringify({ status: 'ok', songs: songs });
  var callback = e.parameter.callback;
  if (callback) {
    return ContentService.createTextOutput(callback + '(' + result + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(result)
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * POSTリクエスト — actionフィールドで処理を分岐
 *
 * action: "log"       → 練習記録を追記（省略時もこちら）
 * action: "addSong"   → 曲リストに追加
 * action: "deleteSong"→ 曲リストから削除
 */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    if (data.action === 'addSong') {
      return addSong(data.song);
    } else if (data.action === 'deleteSong') {
      return deleteSong(data.song);
    } else if (data.action === 'reorderSongs') {
      return reorderSongs(data.songs);
    } else {
      return logPractice(data);
    }
  } catch (err) {
    return errorResponse(err.message);
  }
}

/**
 * 練習記録をシート1に追記
 */
function logPractice(data) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return errorResponse('シート「' + SHEET_NAME + '」が見つかりません');

  var lastRow = sheet.getLastRow();
  var newRow = lastRow + 1;

  // 同じ曲のF列の最大値を探して+1する
  var maxCount = 0;
  if (newRow > 2) {
    var songCol = sheet.getRange(2, 2, newRow - 2, 1).getValues();
    var countCol = sheet.getRange(2, 6, newRow - 2, 1).getValues();
    for (var i = 0; i < songCol.length; i++) {
      if (songCol[i][0] === data.song) {
        var cnt = parseFloat(countCol[i][0]);
        if (!isNaN(cnt) && cnt > maxCount) maxCount = cnt;
      }
    }
  }

  sheet.getRange(newRow, 1).setValue(data.date);
  sheet.getRange(newRow, 2).setValue(data.song);
  sheet.getRange(newRow, 3).setValue(data.startTime);
  sheet.getRange(newRow, 4).setValue(data.endTime);
  sheet.getRange(newRow, 5).setValue(data.duration);
  sheet.getRange(newRow, 6).setValue(maxCount + 1);

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', row: newRow }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 曲リストシートに曲名を追加
 */
function addSong(songName) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(SONGS_SHEET_NAME);
  if (!sheet) return errorResponse('シート「' + SONGS_SHEET_NAME + '」が見つかりません');

  var lastRow = sheet.getLastRow();
  if (lastRow > 0) {
    var data = sheet.getRange(1, 1, lastRow, 1).getValues();
    var exists = data.some(function(row) { return row[0] === songName; });
    if (exists) return errorResponse('その曲はすでに登録されています');
  }

  sheet.getRange(lastRow + 1, 1).setValue(songName);
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 曲リストシートから曲名を削除
 */
function deleteSong(songName) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(SONGS_SHEET_NAME);
  if (!sheet) return errorResponse('シート「' + SONGS_SHEET_NAME + '」が見つかりません');

  var lastRow = sheet.getLastRow();
  if (lastRow === 0) return errorResponse('曲が登録されていません');

  var data = sheet.getRange(1, 1, lastRow, 1).getValues();
  for (var i = 0; i < data.length; i++) {
    if (('' + data[i][0]) === ('' + songName)) {
      sheet.deleteRow(i + 1);
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'ok' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
  return errorResponse('曲が見つかりません');
}

/**
 * 曲リストを新しい順番で書き直す
 */
function reorderSongs(songs) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(SONGS_SHEET_NAME);
  if (!sheet) return errorResponse('曲リストシートが見つかりません');

  sheet.clearContents();
  if (songs.length > 0) {
    var data = songs.map(function(s) { return [s]; });
    sheet.getRange(1, 1, data.length, 1).setValues(data);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function errorResponse(message) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'error', message: message }))
    .setMimeType(ContentService.MimeType.JSON);
}
