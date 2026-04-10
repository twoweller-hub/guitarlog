# ギター練習記録アプリ — 開発ドキュメント

一からこのアプリを再現するための手順書。開発中につまずいた点と解決策も記録している。

---

## アプリ概要

ギター練習の開始・終了時間と曲名を記録し、Google スプレッドシートに自動保存する PWA アプリ。

- **公開URL**: `https://twoweller-hub.github.io/guitarlog/`
- **ホスティング**: GitHub Pages
- **データ保存先**: Google スプレッドシート（GAS 経由）
- **対応端末**: Android (Galaxy S25) ＋ Mac

---

## ファイル構成

```
guitarlog/
├── index.html              # アプリ本体（HTML + CSS + JS、1ファイル完結）
├── manifest.webmanifest    # PWA マニフェスト
├── sw.js                   # Service Worker（オフラインキャッシュ）
├── icon-192.png            # PWA アイコン（192x192）
├── icon-512.png            # PWA アイコン（512x512）
├── make_icons.swift        # アイコン生成スクリプト（Swift）
├── gas/
│   └── code.gs             # Google Apps Script バックエンド
├── CLAUDE.md               # Claude Code 向けプロジェクト説明
└── DOCUMENT.md             # このファイル
```

---

## Google スプレッドシート設定

### スプレッドシート構成

スプレッドシート ID: `12pZVt7aGA5NzBeRZN_wo6cDh4ryW7aTrGZfpOTeDpEk`

スプレッドシートには2つのシートが必要：

| シート名 | 用途 |
|---------|------|
| 練習記録 | 練習ログ（1行 = 1セッション） |
| 曲リスト | 曲名の一覧（アプリのプルダウン・曲管理タブに表示） |

**シート名は完全一致が必要。** GAS の定数 `SHEET_NAME`・`SONGS_SHEET_NAME` と一致させること。

### 練習記録シートの列構成

| 列 | 内容 | 例 |
|----|------|----|
| A  | 日付 | `2026-04-10` |
| B  | 曲名 | `Linoleum / NOFX` |
| C  | 開始時間 | `14:32` |
| D  | 終了時間 | `14:47` |
| E  | 練習時間（分） | `15` |
| F  | 通算回数 | `12` |

### 過去データのインポート

Excel などの過去データをインポートする場合：
- B 列の曲名をアプリの曲名と**完全一致**させること
- F 列（通算回数）は空でも構わない。GAS が MAX+1 で自動計算する

---

## GAS（Google Apps Script）設定

### `gas/code.gs` の主な関数

| 関数 | 役割 |
|------|------|
| `doGet` | 曲リストを JSON で返す（JSONP 対応） |
| `doPost` | `action` フィールドで処理を分岐 |
| `logPractice` | 練習記録をシートに追記（通算回数は MAX+1 方式） |
| `addSong` | 曲リストシートに曲を追加 |
| `deleteSong` | 曲リストシートから曲を削除 |
| `reorderSongs` | 曲リストの並び順を書き直す |

### GAS デプロイ手順（初回）

