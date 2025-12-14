# 全角スペース対応版 prettier-plugin-liquid v1.10.0 移行計画

## 📋 プロジェクト概要

**目的**: 現在のフォーク版(v1.2.3)の全角スペース対応を維持しながら、Shopify公式の最新版(v1.10.0)へ移行する

**現状**:
- フォーク版: v1.2.3 (2023年7月) - 全角スペース対応済み
- 公式最新版: v1.10.0 (2024年12月) - モノレポ化、パーサー分離済み
- バージョン差: 8メジャーバージョン、約1.5年分の開発

---

## 🎯 移行戦略

### 戦略: **公式最新版ベース + 全角スペース対応パッチ適用**

```
1. 公式v1.10.0のprettier-plugin-liquidパッケージを取得
2. 現プロジェクト構造に配置
3. 全角スペース対応のコミットを適用
4. 依存関係を調整
5. テストを実行・修正
```

---

## 📦 移行対象ファイル

### Phase 1: 公式パッケージの取り込み

#### 1.1 コアファイル (上書き)
```
FROM: theme-tools/packages/prettier-plugin-liquid/
TO:   prettier-plugin-liquid/

[必須ファイル]
src/
├── plugin.ts                    ← 新規 (v1.10.0)
├── parser.ts                    ← 新規 (v1.10.0、parserディレクトリを置換)
├── printer/
│   ├── embed.ts
│   ├── index.ts
│   ├── print-preprocess.ts
│   ├── printer-liquid-html.ts
│   ├── preprocess/
│   │   ├── augment-with-css-properties.ts
│   │   ├── augment-with-family.ts
│   │   ├── augment-with-parent.ts
│   │   ├── augment-with-siblings.ts
│   │   ├── augment-with-whitespace-helpers.spec.ts
│   │   ├── augment-with-whitespace-helpers.ts
│   │   └── index.ts
│   ├── print/
│   │   ├── children.ts
│   │   ├── element.ts
│   │   ├── liquid.ts
│   │   └── tag.ts
│   └── utils/
│       ├── array.spec.ts
│       ├── array.ts
│       ├── index.ts
│       ├── node.ts
│       └── string.ts          ← 🎯 全角スペース対応が必要
├── types.ts
├── utils.ts
└── constants.evaluate.ts
```

#### 1.2 削除対象 (旧アーキテクチャ)
```
[削除するディレクトリ]
src/parser/                      ← @shopify/liquid-html-parserに移行済み
  ├── conditional-comment.ts
  ├── errors.ts
  ├── grammar.spec.ts
  ├── grammar.ts
  ├── index.ts
  ├── parser.ts
  ├── stage-1-cst.spec.ts
  ├── stage-1-cst.ts
  ├── stage-2-ast.spec.ts
  └── stage-2-ast.ts

src/index.ts                     ← plugin.ts + parser.tsに統合
```

#### 1.3 設定ファイル
```
[上書き]
package.json                     ← 依存関係を更新
tsconfig.build.json              ← ビルド設定を更新

[新規追加]
vitest.config.mjs                ← Vitestの設定

[削除]
.mocharc.json                    ← Mochaを廃止
.nycrc                           ← カバレッジツールを廃止
build/shims.js                   ← liquid-html-parserに移行
```

#### 1.4 テストファイル
```
[移行]
FROM: test/
TO:   src/test/

[新規追加されるテスト]
src/test/
├── liquid-doc/                  ← LiquidDoc機能テスト
├── liquid-tag-capture-whitespace/  ← capture空白処理テスト
├── liquid-tag-content-for/      ← content_forタグテスト
└── issue-162/                   ← バグ修正テスト

[既存テスト]
src/test/full-width-space/       ← 🎯 維持 (フォーク版独自)
```

---

## 🔧 全角スペース対応の適用

### Phase 2: 全角スペース対応パッチ

#### 2.1 対象コミット
```bash
# フォーク版で適用されているコミット
86e74b0 - tests: add test for full-width-space
73ec550 - fix: make sure DO NOT replace full-width-space to half-width-space
```

#### 2.2 変更ファイル詳細

##### ファイル1: `src/printer/utils/string.ts`
```diff
export function isWhitespace(source: string, loc: number): boolean {
  if (loc < 0 || loc >= source.length) return false;
-  return !!source[loc].match(/\s/);
+  // Only match half-width whitespace to preserve full-width spaces (U+3000)
+  return !!source[loc].match(/[ \t\r\n\f\v]/);
}

export function bodyLines(str: string): string[] {
  return str
-    .replace(/^(?: |\t)*(\r?\n)*|\s*$/g, '') // only want the meat
+    .replace(/^(?: |\t)*(\r?\n)*|[ \t\r\n\f\v]*$/g, '') // only want the meat, preserve full-width spaces
     .split(/\r?\n/);
}
```

