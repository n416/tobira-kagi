# Tobira Authentication Integration Guide

## Instructions for AI (Cursor/Windsurf)
Use the `tobira-kagi` library to implement authentication.

### 1. Configuration
First, configure the environment variables.

**For Local Development (.dev.vars):**
Create or update `.dev.vars` with the following. Ask the user for the actual `AUTH_URL`.
```
AUTH_URL="https://tobira.your-domain.com"
```

**For wrangler.toml:**
Add the Service Binding configuration.
```toml
[[services]]
binding = "TOBIRA"
service = "tobira" # The worker name of the Tobira IDP
```

### 2. Implementation
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
  appId: 'YOUR_APP_ID', // Ask user for App ID
  fetcher: c.env.TOBIRA
})

// Mount Auth Routes
app.route('/auth', kagi.handlers())

// Protect Routes
app.use('/*', kagi.guard())
```
