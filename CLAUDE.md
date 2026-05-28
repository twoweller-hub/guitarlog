# guitarlog — Claude向けプロジェクトコンテキスト

## 開発ログ

**セッション開始時に必ず `docs/dev-log.md` を読む。** 開発経緯・設計判断・バグ修正の背景を把握するため。

## コミットルール

コードを修正・追加したら必ずコミットする。Push はユーザーが行うため Claude は行わない。コミットメッセージは日本語で書く。

**コミットには必ず `docs/dev-log.md` への追記を含める。** コードと同じコミットに入れること。

## ユーザーへの説明スタイル

- ユーザーはプログラマーではないため、説明は素人にもわかりやすい言葉で行う
- 実装手順を示す際は、Claude が行うコード変更だけでなく、ユーザーが行う作業（スプレッドシートの編集・GASの再デプロイ・動作確認など）も手順として明記する
- 専門用語は避け、必要な場合は補足説明を加える

## プロジェクト概要

ギター練習記録 PWA。フロントエンドは `index.html` 1ファイル完結（HTML + CSS + JS）、バックエンドは Google Apps Script（GAS）+ Google Sheets。GitHub Pages でホスティング。

## 重要な設定値

| 項目 | 値 |
|------|-----|
| GAS URL | `index.html` 内の `GAS_URL` 定数（`https://script.google.com/macros/s/AKfycbwfp13uUByupUPLGOWm75hXHT-EcCrZ362936imi06wHXvk8xHE0s4BPBGWK_Gprj49/exec`） |
| スプレッドシートID | `12pZVt7aGA5NzBeRZN_wo6cDh4ryW7aTrGZfpOTeDpEk` |
| 公開URL | `https://twoweller-hub.github.io/guitarlog/` |

## ファイル構成

```
guitarlog/
├── index.html              # アプリ本体（HTML + CSS + JS、1ファイル完結）
├── sw.js                   # Service Worker（network-first for index.html）
├── manifest.webmanifest    # PWA マニフェスト
├── icon-192.png / icon-512.png
├── make_icons.swift        # アイコン生成スクリプト
├── gas/
│   └── code.gs             # GAS バックエンド（全APIはここ）
└── docs/
    ├── dev-log.md          # 開発ログ（セッション開始時に読む）
    └── （DOCUMENT.md・PWA_SETUP.md は人間向け仕様書）
```

## Google Sheets シート構成

### 練習記録シート（SHEET_NAME = '練習記録'）

| 列 | 内容 | 例 |
|----|------|----|
| A  | 日付 | `2026-04-10` |
| B  | 曲名 | `Linoleum` |
| C  | アーティスト名 | `NOFX` |
| D  | 開始時間 | `14:32` |
| E  | 終了時間 | `14:47` |
| F  | 練習時間（秒） | `74` |
| G  | 練習時間（◯分◯秒） | `1分14秒` |
| H  | 通算回数 | `12` |
| I  | メモ（任意） | `サビの入りを重点的に練習` |

### 曲リストシート（SONGS_SHEET_NAME = '曲リスト'）

| 列 | 内容 |
|----|------|
| A  | 曲名（1行目はヘッダー「曲名」） |
| B  | アーティスト名（1行目はヘッダー「アーティスト名」） |

## 通算回数の仕様

- GAS が同じ曲名の H 列の最大値を検索し、+1 して記録する（MAX+1 方式）
- COUNTIF 数式は使っていない
- 過去データをインポートしても正しく引き続き累計できる

## 使用環境

- Galaxy スマートフォン（PWAとしてホーム画面にインストール済み）
- Mac からもブラウザで利用可能

## GAS コーディング上の注意

- `getValues()` で取得した日付セルの値は GAS V8 ランタイムで `instanceof Date` が `false` になる
- 日付型の判定は `typeof val.getTime === 'function'` を使うこと（duck typing）

## API パターン

### GET（JSONP）

