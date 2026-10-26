/** Public app configuration provided to ProvidersClientWrapper as JSON. */
export type EvmAssetConfig = {
    symbol: string;
    /** Defaults to the first configured EVM network when omitted. */
    chainId?: number;
    type?: "native" | "erc20";
    contractAddress?: string;
    decimals?: number;
    rpcUrl?: string;
};
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
    wrappedNativeTokenAddress?: string;
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
    networkPassphrase: string;
    /** Optional Soroban contract ID used by app-specific contract integrations. */
    contractId?: string;
};
export type CordyAssetsConfig = {
    walletConnectProjectId?: string;
    networks?: EvmNetworkConfig[];
    evm?: EvmAssetConfig[];
    stellarNetwork?: StellarNetworkConfig;
    stellar?: StellarAssetConfig[];
};
export declare function setCordyRuntimeConfig(config: CordyAssetsConfig): void;
export declare function getCordyRuntimeConfig(): CordyAssetsConfig | undefined;
export declare function isEvmConfigReady(): boolean;
export declare function isStellarConfigReady(): boolean;
//# sourceMappingURL=runtimeConfig.d.ts.map