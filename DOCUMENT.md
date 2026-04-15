# ギター練習記録アプリ — 開発ドキュメント

一からこのアプリを再現するための手順書。開発中につまずいた点と解決策も記録している。最終更新: 2026-04-11（土）

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
| B  | 曲名 | `Linoleum` |
| C  | アーティスト名 | `NOFX` |
| D  | 開始時間 | `14:32` |
| E  | 終了時間 | `14:47` |
| F  | 練習時間（秒） | `74` |
| G  | 練習時間（◯分◯秒） | `1分14秒` |
| H  | 通算回数 | `12` |

### 曲リストシートの列構成

| 列 | 内容 |
|----|------|
| A  | 曲名（1行目はヘッダー「曲名」） |
| B  | アーティスト名（1行目はヘッダー「アーティスト名」） |

**ヘッダー行が必要。** GAS は2行目以降をデータとして読む。

### G列・H列について

- G列: GASが `◯分◯秒` の文字列を自動で書き込む（例: `1分14秒`）
- H列: 通算回数。GASがMAX+1方式で書き込む

**注意**: G列にARRAYFORMULAを使うと `getLastRow()` が狂い、保存先の行がずれる問題が発生する。G列はGASが書き込むので数式は入れないこと。

### 過去データのインポート

Excel などの過去データをインポートする場合：
- B 列を曲名、C 列をアーティスト名に分けること
- F 列は秒（整数）で入れること
- G 列（通算回数）は空でも構わない。GAS が MAX+1 で自動計算する

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
3. VS Code のソースコントロールでステージ → コミット → 「変更の同期」ボタンで push → GitHub Pages に自動反映

### Service Worker のキャッシュを更新する

コードを変更してもスマートフォンが古いキャッシュを使い続けることがある。
`sw.js` の先頭の `CACHE` の数字を上げることで新しいキャッシュが適用される：

```js
// 変更前
const CACHE = 'guitarlog-v10';

// 変更後（数字を +1 する）
const CACHE = 'guitarlog-v11';
```

### Service Worker の fetch 戦略について（他のアプリを作るときのヒント）

このアプリでは SW の fetch 戦略をファイルの種類によって分けている：

```js
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // index.html はネットワーク優先
  if (url.pathname === '/guitarlog/' || url.pathname === '/guitarlog/index.html') {
    e.respondWith(
      fetch(e.request)
        .then(response => {
          // 取得できたら最新版をキャッシュに保存しておく
          const clone = response.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return response;
        })
        .catch(() => caches.match(e.request)) // オフライン時のみキャッシュを使う
    );
    return;
  }

  // 画像・マニフェストはキャッシュ優先
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
```

**なぜこの設計にするか：**

すべてをキャッシュ優先にすると、アプリを更新して GitHub に push しても、端末が古い `index.html` を使い続けるという問題が発生する。特に SW の新バージョンがインストールされるタイミングと GitHub Pages の CDN 更新タイミングがずれると、新しい SW が古いファイルをキャッシュしてしまう。

`index.html` だけをネットワーク優先にすることで、常に最新のアプリが実行される。アイコンやマニフェストは変更頻度が低いのでキャッシュ優先のままで問題ない。

---

## アイコン再生成

`make_icons.swift` を使って icon-192.png / icon-512.png を生成：

```bash
swift make_icons.swift
```

デザイン: 🎸 絵文字 + オレンジ背景（`#ee8727`）、角丸四角形

---

## Git / GitHub の操作（VS Code から行う）

### 基本的な流れ

ターミナルは不要。VS Code のソースコントロール（左サイドバーのブランチアイコン）から全操作できる。

1. ファイルを変更する
2. 変更ファイルを **ステージ**（`+` ボタン）
3. コミットメッセージを入力して **コミット**
4. **「変更の同期」** ボタンで GitHub に push される

### 新しいプロジェクトを初めて GitHub に push する場合

1. ローカルでフォルダを作成・コーディング
2. VS Code でステージ → コミット
3. **「Branchの発行」** ボタンをクリック
4. Public / Private を選択 → GitHub にリポジトリが自動作成されて push 完了

> GitHub のブラウザでリポジトリを事前に作る必要はない。VS Code だけで完結する。

「Branchの発行」は初回のみ表示される。以降は「変更の同期」ボタンになる。

### GitHub Pages で公開する場合は Public リポジトリが必要

自分だけで使うアプリ（公開不要）なら Private でよい。
このギターログアプリは PWA として `https://twoweller-hub.github.io/guitarlog/` で公開しているため Public にしている。

### 既存リポジトリと VS Code を紐付ける（例外ケース）

ターミナルで push し続けていてリモートが未設定の場合など、稀に必要になる：

```bash
git remote add origin https://github.com/ユーザー名/リポジトリ名.git
```

これを1回実行すれば以降は VS Code の UI で push できる。
通常は「Branchの発行」を使えばこの手順は不要。

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

---

### 10. Service Worker が古い index.html をキャッシュし続ける

