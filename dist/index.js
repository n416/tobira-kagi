"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Kagi = void 0;
const hono_1 = require("hono");
const cookie_1 = require("hono/cookie");
class Kagi {
    config;
    constructor(config) {
        this.config = config;
    }
    /**
     * Returns a Hono app containing auth routes (/login, /callback, /logout).
     */
    handlers() {
        const app = new hono_1.Hono();
        app.get('/login', (c) => {
            const callbackPath = c.req.path.replace(/\/login$/, '/callback');
            const appUrl = new URL(c.req.url).origin;
            // ログインCSRF対策: ワンタイムのstateをCookieに保存し、
            // コールバックURLのクエリに載せてTobiraを往復させる
            const state = crypto.randomUUID();
            (0, cookie_1.setCookie)(c, 'tobira_state', state, {
                httpOnly: true,
                secure: true,
                path: '/',
                sameSite: 'Lax',
                maxAge: 600,
            });
            const redirectUrl = `${appUrl}${callbackPath}?state=${state}`;
            const loginUrl = `${this.config.authUrl}/login?redirect_to=${encodeURIComponent(redirectUrl)}`;
            return c.redirect(loginUrl);
        });
        app.get('/callback', async (c) => {
            const code = c.req.query('code');
            if (!code)
                return c.text('Missing code', 400);
            // stateがCookieの値と一致しない場合は、攻撃者が用意したコードの
            // 注入(ログインCSRF)の可能性があるため拒否する
            const state = c.req.query('state');
            const cookieState = (0, cookie_1.getCookie)(c, 'tobira_state');
            (0, cookie_1.deleteCookie)(c, 'tobira_state', { path: '/' });
            if (!state || !cookieState || state !== cookieState) {
                return c.text('Invalid state', 400);
            }
            try {
                const tokens = await this.callTobira('/api/token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code })
                });
                if (!tokens.access_token)
                    throw new Error('Failed to obtain tokens');
                const opts = { httpOnly: true, secure: true, path: '/', sameSite: 'Lax' };
                (0, cookie_1.setCookie)(c, 'tobira_access_token', tokens.access_token, { ...opts, maxAge: tokens.expires_in });
                if (tokens.refresh_token) {
                    (0, cookie_1.setCookie)(c, 'tobira_refresh_token', tokens.refresh_token, opts);
                }
                return c.redirect(this.config.defaultRedirect || '/');
            }
            catch (e) {
                console.error('[Kagi] Callback Error:', e);
                return c.text(`Authentication Failed: ${e.message}`, 500);
            }
        });
        app.get('/logout', (c) => {
            (0, cookie_1.deleteCookie)(c, 'tobira_access_token');
            (0, cookie_1.deleteCookie)(c, 'tobira_refresh_token');
            return c.redirect(this.config.authUrl ? `${this.config.authUrl}/logout` : '/login');
        });
        return app;
    }
    /**
     * Auth Guard Middleware
     */
    guard() {
        return async (c, next) => {
            let accessToken = (0, cookie_1.getCookie)(c, 'tobira_access_token');
            const refreshToken = (0, cookie_1.getCookie)(c, 'tobira_refresh_token');
            // No tokens
            if (!accessToken && !refreshToken) {
                if (c.req.header('accept')?.includes('text/html')) {
                    return c.redirect('/auth/login');
                }
                return c.json({ error: 'Unauthorized' }, 401);
            }
            // Refresh flow
            if (!accessToken && refreshToken) {
                try {
                    const newTokens = await this.callTobira('/api/refresh', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ refresh_token: refreshToken })
                    });
                    accessToken = newTokens.access_token;
                    const opts = { httpOnly: true, secure: true, path: '/', sameSite: 'Lax' };
                    (0, cookie_1.setCookie)(c, 'tobira_access_token', accessToken, { ...opts, maxAge: newTokens.expires_in });
                    if (newTokens.refresh_token) {
                        (0, cookie_1.setCookie)(c, 'tobira_refresh_token', newTokens.refresh_token, opts);
                    }
                }
                catch (e) {
                    return c.redirect('/auth/login');
                }
            }
            // Verify User (requires /api/me on Tobira)
            try {
                const user = await this.callTobira('/api/me', {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                c.set('user', user);
                await next();
            }
            catch (e) {
                return c.json({ error: 'Invalid Token' }, 401);
            }
        };
    }
    async callTobira(path, init) {
        const fetcher = this.config.fetcher;
        let res;
        if (fetcher && typeof fetcher.fetch === 'function') {
            // Service Binding (Worker to Worker)
            const url = `http://tobira-internal${path}`;
            // @ts-ignore
            res = await fetcher.fetch(url, init);
        }
        else {
            // Standard Fetch (Internet)
            const f = (fetcher || fetch);
            const url = `${this.config.authUrl}${path}`;
            res = await f(url, init);
        }
        if (!res.ok) {
            throw new Error(`Tobira API Error: ${res.status} ${await res.text()}`);
        }
        return await res.json();
    }
    /**
     * Attempts to refresh the access token using the refresh token cookie.
     * Returns an array of 'Set-Cookie' header strings if successful, or null if failed.
     * This is useful for sliding sessions in environments like Cloudflare Pages.
     */
    async refresh(c) {
        const refreshToken = (0, cookie_1.getCookie)(c, 'tobira_refresh_token');
        if (!refreshToken)
            return null;
        try {
            const newTokens = await this.callTobira('/api/refresh', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: refreshToken })
            });
            if (!newTokens.access_token)
                return null;
            const opts = { httpOnly: true, secure: true, path: '/', sameSite: 'Lax' };
            const maxAge = newTokens.expires_in;
            // 1. Update Hono Context (for standard usage)
            (0, cookie_1.setCookie)(c, 'tobira_access_token', newTokens.access_token, { ...opts, maxAge });
            if (newTokens.refresh_token) {
                (0, cookie_1.setCookie)(c, 'tobira_refresh_token', newTokens.refresh_token, opts);
            }
            // 2. Generate Cookie Strings (for manual Response injection)
            const serialize = (name, val, opt) => {
                let str = `${name}=${val}; Path=${opt.path}; SameSite=${opt.sameSite}`;
                if (opt.secure)
                    str += '; Secure';
                if (opt.httpOnly)
                    str += '; HttpOnly';
                if (opt.maxAge)
                    str += `; Max-Age=${opt.maxAge}`;
                return str;
            };
            const cookies = [
                serialize('tobira_access_token', newTokens.access_token, { ...opts, maxAge }),
            ];
            if (newTokens.refresh_token) {
                cookies.push(serialize('tobira_refresh_token', newTokens.refresh_token, opts));
            }
            return cookies;
        }
        catch (e) {
            // Refresh failed (e.g. expired or network error), just ignore.
            return null;
        }
    }
}
exports.Kagi = Kagi;
