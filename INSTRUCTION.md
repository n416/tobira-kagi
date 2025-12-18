# Tobira Authentication Integration Guide

## Instructions for AI (Cursor/Windsurf)
Use the `tobira-kagi` library to implement authentication.

### 1. Setup
In `src/index.ts`:

```typescript
import { Hono } from 'hono'
import { Kagi } from 'tobira-kagi'

// Define Bindings with Service Binding
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

// Mount Auth Routes
app.route('/auth', kagi.handlers())

// Protect Routes
app.use('/*', kagi.guard())
```
