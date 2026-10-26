import { configureCordyAssets, cordy_balance, cordy_bridge, cordy_swap, cordy_transfer } from "./transfer";
export type JwtSessionResult = {
    authenticated: boolean;
    [key: string]: unknown;
};
export type JwtSessionRequestOptions = {
    /** Your app route that checks the HttpOnly session cookie. Defaults to /api/auth/session. */
    endpoint?: string;
};
export type JwtDisconnectResult = {
    success: boolean;
    walletDisconnected: boolean;
    status?: number;
    error?: string;
};
/** Ask the app server whether the current browser session is authenticated. */
export declare function jwt_verify(options?: JwtSessionRequestOptions): Promise<JwtSessionResult>;
/** @deprecated Use jwt_verify instead. */
export declare const jwt_confirm: typeof jwt_verify;
/** Ask the app server to revoke and clear the current HttpOnly session cookie. */
export declare function jwt_disconnect(options?: JwtSessionRequestOptions): Promise<JwtDisconnectResult>;
export declare const cordy: {
    configure: typeof configureCordyAssets;
    jwt_verify: typeof jwt_verify;
    jwt_confirm: typeof jwt_verify;
    jwt_disconnect: typeof jwt_disconnect;
    balance: typeof cordy_balance;
    transfer: typeof cordy_transfer;
    swap: typeof cordy_swap;
    bridge: typeof cordy_bridge;
};
//# sourceMappingURL=jwt.d.ts.map