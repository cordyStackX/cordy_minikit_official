import { configureCordyAssets, cordy_balance, cordy_bridge, cordy_swap, cordy_transfer } from "./transfer";
export type ConsVerifyResult = {
    /** Application-level status; no HTTP request is made. */
    status: 200 | 401;
    connected: boolean;
    network?: "evm" | "stellar";
    address?: string;
};
/** @deprecated Use JwtVerifyResult; this describes wallet state, not a JWT session. */
export type ConsSessionResult = ConsVerifyResult;
export type ConsDisconnectResult = {
    success: boolean;
    walletDisconnected: boolean;
    error?: string;
};
/** Check whether this browser currently has a connected EVM or Stellar wallet. */
export declare function cons_verify(): Promise<ConsVerifyResult>;
/** Disconnect the connected EVM wallet and clear the Minikit Stellar wallet selection. */
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
//# sourceMappingURL=jwt.d.ts.map