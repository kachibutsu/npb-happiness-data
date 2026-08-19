# npb-happiness-data — 今季データの自動更新

毎朝 NPB公式の順位表を取得して `current.json` を更新し、GitHub Pages で配信します。
アプリはこの `current.json` を起動時に取りに行くので、**配布済みのアプリのまま今季の勝敗が毎日最新**になります（再ビルド不要・費用0円）。

## 中身
- `scrape.mjs` … NPBの `std_c.html` / `std_p.html` を解析して `current.json` を生成
- `current.json` … 12球団の今季 { rank, w, l, d }（初期値は8/17時点）
- `.github/workflows/update.yml` … 毎日 06:00 JST に実行して更新・コミット
- `package.json` … cheerio 依存

## セットアップ（1回だけ）
1. このフォルダを **新しいGitHubリポジトリ**として公開（例：`npb-happiness-data`）
   ```bash
   git init && git add . && git commit -m "init"
   git branch -M main
   git remote add origin https://github.com/ユーザー名/npb-happiness-data.git
   git push -u origin main
   ```
2. リポジトリの **Settings → Pages** で「Deploy from a branch」→ Branch: `main` / フォルダ `/ (root)` を選んで保存
   → `https://ユーザー名.github.io/npb-happiness-data/current.json` で配信されます
3. **Settings → Actions → General → Workflow permissions** を「Read and write permissions」に設定
4. 動作確認：**Actions タブ → Update NPB standings → Run workflow**（手動実行）で `current.json` が更新されればOK
   - 以降は毎朝自動で回ります（`workflow_dispatch` でいつでも手動実行も可）

## アプリ側の設定
Expoプロジェクトの `App.js` の `CURRENT_URL` を、上記のPages URLに変更して1度だけ再ビルド：
```js
const CURRENT_URL = 'https://ユーザー名.github.io/npb-happiness-data/current.json';
```

## 仕様・注意
- 取得できるのは **順位・勝・敗・分** のみ（NPB順位表に載っている範囲）。
  サヨナラ・逆転・クライマックスシリーズは順位表に無いため、この自動更新には含まれません。
- シーズンオフ（該当年の順位表が未公開の時期）はスクレイプが失敗し、`current.json` は**前回のまま**維持されます（上書きしません）。
- NPBのページ構造が変わると解析が失敗することがあります。その場合は Actions がエラーになるので気づけます（`scrape.mjs` の列対応を調整）。
- 実行時刻はUTC基準。`0 21 * * *` = 06:00 JST。変えたい場合は cron を編集。
- 年は自動で「今年」を対象にします（`NPB_YEAR` 環境変数で上書き可）。

## data出典
順位・勝敗は NPB公式（npb.jp）。
