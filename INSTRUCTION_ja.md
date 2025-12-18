# Tobira 認証統合ガイド

## AI (Cursor/Windsurf) への指示
`tobira-kagi` ライブラリを使用して認証機能を実装してください。

### 1. セットアップ
`src/index.ts` にて:

```typescript
import { Hono } from 'hono'
import { Kagi } from 'tobira-kagi'

// Service Binding を含む Bindings を定義
type Bindings = {
  AUTH_URL: string
  TOBIRA: Fetcher
}

const app = new Hono<{ Bindings: Bindings }>()

const kagi = new Kagi({
  authUrl: c.env.AUTH_URL,
  appId: 'YOUR_APP_ID',
  fetcher: c.env.TOBIRA
})

// 認証ルートのマウント
app.route('/auth', kagi.handlers())

// ルートの保護
app.use('/*', kagi.guard())
```
