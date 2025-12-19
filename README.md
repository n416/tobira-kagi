# tobira-kagi 🗝️

> **The "Key" for the Tobira Identity Provider.**
> **Forget OIDC. Forget Complexity. Just Auth.**

**tobira-kagi** is the official middleware for **[Tobira](https://github.com/n416/tobira)**.
It provides a seamless, AI-native authentication layer for Hono applications running on Cloudflare Workers.

## ⚡ Why Tobira?

- **🚫 Anti-OIDC**: We don't follow complex standards. We simply exchange JSON.
- **🤖 AI-Native**: Designed specifically for AI agents (Cursor, Windsurf). Just prompt it.
- **🚀 Zero Latency**: Uses Cloudflare **Service Bindings** for instant, internal authentication checks.

---

## 🚪 Step 0: Preparation (The Door)

Before installing this key, you must setup the door (Tobira IdP) and register your app.

1. **Deploy Tobira**: 👉 **[Tobira Main Repository](https://github.com/n416/tobira)**
2. **Get App ID**: Register your app in the Tobira dashboard and copy the **App ID**.

---

## 🛠️ Installation

```bash
npm install git+https://github.com/n416/tobira-kagi.git
```

---

## 🚀 Usage (The AI Way)

**Zero manual coding required.**

1.  **Install** the library.
2.  **Open your AI Editor** (Cursor, Windsurf) and give this prompt:

> **"Read `node_modules/tobira-kagi/INSTRUCTION.md`. Follow the instructions to generate or merge code into `src/index.ts` (or appropriate files) matching the app's endpoints, and implement the authentication flow. My App ID is 'YOUR_APP_ID'."**

*(Replace 'YOUR_APP_ID' with the ID you got in Step 0)*

That's it. The AI will read the internal instructions, create or update the file, setup the bindings, and apply the middleware appropriately for your app structure.

---

## 👨‍💻 Usage (Reference / Manual)

If you need to implement it manually, use this pattern:

```typescript
import { Hono } from 'hono'
import { Kagi } from 'tobira-kagi'

type Bindings = {
  AUTH_URL: string
  TOBIRA: Fetcher
}

const app = new Hono<{ Bindings: Bindings }>()

// Helper to initialize Kagi with env
const getKagi = (c: any) => new Kagi({
  authUrl: c.env.AUTH_URL,
  appId: 'YOUR_APP_ID',
  fetcher: c.env.TOBIRA
})

// 1. Mount Routes
app.all('/auth/*', (c) => getKagi(c).handlers().fetch(c.req.raw, c.env, c.executionCtx))

// 2. Protect Routes
app.use('/*', async (c, next) => {
  if (c.req.path.startsWith('/auth')) return next()
  return getKagi(c).guard()(c, next)
})

export default app
```

## License

MIT
