export type CreateCordyServerOptions = {
    signingSecret?: string;
    jwtKey?: string | Uint8Array;
    allowedDomains?: string[];
};
export type ConsResult = {
    success: true;
    address?: string;
    chain?: "evm" | "stellar";
    nonce?: string;
    transaction?: string;
    network_passphrase?: string;
    server_account?: string;
    home_domain?: string;
    web_auth_domain?: string;
    _setCookies?: string[];
} | {
    success: false;
    message?: string;
    address?: undefined;
    chain?: undefined;
    _setCookies?: string[];
};
export declare function createCordyServer(options: CreateCordyServerOptions): {
    handler: () => {
        GET: (request: Request, context: {
            params: Promise<{
                action: string;
            }>;
        }) => Promise<Response>;
        POST: (request: Request, context: {
            params: Promise<{
                action: string;
            }>;
        }) => Promise<Response>;
        PUT: (request: Request, context: {
            params: Promise<{
                action: string;
            }>;
        }) => Promise<Response>;
        PATCH: (request: Request, context: {
            params: Promise<{
                action: string;
            }>;
        }) => Promise<Response>;
        DELETE: (request: Request, context: {
            params: Promise<{
                action: string;
            }>;
        }) => Promise<Response>;
        OPTIONS: (request: Request, context: {
            params: Promise<{
                action: string;
            }>;
        }) => Promise<Response>;
        HEAD: (request: Request, context: {
            params: Promise<{
                action: string;
            }>;
        }) => Promise<Response>;
    };
    session: (request: Request) => Promise<ConsResult>;
    challenge: (request: Request) => Promise<ConsResult>;
    verify: (request: Request) => Promise<ConsResult>;
    disconnect: (request: Request) => Promise<ConsResult>;
};
//# sourceMappingURL=cons.d.ts.map