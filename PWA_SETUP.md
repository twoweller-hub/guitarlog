# HTML アプリを GitHub Pages + PWA 化する手順書

## この手順書について

服薬管理アプリ（medlog）をGitHub Pages + PWAとしてGalaxy S25にインストールした経験をもとに作成。
この手順に従えば、HTMLで作ったアプリをAndroid（Galaxy）でアプリっぽく使えるようになる。

**解決する問題：** ChromeのホームショートカットではタップするたびにChromeの新規タブが増えてしまう。
**解決策：** PWA（Progressive Web App）としてインストールすると、Chromeのタブとは独立したスタンドアロンウィンドウで開く。

---

## 読む前に

**対象読者：** プログラミング知識のない個人ユーザー。GitHubをほとんど使ったことがない人でも進められるように書いてある。

**進め方：**
- 必ず **1ステップずつ順番に** 進めること。まとめてやろうとしない
- 各ステップの最後に「完了した」とAIに伝えてから次に進む
- わからない言葉が出てきたら作業を止めてAIに質問する
- エラーが出たらそのメッセージをそのままAIに貼り付ける

**作業の種類：** この手順書には3種類の作業が出てくる

| 表記 | 誰が・どこで作業するか |
|------|----------------------|
| （ブラウザ作業） | あなたがChromeやSafariで操作する |
| （ターミナル作業） | あなたがMacのターミナルにコマンドを貼り付けて実行する |
| （Claude Codeで作業） | AIが自動でやってくれる。あなたは待つだけ |

---

## 前提条件

- [ ] HTMLアプリがローカルのMacにある（git管理されていること）
- [ ] GitHubアカウントがある
- [ ] Node.js がインストールされている（`node --version` で確認）
- [ ] 公開して問題ないアプリコードである（GitHubのpublicリポジトリに上がる）
- [ ] **服薬データなどの個人データはlocalStorageに保存されるのでGitHubには上がらない**

---

## セキュリティ設定の注意

`~/.claude/settings.json` に以下のコマンドを禁止している場合、Claude Codeから直接実行できないコマンドがある。その場合はターミナルで手動実行する。

禁止されているコマンド（設定している場合）：
- `curl` → ファイルのダウンロード
- `git push` → GitHubへの送信
- `python -c` → インラインPythonスクリプト

**git push は毎回ターミナルで手動実行が必要。**

---

## STEP 1：GitHubでリポジトリを作成（ブラウザ作業）

