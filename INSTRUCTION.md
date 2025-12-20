# AI Instruction for tobira-kagi Implementation

You are an expert implementation assistant for **tobira-kagi**.
**Do NOT implement immediately.** First, you must analyze the project and **ASK the user** for confirmation.

## 🚨 Phase 1: Analysis & Proposal (The Interview)

1.  **Analyze**: Check the file structure (`package.json`, `index.html`, `wrangler.toml`, etc.).
2.  **Identify**: Which of the following scenarios fits best?

    * **Scenario A: Greenfield** (New Project)
        * *Signs*: Empty folder or minimal setup.
        * *Plan*: Create a standard Hono + Cloudflare Workers app.
    
    * **Scenario B: Migration** (Static Site on Legacy Hosting)
        * *Signs*: User has `index.html` / CSS files but no `src/index.ts` or `wrangler.toml`.
        * *Plan*: Migrate to **Cloudflare Pages** (Functions).
        * *Pitch*: "I see static files. I recommend moving them to Cloudflare Pages for free SSL and better auth. Shall we do this?"
    
    * **Scenario C: Integration** (Existing Hono App)
        * *Signs*: Existing `Hono` code in `src/`.
        * *Plan*: Add the middleware code to the existing app.

3.  **Action**: **Present your analysis to the user and ask for approval.**
    * *Example*: "It looks like you have a static site. I recommend Scenario B (Cloudflare Pages). Is that correct?"

## 🛣️ Phase 2: Implementation (After User Approval)

Once the user confirms the scenario, generate the code below.

### Code for Scenario A & C (Workers/Hono)

```typescript
import { Hono } from 'hono'
import { Kagi } from 'tobira-kagi'

const app = new Hono()

const getKagi = (c: any) => new Kagi({
  authUrl: c.env.AUTH_URL,
  appId: 'YOUR_APP_ID', // Replace with user's App ID
  fetcher: c.env.TOBIRA
})

app.all('/auth/*', (c) => getKagi(c).handlers().fetch(c.req.raw, c.env, c.executionCtx))

app.use('/*', async (c, next) => {
  if (c.req.path.startsWith('/auth')) return next()
  return getKagi(c).guard()(c, next)
})

export default app
```

### Code for Scenario B (Pages / Static Site)

Use `env.ASSETS` to serve the static files after authentication.

```typescript
// _worker.js
import { Hono } from 'hono'
import { Kagi } from 'tobira-kagi'

const app = new Hono()
// ... (Init Kagi as above) ...

app.use('/*', async (c, next) => {
  if (c.req.path.startsWith('/auth')) return next()
  
  const response = await getKagi(c).guard()(c, next)
  if (response) return response

  // Auth OK -> Serve Static Asset
  return c.env.ASSETS.fetch(c.req.raw)
})

export default app
```
