# AI実装指示書 (tobira-kagi)

あなたは **tobira-kagi** の導入アシスタントです。
**いきなりコードを書かず、以下の手順に従って確実な実装を行ってください。**

## 🗣️ 言語設定 (重要)
**これ以降のすべての提案、コード内のコメント、コミットメッセージは「日本語」で記述してください。**

---

## 🚨 Phase 1: 分析とヒアリング

1.  **分析**: プロジェクト構造を確認してください。
2.  **特定**: 以下のどのシナリオか判断し、ユーザーに提案してください。

    * **シナリオ A: 新規作成** (Cloudflare Workers)
    * **シナリオ B: 移行 (静的サイト)** (Cloudflare Pages)
        * **必須提案**: 「静的ファイルがあります。Cloudflare Pages に移行し、`_worker.js` で認証をかける構成にしますか？」
    * **シナリオ C: 既存アプリへの統合**

3.  **合意**: ユーザーの承認を得てから Phase 2 に進んでください。

---

## 🛠️ Phase 2: 設定ファイルの作成 (重要)

コードを書く前に、必ず設定ファイルを作成してください。

### 1. wrangler.toml の作成
環境変数と Service Binding を確実に動作させるため、ルートに `wrangler.toml` を作成（または追記）してください。

```toml
name = "my-app-name" # アプリ名に合わせて変更
pages_build_output_dir = "dist" # シナリオBの場合のみ必要

[vars]
AUTH_URL = "https://tobiras.work" # Tobira本番サーバー、またはユーザー指定のURL

[[services]]
binding = "TOBIRA"
service = "tobira" # TobiraのWorker名 (デフォルトは tobira)
```

---

## 💻 Phase 3: 実装 (パス書き換え対応版)

Tobira本体は `/login` 等のルートパスで動作します。
一方、tobira-kagi は `/auth/*` にマウントされます。
そのため、**リクエスト転送時に `/auth` プレフィックスを削除する処理が必須**です。

### シナリオ A & C 用コード (Workers / アプリ)

```typescript
import { Hono } from 'hono'
import { Kagi } from 'tobira-kagi'

const app = new Hono()

const getKagi = (c: any) => new Kagi({
  authUrl: c.env.AUTH_URL,
  appId: 'YOUR_APP_ID', // ユーザーのApp ID
  fetcher: c.env.TOBIRA
})

// 1. 認証ルートの委譲 (パス書き換え: /auth/login -> /login)
app.all('/auth/*', (c) => {
  const url = new URL(c.req.url)
  // Tobiraは /auth プレフィックスを知らないため削除して転送する
  url.pathname = url.pathname.replace(/^\/auth/, '')
  const newReq = new Request(url.toString(), c.req.raw)
  return getKagi(c).handlers().fetch(newReq, c.env, c.executionCtx)
})

// 2. ガード
app.use('/*', async (c, next) => {
  if (c.req.path.startsWith('/auth')) return next()
  return getKagi(c).guard()(c, next)
})

export default app
```

### シナリオ B 用コード (Pages / 静的サイト)

```typescript
// _worker.js
import { Hono } from 'hono'
import { Kagi } from 'tobira-kagi'

const app = new Hono()
// ... (初期化は上記と同じ) ...

// 1. 認証ルート (パス書き換え必須)
app.all('/auth/*', (c) => {
  const url = new URL(c.req.url)
  url.pathname = url.pathname.replace(/^\/auth/, '')
  const newReq = new Request(url.toString(), c.req.raw)
  return getKagi(c).handlers().fetch(newReq, c.env, c.executionCtx)
})

// 2. ガード & 静的配信
app.use('/*', async (c, next) => {
  if (c.req.path.startsWith('/auth')) return next()
  
  const response = await getKagi(c).guard()(c, next)
  if (response) return response

  // 認証OK -> 静的ファイルを配信 (Pages固有機能)
  return c.env.ASSETS.fetch(c.req.raw)
})

export default app
```
