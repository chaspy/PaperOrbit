# PaperOrbit (MVP)

LLM/AI Agent 関連の論文を OpenAlex / arXiv から検索・閲覧・保存し、日本語3段落の要約を生成するローカルアプリ（pnpm workspace 構成）。

## ワークスペース構成

```
PaperOrbit/
  apps/web/          # Vite + React + Cytoscape.js
  apps/server/       # Express REST API + zod
  packages/agent/    # 検索/要約/埋め込みツール群
  packages/db/       # Prisma/SQLite schema & client
  packages/shared/   # 共通型(zod/TS)
  .env.example       # OPENAI_API_KEY=...
  pnpm-workspace.yaml
```

## セットアップ

1) `.env` を作成

```
cp .env.example .env
# OPENAI_API_KEY を設定
```

2) 依存関係のインストール

```
pnpm i
```

3) DB マイグレーション (SQLite)

```
pnpm -F @paperorbit/db prisma migrate dev
```

4) サーバ起動 (API: 5175)

```
pnpm -F @paperorbit/server dev
```

5) Web 起動 (Web: 5173)

```
pnpm -F @paperorbit/web dev
```

ブラウザで http://localhost:5173 を開く。

## 主要機能 (MVP)

- OpenAlex / arXiv 検索（Snapshot 保存）
- Paper 保存（Prisma/SQLite）
- 日本語3段落要約（OpenAI Responses Structured Outputs）
- PDF ダウンロード → pdf-parse でテキスト抽出
- ベクトル埋め込み（text-embedding-3-small）/ ローカル検索（コサイン）
- Cytoscape.js で引用グラフ描画（保存済みは著者/トピック/要約ノード追加可能）

## 注意

- OpenAI API キーが必要です（`.env` に設定）。
- arXiv / OpenAlex / Crossref へのアクセスは各ポリシーに準拠してください。
# PaperOrbit
