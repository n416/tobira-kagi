import { Hono, Context, Next } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'

export type KagiConfig = {
  /** Tobira Public URL (For browser redirects) */
  authUrl: string
  /** Application ID */
  appId: string
  /** Service Binding (Recommended) or fetch-compatible function */
  fetcher?: Fetcher | typeof fetch
  /** Redirect destination after login (default: /) */
  defaultRedirect?: string
}

export class Kagi {
  private config: KagiConfig

  constructor(config: KagiConfig) {
    this.config = config
  }

  /**
   * Returns a Hono app containing auth routes (/login, /callback, /logout).
   */
  handlers() {
    const app = new Hono()

    app.get('/login', (c) => {
      const callbackPath = c.req.path.replace(/\/login$/, '/callback')
      const appUrl = new URL(c.req.url).origin
      const redirectUrl = `${appUrl}${callbackPath}`
      
      const loginUrl = `${this.config.authUrl}/login?redirect_to=${encodeURIComponent(redirectUrl)}`
      return c.redirect(loginUrl)
    })

    app.get('/callback', async (c) => {
      const code = c.req.query('code')
      if (!code) return c.text('Missing code', 400)

      try {
        const tokens = await this.callTobira('/api/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code })
        })

        if (!tokens.access_token) throw new Error('Failed to obtain tokens')

        const opts = { httpOnly: true, secure: true, path: '/', sameSite: 'Lax' as const }
        setCookie(c, 'tobira_access_token', tokens.access_token, { ...opts, maxAge: tokens.expires_in })
        if (tokens.refresh_token) {
            setCookie(c, 'tobira_refresh_token', tokens.refresh_token, opts)
        }

        return c.redirect(this.config.defaultRedirect || '/')
      } catch (e: any) {
        console.error('[Kagi] Callback Error:', e)
        return c.text(`Authentication Failed: ${e.message}`, 500)
      }
    })

    app.get('/logout', (c) => {
      deleteCookie(c, 'tobira_access_token')
      deleteCookie(c, 'tobira_refresh_token')
      return c.redirect(this.config.authUrl ? `${this.config.authUrl}/logout` : '/login')
    })

    return app
  }

  /**
   * Auth Guard Middleware
   */
  guard() {
    return async (c: Context, next: Next) => {
      let accessToken = getCookie(c, 'tobira_access_token')
      const refreshToken = getCookie(c, 'tobira_refresh_token')

      // No tokens
      if (!accessToken && !refreshToken) {
        if (c.req.header('accept')?.includes('text/html')) {
            return c.redirect('/auth/login')
        }
        return c.json({ error: 'Unauthorized' }, 401)
      }

      // Refresh flow
      if (!accessToken && refreshToken) {
        try {
            const newTokens = await this.callTobira('/api/refresh', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: refreshToken })
            })
            
            accessToken = newTokens.access_token
            const opts = { httpOnly: true, secure: true, path: '/', sameSite: 'Lax' as const }
            setCookie(c, 'tobira_access_token', accessToken as string, { ...opts, maxAge: newTokens.expires_in })
            if (newTokens.refresh_token) {
                setCookie(c, 'tobira_refresh_token', newTokens.refresh_token, opts)
            }
        } catch (e) {
            return c.redirect('/auth/login')
        }
      }

      // Verify User (requires /api/me on Tobira)
      try {
        const user = await this.callTobira('/api/me', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        })
        c.set('user', user)
        await next()
      } catch (e) {
        return c.json({ error: 'Invalid Token' }, 401)
      }
    }
  }

  private async callTobira(path: string, init: RequestInit) {
    const fetcher = this.config.fetcher || fetch
    
    // Service Binding用のダミーURL構築
    const url = (typeof (fetcher as any).fetch === 'function') 
        ? `http://tobira-internal${path}` 
        : `${this.config.authUrl}${path}`
    
    // @ts-ignore
    const res = await fetcher.fetch(url, init as any)
    if (!res.ok) {
        throw new Error(`Tobira API Error: ${res.status} ${await res.text()}`)
    }
    return await res.json()
  }
}