##### ファイル2: `src/printer/printer-liquid-html.ts`
```diff
function printTextNode(...) {
  ...
  .map((curr) => {
    let doc = [];
-    const words = curr.trim().split(/\s+/g);
+    // Split only on half-width whitespace to preserve full-width spaces (U+3000)
+    const words = curr.trim().split(/[ \t\r\n\f\v]+/g);
    let isFirst = true;
    ...
  })
}
```

##### ファイル3: `src/test/full-width-space/` (新規追加)
```
src/test/full-width-space/
├── index.spec.ts
├── index.liquid
└── fixed.liquid
```

#### 2.3 インポートパスの調整
```typescript
// 新しいインポート構造に合わせて調整
// Before (v1.2.3):
import { Position } from '~/types';

// After (v1.10.0):
import { Position } from '@shopify/liquid-html-parser';
import { LiquidAstPath, LiquidParserOptions } from '../../types';
```

---

## 📝 依存関係の更新

### Phase 3: package.json の調整

#### 3.1 dependencies の変更
```diff
{
  "dependencies": {
-   "html-styles": "^1.0.0",
-   "line-column": "^1.0.2",
-   "ohm-js": "^16.3.0"
+   "@shopify/liquid-html-parser": "^2.9.0",
+   "html-styles": "^1.0.0"
  }
}
```

#### 3.2 devDependencies の変更
```diff
{
  "devDependencies": {
-   "@istanbuljs/nyc-config-typescript": "^1.0.2",
-   "@tsconfig/node14": "^1.0.1",
-   "@types/chai": "^4.2.22",
-   "@types/line-column": "^1.0.0",
-   "@types/mocha": "^9.0.0",
-   "@types/node": "^16.11.11",
    "@types/prettier": "^2.4.2",
-   "chai": "^4.3.4",
    "cross-env": "^7.0.3",
-   "husky": "^7.0.0",
-   "mocha": "^9.1.3",
    "module-alias": "^2.2.3",
-   "nyc": "^15.1.0",
    "prettier2": "npm:prettier@^2.6.1",
    "prettier3": "npm:prettier@^3.0.0",
-   "pretty-quick": "^3.1.3",
    "source-map-support": "^0.5.21",
-   "ts-node": "^10.4.0",
-   "tsc-alias": "^1.6.7",
-   "tsconfig-paths": "^3.14.1",
-   "typescript": "^4.5.2",
-   "webpack": "^5.70.0",
-   "webpack-cli": "^4.9.2"
+   "tsconfig-paths": "^3.14.1"
  }
}
```

#### 3.3 scripts の変更
```diff
{
  "scripts": {
-   "build": "yarn build:shims && yarn build:ts && yarn build:standalone",
-   "build:shims": "node build/shims.js",
+   "build": "yarn build:ts && yarn build:standalone",
+   "build:ci": "yarn build",
    "build:standalone": "webpack -c webpack.config.js",
-   "build:ts": "tsc -p tsconfig.build.json && tsc-alias -p tsconfig.build.json",
+   "build:ts": "tsc -p tsconfig.build.json",
-   "coverage": "nyc yarn test",
-   "coverage:json": "nyc --reporter=json yarn test",
-   "coverage:lcov": "nyc --reporter=lcov yarn test",
-   "debug": "node --inspect-brk node_modules/.bin/_mocha \"{src,test}/**/*.ts\"",
-   "format": "scripts/relative-to-alias && prettier --write --ignore-unknown \"{src,test}/**/*.ts\"",
-   "format:check": "prettier --check --ignore-unknown \"{src,test}/**/*.ts\"",
+   "format": "prettier --write --ignore-unknown \"src/**/*.ts\"",
+   "format:check": "prettier --check --ignore-unknown \"src/**/*.ts\"",
    "playground": "npx http-server playground",
-   "prepare": "husky install",
    "prerelease": "scripts/prerelease",
    "prettier": "scripts/prettier",
    "prettier2": "cross-env PRETTIER_MAJOR=2 scripts/prettier",
    "prettier3": "cross-env PRETTIER_MAJOR=3 scripts/prettier",
-   "test": "node_modules/.bin/mocha '{src,test}/**/*.spec.ts'",
+   "test": "vitest -c \"./vitest.config.mjs\"",
    "test:3": "cross-env PRETTIER_MAJOR=3 yarn test",
-   "test:idempotence": "cross-env TEST_IDEMPOTENCE=true node_modules/.bin/mocha 'test/**/*.spec.ts'",
+   "test:idempotence": "cross-env TEST_IDEMPOTENCE=true vitest run 'src/test/'",
    "test:idempotence:3": "cross-env PRETTIER_MAJOR=3 yarn test:idempotence",
    "type-check": "tsc --noEmit"
  }
}
```

