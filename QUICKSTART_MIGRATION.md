# 🚀 移行作業クイックスタートガイド

このガイドは、`MIGRATION_PLAN.md`の内容を実際に実行するための簡易版です。

---

## ⚡ 即座に開始するためのコマンド集

### 前提条件の確認
```bash
# Node.jsのバージョン確認 (14以上推奨)
node --version

# Yarnのバージョン確認
yarn --version

# 現在のディレクトリ確認
pwd
# 期待: /Users/koichikimura/Development/prettier-plugin-liquid

# 公式リポジトリが存在するか確認
ls -la /tmp/theme-tools/packages/prettier-plugin-liquid/
```

---

## 📋 ステップ1: バックアップ (5分)

```bash
#!/bin/bash
# バックアップスクリプト

cd /Users/koichikimura/Development/prettier-plugin-liquid

# 現在の状態をバックアップ
git status
git add .
git commit -m "chore: backup before migration to v1.10.0" || echo "No changes to commit"

# バックアップブランチ作成
git branch backup-v1.2.3-fullwidth
git push origin backup-v1.2.3-fullwidth

# 作業ブランチ作成
git checkout -b migrate-to-v1.10.0-fullwidth

echo "✅ バックアップ完了"
```

---

## 📋 ステップ2: 旧ファイルの削除 (5分)

```bash
#!/bin/bash
# 旧アーキテクチャのファイル削除

cd /Users/koichikimura/Development/prettier-plugin-liquid

# parserディレクトリを削除
echo "🗑️  src/parser/ を削除中..."
rm -rf src/parser/

# 旧index.tsを削除
echo "🗑️  src/index.ts を削除中..."
rm -f src/index.ts

# 旧テストディレクトリを一時保存
echo "📦 test/ を一時保存中..."
mv test/ test_backup/

# Mocha関連設定を削除
echo "🗑️  Mocha設定を削除中..."
rm -f .mocharc.json .nycrc

# husky設定を削除
echo "🗑️  husky設定を削除中..."
rm -rf .husky/

echo "✅ 旧ファイル削除完了"
```

---

## 📋 ステップ3: 公式ファイルのコピー (10分)

```bash
#!/bin/bash
# 公式v1.10.0のファイルをコピー

cd /Users/koichikimura/Development/prettier-plugin-liquid

UPSTREAM="/tmp/theme-tools/packages/prettier-plugin-liquid"

# コアファイルをコピー
echo "📥 コアファイルをコピー中..."
cp "$UPSTREAM/src/plugin.ts" src/
cp "$UPSTREAM/src/parser.ts" src/
cp "$UPSTREAM/src/types.ts" src/
cp "$UPSTREAM/src/utils.ts" src/
cp "$UPSTREAM/src/constants.evaluate.ts" src/

# printerディレクトリを上書き
echo "📥 printerディレクトリをコピー中..."
rm -rf src/printer/
cp -r "$UPSTREAM/src/printer/" src/

# テストディレクトリを作成してコピー
echo "📥 テストをコピー中..."
mkdir -p src/test/
cp -r "$UPSTREAM/src/test/"* src/test/

# 設定ファイルをコピー
echo "📥 設定ファイルをコピー中..."
cp "$UPSTREAM/vitest.config.mjs" .

echo "✅ 公式ファイルのコピー完了"
```

---

## 📋 ステップ4: 全角スペーステストの復元 (5分)

```bash
#!/bin/bash
# 全角スペーステストを復元

cd /Users/koichikimura/Development/prettier-plugin-liquid

# バックアップから全角スペーステストを復元
echo "📥 全角スペーステストを復元中..."
mkdir -p src/test/full-width-space/
cp test_backup/full-width-space/* src/test/full-width-space/

# test_backupを削除
rm -rf test_backup/

echo "✅ 全角スペーステスト復元完了"
ls -la src/test/full-width-space/
```

---

## 📋 ステップ5: 全角スペース対応パッチの適用 (15分)

### 5-1: src/printer/utils/string.ts の修正

```bash
#!/bin/bash
# string.tsのバックアップ作成
cp src/printer/utils/string.ts src/printer/utils/string.ts.backup
```

**手動編集**: `src/printer/utils/string.ts` を開いて以下を適用:

```typescript
// 行8-12付近を以下に変更:
export function isWhitespace(source: string, loc: number): boolean {
  if (loc < 0 || loc >= source.length) return false;
  // Only match half-width whitespace to preserve full-width spaces (U+3000)
  return !!source[loc].match(/[ \t\r\n\f\v]/);
}

// 行14-18付近を以下に変更:
export function bodyLines(str: string): string[] {
  return str
    .replace(/^(?: |\t)*(\r?\n)*|[ \t\r\n\f\v]*$/g, '') // only want the meat, preserve full-width spaces
    .split(/\r?\n/);
}
```

