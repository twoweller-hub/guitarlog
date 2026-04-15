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
    if (lastRow > 1) {
      var data = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
      songs = data
        .filter(function(row) { return ('' + row[0]) !== ''; })
        .map(function(row) { return { name: '' + row[0], artist: '' + row[1] }; });
    }
  }

  // 各曲の通算回数（G列の最大値）を取得
  var counts = {};
  songs.forEach(function(s) { counts[s.name] = 0; });
  var practiceSheet = ss.getSheetByName(SHEET_NAME);
  if (practiceSheet) {
    var lastRow2 = practiceSheet.getLastRow();
    if (lastRow2 > 1) {
      var songCol = practiceSheet.getRange(2, 2, lastRow2 - 1, 1).getValues();
      var countCol = practiceSheet.getRange(2, 8, lastRow2 - 1, 1).getValues();
      for (var i = 0; i < songCol.length; i++) {
        var songName = '' + songCol[i][0];
        var cnt = parseFloat(countCol[i][0]);
        if (!isNaN(cnt) && counts[songName] !== undefined && cnt > counts[songName]) {
          counts[songName] = cnt;
        }
      }
    }
  }

  var result = JSON.stringify({ status: 'ok', songs: songs, counts: counts });
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
      return addSong(data.song, data.artist);
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
 * 練習記録をシートに追記
 * A=日付 B=曲名 C=アーティスト D=開始時間 E=終了時間 F=練習時間(秒) G=練習時間(◯分◯秒) H=通算回数
 */
function logPractice(data) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return errorResponse('シート「' + SHEET_NAME + '」が見つかりません');

  var lastRow = sheet.getLastRow();
  var newRow = lastRow + 1;

  // 同じ曲のH列の最大値を探して+1する
  var maxCount = 0;
  if (newRow > 2) {
    var songCol = sheet.getRange(2, 2, newRow - 2, 1).getValues();
    var countCol = sheet.getRange(2, 8, newRow - 2, 1).getValues();
    for (var i = 0; i < songCol.length; i++) {
      if (songCol[i][0] === data.song) {
        var cnt = parseFloat(countCol[i][0]);
        if (!isNaN(cnt) && cnt > maxCount) maxCount = cnt;
      }
    }
  }

  var m = Math.floor(data.duration / 60);
  var s = data.duration % 60;

  sheet.getRange(newRow, 1).setValue(data.date);
  sheet.getRange(newRow, 2).setValue(data.song);
  sheet.getRange(newRow, 3).setValue(data.artist);
  sheet.getRange(newRow, 4).setValue(data.startTime);
  sheet.getRange(newRow, 5).setValue(data.endTime);
  sheet.getRange(newRow, 6).setValue(data.duration);
  sheet.getRange(newRow, 7).setValue(m + '分' + s + '秒');
  sheet.getRange(newRow, 8).setValue(maxCount + 1);

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', row: newRow }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 曲リストシートに曲名とアーティスト名を追加
 */
function addSong(songName, artistName) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(SONGS_SHEET_NAME);
  if (!sheet) return errorResponse('シート「' + SONGS_SHEET_NAME + '」が見つかりません');

  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    var data = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    var exists = data.some(function(row) { return row[0] === songName; });
    if (exists) return errorResponse('その曲はすでに登録されています');
  }

  var newRow = lastRow + 1;
  sheet.getRange(newRow, 1).setValue(songName);
  sheet.getRange(newRow, 2).setValue(artistName);
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
  if (lastRow <= 1) return errorResponse('曲が登録されていません');

  var data = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < data.length; i++) {
    if (('' + data[i][0]) === ('' + songName)) {
      sheet.deleteRow(i + 2);
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

  // ヘッダー行を残してデータ行だけ削除
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }

  if (songs.length > 0) {
    var data = songs.map(function(s) { return [s.name, s.artist]; });
    sheet.getRange(2, 1, data.length, 2).setValues(data);
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
