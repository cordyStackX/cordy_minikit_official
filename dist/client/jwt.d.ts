import { configureCordyAssets, cordy_transfer } from "./transfer";
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
export declare function jwt_confirm(options?: JwtSessionRequestOptions): Promise<JwtSessionResult>;
/** Ask the app server to revoke and clear the current HttpOnly session cookie. */
export declare function jwt_disconnect(options?: JwtSessionRequestOptions): Promise<JwtDisconnectResult>;
export declare const cordy: {
    configure: typeof configureCordyAssets;
    jwt_confirm: typeof jwt_confirm;
    jwt_disconnect: typeof jwt_disconnect;
    transfer: typeof cordy_transfer;
};
//# sourceMappingURL=jwt.d.ts.map