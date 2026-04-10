# ギター練習記録アプリ

## 概要
ギター練習記録アプリ。HTMLファイル単体で動作し、Googleスプレッドシートにデータを蓄積する。

## 使用環境
- Galaxyスマートフォンのブラウザで使用（PWA対応にすること）
- データはGoogleスプレッドシートに蓄積
- MacからもGalaxyからも同じスプレッドシートを参照・手動編集する

## 操作フロー
1. 曲名をプルダウンで選択
2. 「開始」ボタンをタップ → 開始時間を自動記録
3. 練習する
4. 「終了・保存」ボタンをタップ → 終了時間・練習時間・通算回数を自動計算してスプレッドシートに送信

## スプレッドシートの列構成
| 列 | 項目 |
|---|---|
| A列 | 日付 |
| B列 | 曲名 |
| C列 | 開始時間 |
| D列 | 終了時間 |
| E列 | 練習時間（分） |
| F列 | 通算回数 |

## 通算回数の仕様
- F列はCOUNTIF数式で自動計算
- 手動入力・アプリ入力どちらでも対応
- 過去データを初期行として入れることで任意の回数からカウント開始できる

## 曲名プリセット
Linoleum / NOFX
あなたに / MONGOL800
An Idea For a Movie / Vandals
New Life / Hi-STANDARD
Let It Be / Beatles
Kiss me again / Hi-STANDARD
Lonely / Hi-STANDARD
Smells Like Teen Spirit / Nirvana
Race Problem / B-DASH
小さな恋のうた / MONGOL800
Sleep / Lagwagon

## 技術構成
- フロントエンド：HTML単体ファイル
- バックエンド：Google Apps Script（WebアプリとしてデプロイしたGAS）
- データ保存先：Googleスプレッドシート

## 参考ファイル
服薬アプリ（HTML）を参考にすること。GalaxyでPWA的に動作させる仕組みも同様に実装すること。
※服薬アプリのHTMLファイルパスをここに記載する
