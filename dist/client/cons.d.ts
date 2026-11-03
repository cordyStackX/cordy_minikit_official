import { configureCordyAssets, cordy_balance, cordy_bridge, cordy_swap, cordy_transfer } from "./transfer";
export type ConsVerifyResult = {
    success: boolean;
    authenticated: boolean;
    address?: string;
    chain?: "evm" | "stellar";
    message?: string;
};
export type ConsSessionResult = {
    loading: boolean;
    authenticated: boolean;
    address?: string;
    chain?: "evm" | "stellar";
};
export type ConsDisconnectResult = {
    success: boolean;
    walletDisconnected: boolean;
    error?: string;
};
export declare function cons_verify(): Promise<ConsVerifyResult>;
export declare function cons_disconnect(): Promise<ConsDisconnectResult>;
export declare const cordy: {
    configure: typeof configureCordyAssets;
    cons_verify: typeof cons_verify;
    cons_disconnect: typeof cons_disconnect;
    balance: typeof cordy_balance;
    transfer: typeof cordy_transfer;
    swap: typeof cordy_swap;
    bridge: typeof cordy_bridge;
};
//# sourceMappingURL=cons.d.ts.map