1. [script.google.com](https://script.google.com) を開く
2. 「新しいプロジェクト」を作成
3. `code.gs` の内容をすべて貼り付ける
4. `SHEET_ID` を自分のスプレッドシート ID に変更して保存
5. 「デプロイ」→「新しいデプロイ」
6. 種類: **ウェブアプリ**
7. 実行ユーザー: **自分**
8. アクセス権: **全員**
9. 「デプロイ」を押す → ウェブアプリの URL をコピー
10. `index.html` 内の `GAS_URL` 定数にその URL を貼り付ける

### GAS 再デプロイ手順（コードを変更した場合）

1. 「デプロイ」→「デプロイを管理」
2. 既存のデプロイの鉛筆アイコン（編集）をクリック
3. バージョン: **「新しいバージョン」** を選択（ここを変えないと変更が反映されない）
4. 「デプロイ」→ URL は変わらないので `index.html` の書き換え不要

---

## PWA インストール手順（Android / Galaxy）

### Chrome でのインストール方法

1. Chrome でアプリの URL を開く
2. 右上のメニュー（⋮）→「**ホーム画面に追加**」をタップ
3. 次の画面で必ず **「インストール」** を選ぶ

> **重要**: 「ショートカット作成」と「インストール」の2択が出る。  
> **「ショートカット作成」ではなく「インストール」を選ぶこと。**  
> ショートカット作成だとブラウザのタブとして開くだけで、スタンドアロンアプリにならない。

4. ホーム画面にアイコンが追加され、ブラウザのアドレスバーなしで起動できる

### iOS (Safari) でのインストール方法

1. Safari でアプリの URL を開く
2. 下部の共有アイコン → 「ホーム画面に追加」
3. 名前を確認して「追加」

---

## アプリ更新手順

### コードを変更して GitHub に push する場合

1. `index.html` や `sw.js` などを変更
2. `sw.js` の `CACHE` バージョンを +1 する（後述）
3. GitHub に push → GitHub Pages に自動反映

### Service Worker のキャッシュを更新する

コードを変更してもスマートフォンが古いキャッシュを使い続けることがある。
`sw.js` の先頭の `CACHE` の数字を上げることで新しいキャッシュが適用される：

```js
// 変更前
const CACHE = 'guitarlog-v6';

// 変更後（数字を +1 する）
const CACHE = 'guitarlog-v7';
```

---

## アイコン再生成

`make_icons.swift` を使って icon-192.png / icon-512.png を生成：

```bash
swift make_icons.swift
```

デザイン: 🎸 絵文字 + オレンジ背景（`#ee8727`）、角丸四角形

---

## セキュリティ注意事項

### GitHub トークンや API キーの管理

- **トークン・パスワード・API キーは絶対にファイルに書いて commit しない**
- 誤って commit・push してしまった場合は、すぐにトークンを無効化（revoke）すること
  - GitHub: Settings → Developer settings → Personal access tokens → Delete
- GAS_URL（デプロイ URL）は公開情報なので commit して問題ない
- スプレッドシート ID も GAS がアクセス制御しているため commit して問題ない

---

## 開発中につまずいた点と解決策

### 1. シート名の不一致

**問題**: GAS の `SHEET_NAME` が `'シート1'` のままで、実際のシート名 `'練習記録'` と不一致。データが書き込まれなかった。

**解決策**: GAS の定数を実際のシート名に合わせて変更し、再デプロイ。

```js
var SHEET_NAME = '練習記録';
var SONGS_SHEET_NAME = '曲リスト';
```

---

### 2. GAS への GET リクエストで CORS エラー

**問題**: `fetch()` で GAS の URL に GET リクエストを送ると、リダイレクトが発生して CORS エラーになる。

**解決策**: JSONP を使う。`<script>` タグで GAS URL を読み込み、`?callback=関数名` を付けてコールバック関数で受け取る。

```js
// NG: fetchを使うとCORSエラー
// fetch(GAS_URL).then(...)

// OK: JSONPで取得
const callbackName = 'gasCallback_' + Date.now();
window[callbackName] = function(data) { /* 受け取り処理 */ };
const script = document.createElement('script');
script.src = GAS_URL + '?callback=' + callbackName;
document.head.appendChild(script);
```

POST リクエストは `mode: 'no-cors'` で問題なく動く。

---

### 3. 削除確認モーダルのバグ

**問題**: カスタムモーダルで削除確認後、`closeModal()` が `pendingDeleteSong` を null にしてから fetch で参照しようとしてエラー。

**解決策**: モーダルを閉じる前に変数を別名で保存する。

```js
async function confirmModal() {
  if (!pendingDeleteSong) return;
  const song = pendingDeleteSong; // 先に保存
  closeModal();                   // ここで pendingDeleteSong が null になる

  // song を使う（pendingDeleteSong ではなく）
  fetch(GAS_URL, { body: JSON.stringify({ action: 'deleteSong', song: song }) });
}
```

---

### 4. 日本語 IME での二重送信

**問題**: 日本語入力中に変換確定の Enter キーで曲が追加されてしまう。

**解決策**: `e.isComposing` が `true`（IME 変換中）の場合は処理をスキップする。

```js
input.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && !e.isComposing) addSong();
});
```

---

### 5. 数字の曲名で TypeError

**問題**: スプレッドシートに `"1"` や `"2"` などの数字だけの曲名を入れると、Google Sheets が数値として保存する。GAS の `doGet` がそのまま返すと JavaScript 側で `song.replace()` が TypeError になる（数値に replace メソッドはない）。

**解決策**:
- GAS の `doGet` で文字列に変換して返す: `return '' + row[0]`
- HTML 側でも文字列に変換: `const s = String(song)`
- GAS の `deleteSong` でも型を合わせて比較: `('' + data[i][0]) === ('' + songName)`

---

### 6. 通算回数が COUNTIF では正しく計算されない

**問題**: F 列に `=COUNTIF(B$2:B{row}, B{row})` 数式を GAS で書き込む設計だったが、COUNTIF は「その時点での行数」をカウントするだけで、過去のデータがある場合に正しく累積されない。

**解決策**: GAS がスプレッドシートの同じ曲名の F 列の最大値を探し、+1 して記録する（MAX+1 方式）。

```js
var maxCount = 0;
for (var i = 0; i < songCol.length; i++) {
  if (songCol[i][0] === data.song) {
    var cnt = parseFloat(countCol[i][0]);
    if (!isNaN(cnt) && cnt > maxCount) maxCount = cnt;
  }
}
sheet.getRange(newRow, 6).setValue(maxCount + 1);
```

---

### 7. 曲追加・削除後の再読み込みが不安定

**問題**: 曲を追加・削除した後に `loadSongs()` を再度呼び出して曲リストを更新しようとしたが、2回目以降の GAS GET（JSONP）がタイムアウトや失敗になることがあった。

**解決策**: オプティミスティック UI に切り替え。GAS へのリクエスト結果を待たずに DOM を即座に更新し、GAS へのリクエストはバックグラウンドで実行する。ページ読み込み時の初回のみ JSONP で取得する。

---

### 8. Service Worker のインストール失敗

**問題**: `sw.js` のキャッシュリストに CDN の URL（SortableJS）を含めていたため、SW のインストールが失敗することがあった。

**解決策**: CDN URL をキャッシュリストから除外する。CDN はネットワーク接続時のみ読み込まれる。

```js
// sw.js — CDN URLは含めない
const URLS = [
  '/guitarlog/',
  '/guitarlog/index.html',
  '/guitarlog/manifest.webmanifest',
  '/guitarlog/icon-192.png',
  '/guitarlog/icon-512.png'
];
```

---

### 9. PWA インストールで「ショートカット作成」と「インストール」の違い

**問題**: Chrome の「ホーム画面に追加」を押した後に2択が出ることに気づかず、「ショートカット作成」を選んでしまうとブラウザのタブとして開くだけでスタンドアロン PWA にならない。

**解決策**: 必ず「インストール」を選ぶ。これを選んだ場合のみアドレスバーなしのスタンドアロンアプリになる。