### 5-2: src/printer/printer-liquid-html.ts の修正

```bash
#!/bin/bash
# printer-liquid-html.tsのバックアップ作成
cp src/printer/printer-liquid-html.ts src/printer/printer-liquid-html.ts.backup
```

**手動編集**: `src/printer/printer-liquid-html.ts` を開いて、`printTextNode` 関数内の以下を変更:

```typescript
// 行180-185付近を探して、split(/\s+/g) を以下に変更:
function printTextNode(...) {
  ...
  .map((curr) => {
    let doc = [];
    // Split only on half-width whitespace to preserve full-width spaces (U+3000)
    const words = curr.trim().split(/[ \t\r\n\f\v]+/g);
    let isFirst = true;
    ...
  })
}
```

**確認コマンド**:
```bash
# 変更を確認
git diff src/printer/utils/string.ts
git diff src/printer/printer-liquid-html.ts
```

---

## 📋 ステップ6: package.json の更新 (10分)

```bash
#!/bin/bash
# package.jsonのバックアップ
cp package.json package.json.backup
```

**手動編集**: `package.json` を開いて以下を変更:

```json
{
  "name": "@isomaguro_taisa/prettier-plugin-liquid",
  "version": "1.10.0-fullwidth.0",
  "description": "Prettier Liquid/HTML plugin by Shopify v1.10.0 (with full-width space support)",
  "repository": {
    "type": "git",
    "url": "https://github.com/kimura-apg/prettier-plugin-liquid.git"
  },
  "author": "CP Clermont <@charlespwd>",
  "license": "MIT",
  "homepage": "https://github.com/kimura-apg/prettier-plugin-liquid#readme",
  "bugs": {
    "url": "https://github.com/kimura-apg/prettier-plugin-liquid/issues"
  },
  "dependencies": {
    "@shopify/liquid-html-parser": "^2.9.0",
    "html-styles": "^1.0.0"
  },
  "devDependencies": {
    "@types/prettier": "^2.4.2",
    "cross-env": "^7.0.3",
    "module-alias": "^2.2.3",
    "prettier2": "npm:prettier@^2.6.1",
    "prettier3": "npm:prettier@^3.0.0",
    "source-map-support": "^0.5.21",
    "tsconfig-paths": "^3.14.1"
  },
  "scripts": {
    "build": "yarn build:ts && yarn build:standalone",
    "build:ci": "yarn build",
    "build:standalone": "webpack -c webpack.config.js",
    "build:ts": "tsc -p tsconfig.build.json",
    "format": "prettier --write --ignore-unknown \"src/**/*.ts\"",
    "format:check": "prettier --check --ignore-unknown \"src/**/*.ts\"",
    "playground": "npx http-server playground",
    "prerelease": "scripts/prerelease",
    "prettier": "scripts/prettier",
    "prettier2": "cross-env PRETTIER_MAJOR=2 scripts/prettier",
    "prettier3": "cross-env PRETTIER_MAJOR=3 scripts/prettier",
    "test": "vitest -c \"./vitest.config.mjs\"",
    "test:3": "cross-env PRETTIER_MAJOR=3 yarn test",
    "test:idempotence": "cross-env TEST_IDEMPOTENCE=true vitest run 'src/test/'",
    "test:idempotence:3": "cross-env PRETTIER_MAJOR=3 yarn test:idempotence",
    "type-check": "tsc --noEmit"
  }
}
```

**vitest.config.mjsも確認**:
```javascript
import { defineConfig } from 'vite';
import { configDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude],
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
        isolate: true,
      },
    },
    globalSetup: ['./src/test/test-setup.js'],
  },
});
```

---

## 📋 ステップ7: 依存関係のインストール (5分)

```bash
#!/bin/bash
cd /Users/koichikimura/Development/prettier-plugin-liquid

# 既存の依存関係を削除
echo "🗑️  node_modules と yarn.lock を削除中..."
rm -rf node_modules/
rm -f yarn.lock

# 新しい依存関係をインストール
echo "📦 新しい依存関係をインストール中..."
yarn install

echo "✅ 依存関係のインストール完了"
```

---

## 📋 ステップ8: ビルドとテスト (20分)