#### 3.4 メタデータの変更
```diff
{
- "name": "@isomaguro_taisa/prettier-plugin-liquid",
+ "name": "@isomaguro_taisa/prettier-plugin-liquid",
- "version": "1.2.3",
+ "version": "1.10.0-fullwidth.0",
- "description": "Prettier Liquid/HTML plugin by Shopify (with full-width space support)",
+ "description": "Prettier Liquid/HTML plugin by Shopify v1.10.0 (with full-width space support)",
- "repository": "kimura-apg/prettier-plugin-liquid",
+ "repository": {
+   "type": "git",
+   "url": "https://github.com/kimura-apg/prettier-plugin-liquid.git"
+ },
  "author": "CP Clermont <@charlespwd>",
+ "homepage": "https://github.com/kimura-apg/prettier-plugin-liquid#readme",
  "license": "MIT",
+ "bugs": {
+   "url": "https://github.com/kimura-apg/prettier-plugin-liquid/issues"
+ },
  "publishConfig": {
    "access": "public"
  }
}
```

---

## 🔄 移行手順

### Step-by-Step 実行プラン

#### ステップ1: バックアップと準備
```bash
# 現在のブランチを保存
cd /Users/koichikimura/Development/prettier-plugin-liquid
git checkout -b backup-v1.2.3-fullwidth
git push origin backup-v1.2.3-fullwidth

# 作業用ブランチを作成
git checkout main
git checkout -b migrate-to-v1.10.0-fullwidth
```

#### ステップ2: 公式v1.10.0の取得
```bash
# 既にクローン済み
cd /tmp/theme-tools

# 最新を取得
git pull origin main

# 必要なファイルを確認
ls -la packages/prettier-plugin-liquid/
ls -la packages/liquid-html-parser/
```

#### ステップ3: ファイルの置換
```bash
cd /Users/koichikimura/Development/prettier-plugin-liquid

# 古いparserディレクトリを削除
rm -rf src/parser/
rm -f src/index.ts

# 公式の新しいファイルをコピー
cp /tmp/theme-tools/packages/prettier-plugin-liquid/src/plugin.ts src/
cp /tmp/theme-tools/packages/prettier-plugin-liquid/src/parser.ts src/
cp /tmp/theme-tools/packages/prettier-plugin-liquid/src/types.ts src/
cp /tmp/theme-tools/packages/prettier-plugin-liquid/src/utils.ts src/
cp /tmp/theme-tools/packages/prettier-plugin-liquid/src/constants.evaluate.ts src/

# printerディレクトリを更新 (全角対応前のファイルとして)
cp -r /tmp/theme-tools/packages/prettier-plugin-liquid/src/printer/ src/

# テストディレクトリを移行
rm -rf test/
mkdir -p src/test/
cp -r /tmp/theme-tools/packages/prettier-plugin-liquid/src/test/* src/test/

# 設定ファイルを更新
cp /tmp/theme-tools/packages/prettier-plugin-liquid/vitest.config.mjs .
```

#### ステップ4: 全角スペース対応の復元
```bash
# フォーク版のfull-width-spaceテストを復元
git checkout backup-v1.2.3-fullwidth -- test/full-width-space/
mkdir -p src/test/full-width-space/
mv test/full-width-space/* src/test/full-width-space/
rmdir test/full-width-space/

# 全角スペース対応パッチを手動適用
# → src/printer/utils/string.ts を編集
# → src/printer/printer-liquid-html.ts を編集
```

#### ステップ5: package.jsonの更新
```bash
# 手動でpackage.jsonを編集（上記の差分を参照）
# 主な変更点:
# - version: "1.10.0-fullwidth.0"
# - dependencies: @shopify/liquid-html-parser追加
# - devDependencies: 不要なものを削除
# - scripts: Vitest対応
```

#### ステップ6: vitest.config.mjsの調整
```bash
# liquid-html-parserのshimsパスを修正
cat > vitest.config.mjs << 'EOF'
import * as path from 'node:path';
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
    // liquid-html-parserはnode_modulesから読み込む
    // setupFiles: ['../liquid-html-parser/build/shims.js'],
  },
});
EOF
```

