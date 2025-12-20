# tobira-kagi 🗝️

> **The "Key" for the Tobira Identity Provider.**
> **Secure your Workers & Pages instantly.**

[![npm version](https://badge.fury.io/js/tobira-kagi.svg)](https://badge.fury.io/js/tobira-kagi)

## ⚠️ Requirements

**Server-Side Middleware Only.**

* ✅ **Supported**: Cloudflare Workers, Cloudflare Pages (Functions / `_worker.js`)
* ❌ **Not Supported**: Standard Shared Hosting (Apache/Nginx only), Client-side JS

---

## ⚡ Features

- **🛡️ Any App**: Protects both **APIs** (Workers) and **Static Sites** (Pages).
- **🤖 AI-Native**: The included instructions guide AI to migrate your legacy site.
- **🚀 Zero Latency**: Uses Cloudflare **Service Bindings**.

---

## 🚪 Step 0: Preparation

1. **Deploy Tobira**: 👉 **[Tobira Main Repository](https://github.com/n416/tobira)**
2. **Get App ID**: Register your app in the Tobira dashboard.

---

## 🛠️ Installation

```bash
npm install git+https://github.com/n416/tobira-kagi.git
```

---

## 🚀 Usage (The AI Way)

**Don't write code. Just prompt.**

1.  Install the library.
2.  Ask your AI Editor (Cursor, Windsurf):

> **"Read `node_modules/tobira-kagi/INSTRUCTION.md`. Analyze my project structure and PROPOSE the best integration strategy. Do not write code yet. My App ID is 'YOUR_APP_ID'."**

The AI will diagnose your files and ask:
*"I see HTML files. Should I set up Cloudflare Pages?"*

Simply answer **"Yes"**, and then it will generate the code.

---

## 👨‍💻 Usage (Manual Reference)

### Pattern A: Cloudflare Workers (API / App)

For standard Hono apps.

```typescript
import { Hono } from 'hono'
import { Kagi } from 'tobira-kagi'

const app = new Hono()

// Init
const getKagi = (c: any) => new Kagi({
  authUrl: c.env.AUTH_URL,
  appId: 'YOUR_APP_ID',
  fetcher: c.env.TOBIRA
})

// 1. Delegate Auth Routes
app.all('/auth/*', (c) => getKagi(c).handlers().fetch(c.req.raw, c.env, c.executionCtx))

// 2. Guard Routes
app.use('/*', async (c, next) => {
  if (c.req.path.startsWith('/auth')) return next()
  return getKagi(c).guard()(c, next)
})

export default app
```

### Pattern B: Cloudflare Pages (Static Site)

To protect HTML files (migrate from rental servers), use `env.ASSETS`.

```typescript
// _worker.js or functions/[[path]].ts
import { Hono } from 'hono'
import { Kagi } from 'tobira-kagi'

const app = new Hono()
// ... (Init Kagi as above) ...

app.use('/*', async (c, next) => {
  if (c.req.path.startsWith('/auth')) return next()
  
  // Guard: Redirects if not logged in
  const response = await getKagi(c).guard()(c, next)
  if (response) return response

  // If Auth OK: Serve static files (HTML/CSS)
  return c.env.ASSETS.fetch(c.req.raw)
})

export default app
```

## License

MIT