```bash
#!/bin/bash
cd /Users/koichikimura/Development/prettier-plugin-liquid

# 型チェック
echo "🔍 型チェック中..."
yarn type-check
if [ $? -ne 0 ]; then
  echo "❌ 型エラーがあります。修正してください。"
  exit 1
fi

# ビルド
echo "🔨 ビルド中..."
yarn build
if [ $? -ne 0 ]; then
  echo "❌ ビルドエラーがあります。修正してください。"
  exit 1
fi

# テスト実行
echo "🧪 テスト実行中..."
yarn test
if [ $? -ne 0 ]; then
  echo "⚠️  一部のテストが失敗しました。確認してください。"
fi

# 全角スペーステスト
echo "🧪 全角スペーステスト実行中..."
yarn test src/test/full-width-space
if [ $? -ne 0 ]; then
  echo "❌ 全角スペーステストが失敗しました！"
  exit 1
fi

# Prettier 3でもテスト
echo "🧪 Prettier 3でテスト中..."
yarn test:3

echo "✅ すべてのビルド・テストが完了しました"
```

---

## 📋 ステップ9: 動作確認 (10分)

```bash
#!/bin/bash
cd /Users/koichikimura/Development/prettier-plugin-liquid

# テスト用のLiquidファイルを作成
cat > /tmp/test-fullwidth.liquid << 'EOF'
<div>
  <p>これは　全角スペース　のテストです</p>
  <p>Hello　World　これも　全角です</p>
  <div class="example">
    日本語の　文章で　全角スペースを　使用します。
    This has normal spaces between words.
  </div>
</div>
EOF

# Prettierで整形
echo "🧪 実際のファイルで全角スペース保持を確認中..."
yarn prettier /tmp/test-fullwidth.liquid

echo ""
echo "👆 上記の出力で全角スペース（　）が保持されていることを確認してください"
```

---

## 📋 ステップ10: コミットとプッシュ (5分)

```bash
#!/bin/bash
cd /Users/koichikimura/Development/prettier-plugin-liquid

# 変更をステージング
git add .

# コミット
git commit -m "feat: migrate to v1.10.0 with full-width space support

- Update to @shopify/prettier-plugin-liquid v1.10.0 architecture
- Replace internal parser with @shopify/liquid-html-parser v2.9.0
- Migrate from Mocha to Vitest
- Preserve full-width space (U+3000) handling in:
  - src/printer/utils/string.ts
  - src/printer/printer-liquid-html.ts
- Move tests from test/ to src/test/
- Add new tests from upstream (liquid-doc, capture-whitespace, etc.)
- Maintain full-width-space test suite

BREAKING CHANGES:
- Requires @shopify/liquid-html-parser as dependency
- Changed from Mocha to Vitest for testing
- Test files moved from test/ to src/test/
"

# タグを作成
git tag v1.10.0-fullwidth.0

# プッシュ
git push origin migrate-to-v1.10.0-fullwidth
git push origin v1.10.0-fullwidth.0

echo "✅ コミットとプッシュが完了しました"
echo "🎉 移行作業完了！"
```

---

## 🆘 トラブルシューティング

### ビルドエラー: "Cannot find module '@shopify/liquid-html-parser'"

```bash
# 依存関係を再インストール
rm -rf node_modules yarn.lock
yarn install
```

### テストエラー: "vitest command not found"

```bash
# vitestをグローバルにインストール
yarn global add vitest

# または、npx経由で実行
npx vitest
```

### 全角スペースが保持されない

```bash
# 変更が正しく適用されているか確認
git diff src/printer/utils/string.ts
git diff src/printer/printer-liquid-html.ts

# 正規表現の確認
node -e "console.log('　'.match(/[ \t\r\n\f\v]/))" # null (期待通り)
node -e "console.log('　'.match(/\s/))"           # [ '　' ] (これはNG)
```

### 型エラーが出る

```bash
# 型定義を確認
yarn type-check 2>&1 | tee type-errors.log

# インポートパスを確認
grep -r "from '~/" src/

# 必要に応じて相対パスに変更
```

---

## ✅ 完了チェックリスト

移行が完了したら、以下を確認してください:

- [ ] `yarn type-check` がエラーなし
- [ ] `yarn build` が成功
- [ ] `yarn test` がすべて通過
- [ ] `yarn test src/test/full-width-space` が通過
- [ ] 実際のLiquidファイルで全角スペースが保持される
- [ ] `git status` でコミットされていることを確認
- [ ] GitHubにプッシュ済み

---

## 🎉 次のステップ

移行完了後にやるべきこと:

1. **README.mdの更新**
   ```bash
   # v1.10.0ベースであることを明記
   # 全角スペース対応を強調
   ```

2. **CHANGELOGの作成**
   ```bash
   # 変更内容を記録
   ```

3. **npmへの公開** (オプション)
   ```bash
   npm login
   npm publish
   ```

4. **公式リポジトリへのPR** (検討)
   ```bash
   # 全角スペース対応をコントリビュート
   ```

---

**所要時間**: 約2時間  
**難易度**: 中級  
**リスク**: 低 (バックアップあり)

🚀 **準備ができたら、ステップ1から順に実行してください！**
