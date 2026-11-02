export type BridgeEvmWalletRequest = {
    routeId: string;
    amount: string;
    from: "internal" | "external";
    to: "internal" | "external";
    recipient: string;
    sourceChainId?: number;
    sourceNetworkType: "evm" | "stellar";
    destinationNetworkType: "evm" | "stellar";
};
export type UseBridgeEvmWalletOptions = {
    onResume: (request: BridgeEvmWalletRequest, address: string) => Promise<void> | void;
    onCancel?: () => void;
    onError?: (error: string) => void;
};
export declare function bridgeRequestNeedsEvmWallet(request: BridgeEvmWalletRequest): boolean;
export declare function useBridgeEvmWallet({ onResume, onCancel, onError }: UseBridgeEvmWalletOptions): {
    open: boolean;
    request: (nextRequest: BridgeEvmWalletRequest) => boolean;
    handleConnected: (connectedAddress?: string) => void;
    cancel: () => void;
};
//# sourceMappingURL=useBridgeEvmWallet.d.ts.map