1. [github.com](https://github.com) にログイン
2. 右上の「＋」→「New repository」
3. 設定：
   - Repository name → アプリ名（例：`guitarlog`）
   - **Public** を選択
   - それ以外は触らない
4. 「Create repository」をクリック
5. 表示されたURL（`https://github.com/ユーザー名/リポジトリ名.git`）をメモしておく

---

## STEP 2：GitHubのPersonal Access Tokenを取得（ブラウザ作業）

1. github.com にログイン
2. 右上アイコン → 「Settings」
3. 左メニュー最下部「Developer settings」
4. 「Personal access tokens」→「Tokens (classic)」
5. 「Generate new token (classic)」
6. 設定：
   - Note → 任意の名前
   - Expiration → `No expiration`
   - **repo** にチェック
7. 「Generate token」→ 表示された `ghp_xxx...` をコピー（このページを閉じると二度と表示されない）

---

## STEP 3：ローカルのGitリポジトリをGitHubに接続（ターミナル作業）

ターミナルを開いてプロジェクトフォルダに移動し、以下を実行：

```bash
cd /path/to/your/project

# リモートを追加
git remote add origin https://github.com/ユーザー名/リポジトリ名.git

# mainブランチをGitHubへ送信（トークンを使う）
git push https://ユーザー名:ghp_xxx@github.com/ユーザー名/リポジトリ名.git main
```

---

## STEP 4：GitHub PagesをONにする（ブラウザ作業）

1. GitHubのリポジトリページを開く
2. 「Settings」タブ → 左メニュー「Pages」
3. Branch を `main` に設定 → 「Save」
4. 数分後に `https://ユーザー名.github.io/リポジトリ名/` でアクセスできるようになる

---

## STEP 5：PWAファイルを追加（Claude Codeで作業）

Claude Codeに以下を依頼すれば作成してくれる。

### 5-1. index.html の準備

- メインのHTMLファイルを `index.html` という名前にする（Capacitorの要件）
- `<head>` に以下を追加：

```html
<link rel="manifest" href="/リポジトリ名/manifest.webmanifest">
<meta name="theme-color" content="#アプリのテーマカラー">
<meta name="mobile-web-app-capable" content="yes">
```

- `</body>` の直前に以下を追加：

```html
<script>
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/リポジトリ名/sw.js', { scope: '/リポジトリ名/' });
  }
</script>
```

### 5-2. manifest.webmanifest を作成

```json
{
  "name": "アプリ名",
  "short_name": "アプリ名",
  "start_url": "/リポジトリ名/",
  "scope": "/リポジトリ名/",
  "display": "standalone",
  "background_color": "#背景色",
  "theme_color": "#テーマカラー",
  "icons": [
    {
      "src": "/リポジトリ名/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/リポジトリ名/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

**注意：** `start_url` と `scope` は必ず `/リポジトリ名/` の形式にする。ここがズレるとPWAとして認識されない。

### 5-3. sw.js を作成

```js
const CACHE = 'アプリ名-v1';
const URLS = [
  '/リポジトリ名/',
  '/リポジトリ名/index.html',
  '/リポジトリ名/manifest.webmanifest',
  '/リポジトリ名/icon-192.png',
  '/リポジトリ名/icon-512.png'
  // CDNから読み込むライブラリがあればここに追加
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(URLS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
```

### 5-4. アイコンPNGを作成

AndroidのホームアイコンにはPNGが必須（SVGだけではPWAとして認識されない）。
macOSのSwiftを使って絵文字アイコンを生成できる。
以下を `make_icons.swift` として保存しターミナルで実行：

```swift
#!/usr/bin/env swift
import AppKit

func makeIcon(size: CGFloat, path: String) {
    let nsSize = NSSize(width: size, height: size)
    let image = NSImage(size: nsSize)
    image.lockFocus()

    // 背景色を変更する場合はRGB値を調整
    NSColor(red: 74/255, green: 144/255, blue: 217/255, alpha: 1).setFill()
    NSBezierPath(roundedRect: NSRect(origin: .zero, size: nsSize),
                 xRadius: size * 0.18, yRadius: size * 0.18).fill()

    // 絵文字を変更する場合は "💊" の部分を書き換える
    let font = NSFont.systemFont(ofSize: size * 0.62)
    let attrs: [NSAttributedString.Key: Any] = [.font: font]
    let str = NSAttributedString(string: "💊", attributes: attrs)
    let strSize = str.size()
    str.draw(at: NSPoint(
        x: (size - strSize.width) / 2,
        y: (size - strSize.height) / 2 - size * 0.02
    ))

    image.unlockFocus()

    if let cgImg = image.cgImage(forProposedRect: nil, context: nil, hints: nil) {
        let rep = NSBitmapImageRep(cgImage: cgImg)
        if let data = rep.representation(using: .png, properties: [:]) {
            try? data.write(to: URL(fileURLWithPath: path))
            print("\(URL(fileURLWithPath: path).lastPathComponent) 作成完了")
        }
    }
}

let dir = CommandLine.arguments.count > 1
    ? CommandLine.arguments[1]
    : FileManager.default.currentDirectoryPath

makeIcon(size: 192, path: "\(dir)/icon-192.png")
makeIcon(size: 512, path: "\(dir)/icon-512.png")
```

```bash
# ターミナルで実行（初回は30秒ほどかかる）
swift /path/to/make_icons.swift /path/to/project
```

実行後 `make_icons.swift` は削除してよい。

---

## STEP 6：コミット＆GitHubへ送信

```bash
# Claude Codeが実行
git add index.html manifest.webmanifest sw.js icon-192.png icon-512.png
git commit -m "PWA化：manifest・Service Worker・アイコンを追加"

# ターミナルで手動実行
git push https://ユーザー名:ghp_xxx@github.com/ユーザー名/リポジトリ名.git main
```

---

## STEP 7：Galaxy S25にインストール

1. Galaxy S25のChromeで `https://ユーザー名.github.io/リポジトリ名/` を開く
2. Chromeメニュー（右上の点3つ）→「アプリをインストール」または「ホーム画面に追加」
3. インストール後、ホームアイコンをタップ → **URLバーが表示されなければ成功**

### インストール成功の確認方法
- Galaxy S25の「設定 → アプリ一覧」にアプリ名が出ている
- 起動時にURLバーが表示されない

---

## アプリ更新手順（機能追加・修正のたびに）

**重要：index.htmlを変えるだけでは反映されない。sw.jsのバージョンも必ず上げること。**

### 1. index.html を修正

### 2. sw.js のキャッシュバージョンを上げる

```js
// 変更前
const CACHE = 'アプリ名-v1';

// 変更後（数字を1つ増やす）
const CACHE = 'アプリ名-v2';
```

なぜ必要か：PWAはService Workerがページをキャッシュして配信している。`sw.js` が変わらない限りChromeは古いキャッシュを使い続けるため、`index.html` を更新しても反映されない。

### 3. コミット＆プッシュ

```bash
# Claude Codeが実行
git add index.html sw.js
git commit -m "変更内容の説明"

# ターミナルで手動実行
git push https://ユーザー名:ghp_xxx@github.com/ユーザー名/リポジトリ名.git main
```

### 4. Galaxy S25で自動更新
1〜2分後にアプリを開くと自動更新される。アンインストール不要・データ保持される。

---

## トラブルシューティング

### 「アプリをインストール」が出ず「ホーム画面に追加」しかない
→ PWAとして認識されていない。以下を確認：
- `manifest.webmanifest` の `start_url` と `scope` が `/リポジトリ名/` になっているか
- PNGアイコンが192x192と512x512の両方あるか
- GitHubへのpushから1〜2分経っているか
- Chromeのキャッシュを削除してから再アクセスする

### アイコンをURLバー付きのショートカットで開いてしまう
→ 「ホーム画面に追加」ではなく「アプリをインストール」でインストールし直す

### 更新してもGalaxyに反映されない
→ sw.jsの `const CACHE = '...'` のバージョン番号を上げたか確認

### インストール後にキャッシュをクリアしたらインストールし直しになった
→ キャッシュクリアはService Workerも消える。アンインストール→再インストールが必要

---

## ファイル構成（完成後）

```
プロジェクト/
├── index.html           ← アプリ本体（編集対象）
├── manifest.webmanifest ← PWA設定
├── sw.js                ← Service Worker
├── icon-192.png         ← アプリアイコン 192×192
├── icon-512.png         ← アプリアイコン 512×512
└── DOCUMENT.md          ← アプリのドキュメント
```

---

## GitHubのURLを忘れたとき

`https://github.com/ユーザー名/リポジトリ名` を開く
→「Settings」→「Pages」に公開URLが表示されている
