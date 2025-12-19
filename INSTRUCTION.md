# Tobira Authentication Integration Guide

## Instructions for AI
Implement authentication using `tobira-kagi`.
Since Cloudflare Workers access environment variables via request context (`c.env`), use the following pattern.

### 1. Configuration
Set `AUTH_URL` in `.dev.vars` and enable Service Binding `TOBIRA` in `wrangler.toml`.

### 2. Implementation (src/index.ts)
Use the helper function pattern to inject environment variables.

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

