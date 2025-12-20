# ⚠️ LANGUAGE CHECK

**IF THE USER SPEAKS JAPANESE, STOP READING THIS FILE.**
**PLEASE READ `INSTRUCTION_ja.md` INSTEAD.**

---

# AI Instruction for tobira-kagi

(If the user is English-speaking, proceed below)

You are an expert implementation assistant for **tobira-kagi**.
**Do NOT implement immediately.** Follow these steps to ensure a bug-free setup.

## 🚨 Phase 1: Analysis & Proposal

1.  **Analyze**: Check project structure.
2.  **Identify**: Scenario A (Greenfield), B (Pages Migration), or C (Integration).
    * For Scenario B, **strongly propose** migrating to Cloudflare Pages.
3.  **Confirm**: Get user approval.

---

## 🛠️ Phase 2: Configuration (Critical)

Create `wrangler.toml` to handle Environment Variables and Service Bindings explicitly.

```toml
name = "my-app-name"
pages_build_output_dir = "dist" # Only for Scenario B

[vars]
AUTH_URL = "https://tobiras.work"

[[services]]
binding = "TOBIRA"
service = "tobira"
```

---

## 💻 Phase 3: Implementation (With Path Rewriting)

The Tobira IdP listens on root paths (e.g., `/login`).
Since tobira-kagi is mounted at `/auth/*`, **you MUST strip the `/auth` prefix** when delegating requests.

### Code for Scenario A & C (Workers)

```typescript
import { Hono } from 'hono'
import { Kagi } from 'tobira-kagi'

const app = new Hono()

const getKagi = (c: any) => new Kagi({
  authUrl: c.env.AUTH_URL,
  appId: 'YOUR_APP_ID',
  fetcher: c.env.TOBIRA
})

// 1. Auth Routes (Rewrite Path: /auth/login -> /login)
app.all('/auth/*', (c) => {
  const url = new URL(c.req.url)
  url.pathname = url.pathname.replace(/^\/auth/, '')
  const newReq = new Request(url.toString(), c.req.raw)
  return getKagi(c).handlers().fetch(newReq, c.env, c.executionCtx)
})

// 2. Route Guard
app.use('/*', async (c, next) => {
  if (c.req.path.startsWith('/auth')) return next()
  return getKagi(c).guard()(c, next)
})

export default app
```

### Code for Scenario B (Pages / Static Site)

```typescript
// _worker.js
import { Hono } from 'hono'
import { Kagi } from 'tobira-kagi'

const app = new Hono()
// ... (Init Kagi as above) ...

// 1. Auth Routes (Rewrite required)
app.all('/auth/*', (c) => {
  const url = new URL(c.req.url)
  url.pathname = url.pathname.replace(/^\/auth/, '')
  const newReq = new Request(url.toString(), c.req.raw)
  return getKagi(c).handlers().fetch(newReq, c.env, c.executionCtx)
})

// 2. Guard & Static Assets
app.use('/*', async (c, next) => {
  if (c.req.path.startsWith('/auth')) return next()
  
  const response = await getKagi(c).guard()(c, next)
  if (response) return response

  // Auth OK -> Serve Static Asset
  return c.env.ASSETS.fetch(c.req.raw)
})

export default app
```
