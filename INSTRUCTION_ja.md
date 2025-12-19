# Tobira 認証統合ガイド

## AI (Cursor/Windsurf) への指示
`tobira-kagi` ライブラリを使用して認証機能を実装してください。
Cloudflare Workersでは環境変数がリクエストコンテキスト(`c.env`)にあるため、以下のパターンを推奨します。

### 1. 環境変数の設定
`.dev.vars` (ローカル) または `wrangler.toml` (本番) に以下を設定してください。
Service Binding (`TOBIRA`) の利用を推奨します。

```
AUTH_URL="https://tobira.your-domain.com"
```

### 2. 実装 (src/index.ts)
以下の「ヘルパー関数パターン」を使用して実装してください。

```typescript
import { Hono } from 'hono'
import { Kagi } from 'tobira-kagi'

type Bindings = {
  AUTH_URL: string
  TOBIRA: Fetcher
  APP_ID?: string
}

const app = new Hono<{ Bindings: Bindings }>()

// Helper to initialize Kagi with env
const getKagi = (c: any) => new Kagi({
  authUrl: c.env.AUTH_URL,
  appId: c.env.APP_ID || 'my-app',
  fetcher: c.env.TOBIRA
})

// 1. Mount Auth Routes (Forwarding pattern)
app.all('/auth/*', (c) => {
  return getKagi(c).handlers().fetch(c.req.raw, c.env, c.executionCtx)
})

// 2. Protect Routes
app.use('/*', async (c, next) => {
  if (c.req.path.startsWith('/auth')) return next()
  return getKagi(c).guard()(c, next)
})

// 3. App Logic
app.get('/', (c) => {
  const user = c.get('user')
  return c.text(`Hello ${user.email}`)
})
export default app
```

