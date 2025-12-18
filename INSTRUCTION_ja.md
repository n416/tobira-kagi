# Tobira 認証統合ガイド

## AI (Cursor/Windsurf) への指示
`tobira-kagi` ライブラリを使用して認証機能を実装してください。

### 1. 環境変数の設定 (Configuration)
まず、認証に必要な環境変数を設定してください。

**ローカル開発用 (.dev.vars):**
`.dev.vars` ファイルを作成（または編集）し、以下の行を追加してください。
**`AUTH_URL` の実際の値（TobiraのURL）は必ずユーザーに確認してください。**

```
AUTH_URL="https://tobira.your-domain.com"
```

**wrangler.toml の設定:**
Service Binding を有効にするため、以下を追記してください。

```toml
[[services]]
binding = "TOBIRA"
service = "tobira" # Tobira認証基盤のワーカー名
```

### 2. 実装 (Implementation)
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
  appId: 'YOUR_APP_ID', // ユーザー指定のAppIDを使用
  fetcher: c.env.TOBIRA
})

// 認証ルートのマウント
app.route('/auth', kagi.handlers())

// ルートの保護
app.use('/*', kagi.guard())
```
