# AI実装指示書 (tobira-kagi)

あなたは **tobira-kagi** の導入アシスタントです。
**いきなりコードを書かないでください。** まずプロジェクトを分析し、ユーザーに方針を**提案・確認**してください。

## 🚨 Phase 1: 分析とヒアリング

1.  **分析**: ファイル構造 (`package.json`, `index.html`, `wrangler.toml` など) を確認してください。
2.  **特定**: 以下のどのシナリオに当てはまるか判断してください。

    * **シナリオ A: 新規作成**
        * *特徴*: 空のフォルダ、または初期状態。
        * *提案*: 標準的な Hono + Cloudflare Workers 構成を作成します。
    
    * **シナリオ B: 移行 (静的サイト)**
        * *特徴*: `index.html` や CSS はあるが、`src/index.ts` や `wrangler.toml` がない。
        * *提案*: **Cloudflare Pages** への移行を提案します。
        * *セリフ*: 「静的ファイルが見つかりました。Cloudflare Pages (Functions) を使って、これらのファイルに認証をかける構成にしますか？」
    
    * **シナリオ C: 既存アプリへの統合**
        * *特徴*: すでに `Hono` のコードが存在する。
        * *提案*: 既存のコードにミドルウェアを追記します。

3.  **アクション**: **あなたの分析結果をユーザーに伝え、同意を得てください。**
    * ユーザーが同意してから Phase 2 に進んでください。

## 🛣️ Phase 2: 実装 (同意後)

### シナリオ A & C 用コード (Workers / アプリ)

```typescript
import { Hono } from 'hono'
import { Kagi } from 'tobira-kagi'

const app = new Hono()

// Kagi初期化
const getKagi = (c: any) => new Kagi({
  authUrl: c.env.AUTH_URL,
  appId: 'YOUR_APP_ID', // ユーザーのApp IDに置換
  fetcher: c.env.TOBIRA
})

// 1. 認証ルートの委譲
app.all('/auth/*', (c) => getKagi(c).handlers().fetch(c.req.raw, c.env, c.executionCtx))

// 2. ガード
app.use('/*', async (c, next) => {
  if (c.req.path.startsWith('/auth')) return next()
  return getKagi(c).guard()(c, next)
})

export default app
```

### シナリオ B 用コード (Pages / 静的サイト)

認証後に `env.ASSETS` を使ってファイルを配信します。

```typescript
// _worker.js
import { Hono } from 'hono'
import { Kagi } from 'tobira-kagi'

const app = new Hono()
// ... (初期化は上記と同じ) ...

app.use('/*', async (c, next) => {
  if (c.req.path.startsWith('/auth')) return next()
  
  // ガード実行
  const response = await getKagi(c).guard()(c, next)
  if (response) return response

  // 認証OK -> 静的ファイルを配信
  return c.env.ASSETS.fetch(c.req.raw)
})

export default app
```