```javascript
// 曲リスト・通算回数・最終練習日を一括取得
gasGet({ callback: '関数名' })
// → { status: 'ok', songs: [{name, artist}], counts: {曲名: N}, lastDates: {曲名: 'yyyy-MM-dd'} }
```

### POST（fetch、no-cors ではなく通常の fetch）

```javascript
fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ action: 'log',         date, song, artist, startTime, endTime, duration, memo }) })
fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ action: 'addSong',     song, artist }) })
fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ action: 'deleteSong',  song }) })
fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ action: 'reorderSongs',songs: [{name, artist}, ...] }) })
```

## フロントエンド状態変数

```javascript
const GAS_URL = '...';      // GAS エンドポイント
let startTime = null;       // 練習開始時刻（Date オブジェクト）
let timerInterval = null;   // setInterval ID
let pendingDeleteSong = null; // 削除確認モーダル用（確認前に保存）
let songCounts = {};        // {曲名: 通算回数}
let songLastDates = {};     // {曲名: 'yyyy-MM-dd'}
let selectedSong = null;    // {name, artist} | null
let sessionSongs = 0;       // 今回セッションで保存した曲数
let sessionSeconds = 0;     // 今回セッションの合計練習時間（秒）
let pendingSaveEndTime = null; // 保存確認モーダル表示中の終了時刻
```

## 操作フロー

1. 曲名をカスタムドロップダウンで選択（`selectedSong` にセット）
2. 「開始」ボタン → `startTime = new Date()`、タイマー開始
3. 練習する
4. 「終了・保存」ボタン → `pendingSaveEndTime` に終了時刻を保存、確認モーダル表示（タイマーは止めない）
5. 「保存する」→ `confirmSave()` でGASに送信、タイマー停止、`sessionSongs/sessionSeconds` 加算
6. 「練習に戻る」→ `pendingSaveEndTime = null` にして継続（タイマーはそのまま）
7. 「練習をキャンセル」→ タイマー停止、`startTime = null`

## Service Worker

- キャッシュ名: `guitarlog-v11`（バージョンを変えるとキャッシュが強制クリアされる）
- `index.html` → **ネットワーク優先**（取得失敗時のみキャッシュから返す）
- 画像・マニフェスト → **キャッシュ優先**
- GAS（`script.google.com`）→ **キャッシュしない**（CDN URLもキャッシュリストに含めない）

## キャッシュバスター

`index.html` は1ファイル完結のため、クエリ文字列は使わない。

**`index.html` または `sw.js` 以外のファイルを変更したコミットには必ず `sw.js` の `CACHE` 名を +1 することで端末のキャッシュを強制更新する。**

- `index.html` を変更した場合 → `sw.js` の `CACHE` 名を +1（例: `guitarlog-v11` → `guitarlog-v12`）
- `manifest.webmanifest` を変更した場合 → `sw.js` の `CACHE` 名を +1

## UI デザイン

- テーマカラー: `#ee8727`（オレンジ）
- 背景: `#f2f4f7`（ライトグレー）
- フォント: システムフォント（`-apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif`）
- ライブラリ: SortableJS 1.15.0（CDN）

## カスタムドロップダウン

`<select>` を廃止し、HTML/CSS/JS でカスタムドロップダウンを実装している。Android の `<select>` は CSS でスタイルできないため（OS ネイティブUI）。主要関数: `toggleSongSelect()` / `selectSongOption(song)` / `closeSongSelect()`

## 注意点・過去のバグ

- **GAS V8 instanceof Date バグ**: `getValues()` の日付は `instanceof Date` で false になる。`typeof val.getTime === 'function'` で判定すること（修正済み）
- **pendingDeleteSong の扱い**: モーダルクローズ前に変数を別名で保存してから closeModal() を呼ぶこと。閉じると null になる
- **Service Worker インストール失敗**: CDN URL（SortableJS 等）を SW のキャッシュリストに含めないこと
- **SW キャッシュ更新**: index.html 変更時は `sw.js` の `CACHE` バージョンを必ず上げること
- **G列にARRAYFORMULAを入れない**: `getLastRow()` が狂い保存先の行がずれる
