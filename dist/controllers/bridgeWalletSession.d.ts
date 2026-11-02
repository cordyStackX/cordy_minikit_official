import type { BridgeEvmWalletRequest } from "./useBridgeEvmWallet";
type PendingSession = {
    request: BridgeEvmWalletRequest;
    resolve: (address: string) => void;
    reject: (error: Error) => void;
};
export declare function subscribeBridgeWalletSession(listener: () => void): () => void;
export declare function getBridgeWalletSession(): PendingSession["request"] | undefined;
export declare function waitForBridgeEvmWallet(request: BridgeEvmWalletRequest): Promise<string>;
export declare function resolveBridgeWalletSession(address: string): void;
export declare function rejectBridgeWalletSession(message?: string): void;
export {};
//# sourceMappingURL=bridgeWalletSession.d.ts.map