#### ステップ7: 依存関係のインストール
```bash
# 古い依存関係を削除
rm -rf node_modules/
rm -f yarn.lock

# 新しい依存関係をインストール
yarn install
```

#### ステップ8: ビルドとテスト
```bash
# TypeScriptの型チェック
yarn type-check

# ビルド
yarn build

# テスト実行
yarn test

# 全角スペーステストを確認
yarn test src/test/full-width-space

# Prettier 3でもテスト
yarn test:3
```

#### ステップ9: コミット
```bash
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
```

#### ステップ10: バージョンタグ
```bash
# バージョンタグを作成
git tag v1.10.0-fullwidth.0
git push origin migrate-to-v1.10.0-fullwidth
git push origin v1.10.0-fullwidth.0
```

---

## 🧪 テスト計画

### 必須テスト項目

#### 1. 全角スペース機能テスト
```bash
# 全角スペーステストが通ることを確認
yarn test src/test/full-width-space

# 実際のLiquidファイルでテスト
echo '<p>これは　全角スペース　のテストです</p>' | yarn prettier --parser liquid-html
# 期待: 全角スペースが保持される
```

#### 2. 既存テストの実行
```bash
# すべてのテストを実行
yarn test

# Prettier 2でテスト
yarn prettier2 test-cases/example.liquid

# Prettier 3でテスト
yarn prettier3 test-cases/example.liquid
```

#### 3. 新機能のテスト
```bash
# LiquidDoc機能
yarn test src/test/liquid-doc

# content_forタグ
yarn test src/test/liquid-tag-content-for

# captureWhitespaceSensitivity
yarn test src/test/liquid-tag-capture-whitespace
```

#### 4. 後方互換性テスト
```bash
# v1.2.3で動いていたファイルが正常にフォーマットされるか
git checkout backup-v1.2.3-fullwidth -- test/
yarn prettier test/**/*.liquid --write
git diff test/
# 期待: 全角スペース以外は公式v1.10.0と同じ出力
```

---

## 🚨 リスクと対策

### 潜在的な問題

#### 問題1: liquid-html-parserの依存
**リスク**: 外部パッケージへの依存により、将来的なメンテナンスコストが増加

**対策**:
- package.jsonでバージョンを固定: `"@shopify/liquid-html-parser": "2.9.0"`
- 定期的にupstreamを監視
- 必要に応じて独自にforkすることも検討

#### 問題2: インポートパスの変更
**リスク**: 全角スペース対応コードのインポートパスが変わる可能性

**対策**:
```typescript
// 新しいファイル構造を確認してから適用
// src/printer/utils/string.tsのインポート:
import { Position } from '@shopify/liquid-html-parser';
import { LiquidAstPath, LiquidParserOptions } from '../../types';
```

#### 問題3: テストフレームワークの変更
**リスク**: MochaからVitestへの移行でテストが動かない

**対策**:
- テストファイルのsyntaxを確認
- `describe`, `it`, `expect`の互換性を確認
- 必要に応じてtest-setup.jsを調整

#### 問題4: ビルドエラー
**リスク**: tsc-aliasの削除により、パスエイリアスが解決できない

**対策**:
- tsconfig.jsonのpathsを調整
- 必要に応じて相対パスに変更
- ビルドエラーを逐一修正

---

## 📊 進捗チェックリスト

### Phase 1: 準備 (1日目)
- [ ] バックアップブランチ作成 (`backup-v1.2.3-fullwidth`)
- [ ] 作業ブランチ作成 (`migrate-to-v1.10.0-fullwidth`)
- [ ] 公式リポジトリの最新版を確認
- [ ] このMIGRATION_PLAN.mdを熟読

### Phase 2: ファイル移行 (1日目)
- [ ] src/parser/ を削除
- [ ] src/index.ts を削除
- [ ] 公式のsrc/plugin.ts をコピー
- [ ] 公式のsrc/parser.ts をコピー
- [ ] 公式のsrc/printer/ を上書き
- [ ] test/ → src/test/ に移行
- [ ] 設定ファイルを更新

### Phase 3: 全角スペース対応 (1日目)
- [ ] src/test/full-width-space/ を復元
- [ ] src/printer/utils/string.ts にパッチ適用
- [ ] src/printer/printer-liquid-html.ts にパッチ適用
- [ ] コメントで全角対応を明記

### Phase 4: 依存関係 (1日目)
- [ ] package.json の dependencies を更新
- [ ] package.json の devDependencies を更新
- [ ] package.json の scripts を更新
- [ ] package.json のメタデータを更新
- [ ] vitest.config.mjs を作成
- [ ] yarn install を実行

