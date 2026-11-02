/** Public app configuration provided to ProvidersClientWrapper as JSON. */
export type EvmAssetConfig = {
    symbol: string;
    type?: "native" | "erc20";
    contractAddress?: string;
    decimals?: number;
    rpcUrl?: string;
};
export type EvmAssetRegistry = Record<string, EvmAssetConfig[]>;
export type EvmNetworkConfig = {
    chainId: number;
    name: string;
    nativeCurrency: {
        name: string;
        symbol: string;
        decimals: number;
    };
    rpcUrl: string;
    blockExplorerUrl?: string;
    swapRouterAddress?: string;
    /** Optional Uniswap V3-compatible deployment for this chain. */
    swapV3?: {
        routerAddress: string;
        quoterAddress: string;
        feeTiers?: number[];
        /** Defaults to the original Uniswap SwapRouter tuple with a deadline. */
        routerType?: "swapRouter" | "swapRouter02";
    };
    wrappedNativeTokenAddress?: string;
};
export type CordyBridgeNetworkConfig = {
    networkType: "evm" | "stellar";
    chainId?: number;
    domain?: number;
    networkName: string;
    bridgeAddress?: string;
    tokenAddress?: string;
    assetSymbol: string;
    tokenMessenger?: string;
    messageTransmitter?: string;
    tokenMessengerMinter?: string;
    cctpForwarder?: string;
    tokenIssuer?: string;
    /** Optional strict minimum: the bridge rejects amounts less than or equal to this value. */
    minimumAmountExclusive?: string;
    stellarMemo?: string;
};
export type CordyBridgeConfig = {
    /** Available bridge routes. Configure each supported pair as a separate route. */
    routes?: CordyBridgeRouteConfig[];
    /** Legacy single-route fields; new configurations should use routes. */
    resourceId?: string;
    internal?: CordyBridgeNetworkConfig;
    external?: CordyBridgeNetworkConfig;
};
export type CordyBridgeRouteConfig = {
    id: string;
    name: string;
    protocol?: "custom" | "cctp";
    /** Shared bytes32 resource identifier registered by the bridge validators. */
    resourceId?: string;
    internal: CordyBridgeNetworkConfig;
    external: CordyBridgeNetworkConfig;
};
export type StellarAssetConfig = {
    symbol: string;
    type: "native";
    networkPassphrase?: string;
} | {
    symbol: string;
    type: "credit";
    code: string;
    issuer: string;
    networkPassphrase?: string;
};
export type StellarNetworkConfig = {
    horizonUrl: string;
    sorobanRpcUrl?: string;
    networkPassphrase: string;
    /** Optional Soroban contract ID used by app-specific contract integrations. */
    contractId?: string;
};
export type CordyAssetsConfig = {
    walletConnectProjectId?: string;
    networks?: EvmNetworkConfig[];
    /** EVM assets grouped by their network chain ID. */
    evm?: EvmAssetRegistry;
    bridge?: CordyBridgeConfig;
    stellarNetwork?: StellarNetworkConfig;
    stellar?: StellarAssetConfig[];
};
export declare function setCordyRuntimeConfig(config: CordyAssetsConfig): void;
export declare function getCordyRuntimeConfig(): CordyAssetsConfig | undefined;
export declare function isEvmConfigReady(): boolean;
export declare function getConfiguredEvmAssets(assets: CordyAssetsConfig | undefined): Array<EvmAssetConfig & {
    chainId: number;
}>;
export declare function requireConfiguredEvmNetwork(assets: CordyAssetsConfig | undefined, chainId: number, networkName: string): EvmNetworkConfig;
export declare function isStellarConfigReady(): boolean;
//# sourceMappingURL=runtimeConfig.d.ts.map