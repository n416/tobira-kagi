import { Hono, Context, Next } from 'hono';
export type KagiConfig = {
    /** Tobira Public URL (For browser redirects) */
    authUrl: string;
    /** Application ID */
    appId: string;
    /** Service Binding (Recommended) or fetch-compatible function */
    fetcher?: Fetcher | typeof fetch;
    /** Redirect destination after login (default: /) */
    defaultRedirect?: string;
};
export declare class Kagi {
    private config;
    constructor(config: KagiConfig);
    /**
     * Returns a Hono app containing auth routes (/login, /callback, /logout).
     */
    handlers(): Hono<import("hono/types").BlankEnv, import("hono/types").BlankSchema, "/">;
    /**
     * Auth Guard Middleware
     */
    guard(): (c: Context, next: Next) => Promise<(Response & import("hono").TypedResponse<undefined, 302, "redirect">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 401, "json">) | undefined>;
    private callTobira;
}