### Phase 5: ビルドとテスト (2日目)
- [ ] yarn type-check で型エラー解消
- [ ] yarn build でビルド成功
- [ ] yarn test で全テスト通過
- [ ] yarn test src/test/full-width-space で全角テスト通過
- [ ] yarn test:3 でPrettier 3対応確認
- [ ] 実際のLiquidファイルで動作確認

### Phase 6: 文書化とリリース (2日目)
- [ ] README.md を更新
- [ ] CHANGELOG.md を作成
- [ ] コミットメッセージを作成
- [ ] バージョンタグを作成
- [ ] GitHubにプッシュ
- [ ] npm publish (オプション)

---

## 📚 参考情報

### 変更されたファイル数
- **削除**: 約15ファイル (src/parser/*, 設定ファイル)
- **追加**: 約10ファイル (plugin.ts, parser.ts, 新しいテスト)
- **変更**: 約30ファイル (printerディレクトリ全体)

### コード量の変化
- **v1.2.3**: 約5,500行 (parserを含む)
- **v1.10.0**: 約1,500行 (parserは外部依存)
- **差分**: -4,000行 (パーサー分離による)

### 新機能
1. **captureWhitespaceSensitivity** (v1.5.0)
2. **content_for タグサポート** (v1.6.0)
3. **LiquidDoc機能** (v1.7.0-v1.9.0)
4. **Boolean式の検出** (v1.10.0)

### 全角スペース対応の核心
```typescript
// キーとなる正規表現の変更:
// Before: /\s/           ← Unicode全体の空白文字 (全角含む)
// After:  /[ \t\r\n\f\v]/ ← ASCII空白文字のみ (全角除外)
```

---

## 🎯 成功の定義

### 必須条件
✅ すべての既存テストが通過  
✅ 全角スペーステストが通過  
✅ ビルドがエラーなく完了  
✅ Prettier 2と3の両方で動作  
✅ 実際のLiquidファイルで全角スペースが保持される

### 推奨条件
✅ 新しいテストも追加実行される  
✅ 型チェックがエラーなし  
✅ READMEが最新の状態を反映  
✅ CHANGELOGが変更を記録

---

## 📅 推定所要時間

| フェーズ | 作業内容 | 推定時間 |
|---------|---------|---------|
| Phase 1 | 準備 | 1時間 |
| Phase 2 | ファイル移行 | 2時間 |
| Phase 3 | 全角スペース対応 | 2時間 |
| Phase 4 | 依存関係調整 | 1時間 |
| Phase 5 | ビルド・テスト | 3時間 |
| Phase 6 | 文書化・リリース | 1時間 |
| **合計** | | **10時間** |

---

## 🚀 次のステップ

移行完了後:

1. **README更新**
   - v1.10.0ベースであることを明記
   - 全角スペース対応を強調
   - 公式との差分を明確化

2. **CHANGELOGの作成**
   ```markdown
   # 1.10.0-fullwidth.0 / 2024-12-14
   
   - 🎉 Migrate to @shopify/prettier-plugin-liquid v1.10.0
   - ✨ Preserve full-width space (U+3000) support
   - 🔄 Replace internal parser with @shopify/liquid-html-parser
   - ✅ Migrate from Mocha to Vitest
   ```

3. **公式へのコントリビューション検討**
   - 全角スペース対応をPRとして提出
   - 国際化対応の重要性を説明
   - マージされるまでフォーク版を維持

---

## 📞 トラブルシューティング

### ビルドエラーが出た場合
```bash
# 型エラーを確認
yarn type-check

# インポートパスを確認
grep -r "from '~/" src/

# 依存関係を再インストール
rm -rf node_modules yarn.lock
yarn install
```

### テストが失敗する場合
```bash
# 特定のテストのみ実行
yarn test src/test/full-width-space

# デバッグモードで実行
DEBUG=* yarn test

# Prettier 2と3を切り替えてテスト
yarn prettier2 test.liquid
yarn prettier3 test.liquid
```

### 全角スペースが保持されない場合
```bash
# string.tsの変更を確認
git diff src/printer/utils/string.ts

# printer-liquid-html.tsの変更を確認
git diff src/printer/printer-liquid-html.ts

# 正規表現が正しいか確認
node -e "console.log(' '.match(/[ \t\r\n\f\v]/))"  // [ ' ' ]
node -e "console.log('　'.match(/[ \t\r\n\f\v]/))" // null (期待通り)
```

---

**作成日**: 2024-12-14  
**対象バージョン**: v1.2.3 → v1.10.0  
**作成者**: AI Assistant  
**レビュー**: Required before execution