**問題**: `sw.js` のバージョンを上げて push しても、通常リロードで古いアプリが表示され続ける。ハード読み込みでは最新版が表示されるのに通常リロードでは表示されない、という現象が Mac・Galaxy 両方で発生した。

**原因**: SW を新バージョンに更新した際、GitHub Pages の CDN がまだ古いファイルを配信していた。新しい SW が「最新のつもりで」古い `index.html` をキャッシュしてしまい、以後その古いキャッシュを使い続けた。

**解決策**: `index.html` の fetch 戦略をキャッシュ優先からネットワーク優先に変更した（詳細は「Service Worker の fetch 戦略」セクション参照）。これにより今後は同じ問題が起きない。

緊急回避策（一時的な対処）: Chrome DevTools → Application → Service Workers → 「登録解除」→ ハード読み込み。

---

### 11. Android の `<select>` ドロップダウンは CSS でスタイルできない

**問題**: 通算回数を曲名の横に表示するようにしたところ、Android Chrome の `<select>` ドロップダウンで「曲名（XXX回）」のテキストが折り返して2行になってしまった。

**原因**: Android の `<select>` が開いたときのリスト UI は OS ネイティブのコンポーネントで描画されるため、CSS で文字サイズや行の高さを制御できない。

**解決策**: `<select>` を廃止し、HTML/CSS/JS でカスタムドロップダウンを実装した。これにより曲名と回数を横並び1行で表示できるようになった。

```js
// カスタムドロップダウンの主な構造
// HTML: .custom-select > .custom-select-trigger + .custom-select-dropdown
// JS: toggleSongSelect() / selectSongOption(song) / closeSongSelect()
// 外側タップで閉じる: document.addEventListener('click', ...)
```

---

### 12. 同一スコープ内での変数名重複による SyntaxError

**問題**: カスタムドロップダウン実装時に `addSong()` 関数内で `const item` を2回宣言してしまい、SyntaxError が発生。JS 全体が動かなくなり、タブ切り替えもボタンも一切機能しなくなった。

**解決策**: 2つ目の宣言を `const songItem` に改名した。`const` は同一スコープ内で同じ名前を再宣言できないため、エラーになる。

**教訓**: JS が全く動かなくなったときは SyntaxError を疑う。ブラウザの DevTools → コンソールでエラーメッセージを確認すると原因がすぐわかる。

---

### 13. GAS の返り値の型変更後に古い HTML が残っていた

**問題**: GAS の `doGet` を改修して曲リストを文字列配列 `["曲名"]` からオブジェクト配列 `[{name, artist}]` に変更したが、HTML の push 前に GAS だけ再デプロイしたため、古い HTML がオブジェクトを文字列として表示しようとして `[object Object]` が表示された。

**解決策**: GAS と HTML は必ずセットで更新・デプロイする。GAS の返り値の型を変えた場合は HTML の push を先に（または同時に）行うこと。

---

### 14. 曲削除時に `<select>` 要素への参照が残っていた

**問題**: `<select>` をカスタムドロップダウンに置き換えた後も、`confirmModal()` 内に `document.getElementById('song-select').options` を操作するコードが残っていた。`song-select` という id の要素がなくなったため `null` になり、削除操作が一切できなくなった。

**解決策**: `select.options` の操作をカスタムドロップダウンの `.custom-option` 要素の操作に書き換えた。UI コンポーネントを変更した際は、そのコンポーネントを参照しているすべての箇所を確認すること。

---

### 16. 保存確認モーダルで「練習に戻る」を押したときタイマーが止まる問題への対策

**設計上の注意**: 「終了・保存」を押した時点でタイマー（`setInterval`）を止めてしまうと、「練習に戻る」を押したあとにタイマーが動かなくなる。

**解決策**: `endPractice()` ではタイマーを止めず、モーダル表示のみ行う。`clearInterval` は `confirmSave()` 内で実際に保存するときだけ呼ぶ。終了時刻は `pendingSaveEndTime` 変数に保存しておき、`confirmSave()` で参照する。「練習に戻る」（`closeSaveModal()`）では `pendingSaveEndTime` を null に戻すだけでタイマーはそのまま継続する。

---

### 15. CSS グリッドで2つの入力欄の幅と高さを揃える

**問題**: 曲名とアーティスト名の入力欄を縦に並べ、アーティスト名の行にだけ追加ボタンを置くレイアウトで、曲名入力欄の幅とアーティスト名入力欄の幅が揃わなかった。また追加ボタンのパディングが入力欄より大きく、2行目の行高が1行目より高くなり高さも揃わなかった。

**解決策**: CSS グリッドで `grid-template-columns: 1fr auto` を使い、入力欄を列1・ボタンを列2の2行目に配置。ボタンの `padding-top/bottom` を入力欄に合わせることで行高を統一した。

```css
.add-song-fields {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
}
.add-song-fields #new-song-input   { grid-column: 1 / 2; }
.add-song-fields #new-artist-input { grid-column: 1 / 2; }
.add-song-fields .btn-add {
  grid-column: 2 / 3;
  grid-row: 2;
  padding-top: 9px;
  padding-bottom: 9px;
}
```
