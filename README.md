# Tobira 🚪

> **Forget OIDC. Forget Complexity. Just Auth.**

**Tobira** is an AI-native, "Anti-Standard" Identity Provider running on **Cloudflare Workers** and **D1**.
We built this because implementing OIDC/OAuth2 correctly is a pain, and building a login form for every single side project is a waste of time.

## ⚡ Why Tobira?

- **🚫 No OIDC, No Hassle**: We don't follow complex standards like OpenID Connect. We just exchange codes for tokens via simple JSON. That's it.
- **🤖 AI-First Design**: Designed to be implemented by AI agents (Cursor/Windsurf). You just prompt, and it works.
- **💸 Free Forever (Probably)**: Runs on Cloudflare Workers + D1. High performance, zero cost for personal use. **D1 rocks!**
- **🚀 Service Binding Speed**: If your app is on Cloudflare, we skip HTTP entirely. Internal communication is blazing fast.

---

## 🛠️ Setup Tobira (IdP)

### 1. Deploy the IdP

Clone this repository and deploy it to your Cloudflare account.

```bash
git clone https://github.com/n416/tobira.git
cd tobira
npm install

# Setup Database (D1 is awesome!)
wrangler d1 create tobira-db
wrangler d1 execute tobira-db --file=./schema.sql

# Start Local Dev
npm run dev
```

Access the dashboard at `http://localhost:8787`.

---

## 🔐 For Client Apps (The "Kagi" Middleware)

To add authentication to your Hono app, use our middleware library **`tobira-kagi`**.
It abstracts everything. You don't need to write auth logic anymore.

### Installation

We don't publish to npm (yet). Install directly from GitHub:

```bash
npm install git+https://github.com/n416/tobira-kagi.git
```

### How to Use

Just tell your AI: *"Use tobira-kagi to protect this app."*
Or write this in your `src/index.ts`:

```typescript
import { Hono } from 'hono'
import { Kagi } from 'tobira-kagi'

// ... see tobira-kagi documentation (INSTRUCTION.md) for full setup
```

---

## License

MIT. Go build something fun.
