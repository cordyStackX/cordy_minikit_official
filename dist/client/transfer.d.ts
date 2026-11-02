import type { CordyAssetsConfig } from "./runtimeConfig";
export type { CordyAssetsConfig, CordyBridgeConfig, CordyBridgeNetworkConfig, CordyBridgeRouteConfig, EvmAssetConfig, EvmAssetRegistry, EvmNetworkConfig, StellarAssetConfig, StellarNetworkConfig } from "./runtimeConfig";
export type CordyTransferOptions = {
    /** Asset symbol from the configured JSON registry. */
    asset?: string;
    memo?: string;
};
export type CordyTransferResult = {
    success: boolean;
    asset?: string;
    network?: "evm" | "stellar";
    transactionHash?: string;
    error?: string;
};
export type CordyBalanceOptions = {
    /** Asset symbol from the configured JSON registry. Defaults to the first configured EVM token or Stellar XLM. */
    asset?: string;
};
export type CordyBalanceResult = {
    success: boolean;
    network?: string;
    balance?: string;
    asset?: string;
    error?: string;
};
export type CordySwapResult = {
    success: boolean;
    network?: "evm" | "stellar";
    from?: string;
    to?: string;
    amountIn?: string;
    estimatedAmountOut?: string;
    version?: "v2" | "v3";
    feeTier?: number;
    transactionHash?: string;
    error?: string;
};
export type CordySwapOptions = {
    /** Select one router family or compare configured V2 and V3 quotes. Defaults to auto. */
    version?: "auto" | "v2" | "v3";
    /** Restrict this call's V3 quote search to these fee tiers. Defaults to the network's configured feeTiers. */
    feeTiers?: number[];
};
export type CordyBridgeSide = "internal" | "external";
export type CordyBridgeOptions = {
    /** Select a configured route. Required when assets.bridge.routes contains multiple routes. */
    routeId?: string;
};
export type CordyBridgeResult = {
    success: boolean;
    asset?: string;
    from?: CordyBridgeSide;
    to?: CordyBridgeSide;
    fromNetwork?: string;
    toNetwork?: string;
    routeId?: string;
    routeName?: string;
    amount?: string;
    approvalTransactionHash?: string;
    transactionHash?: string;
    status?: "submitted" | "pending";
    error?: string;
    errorDetail?: string;
    warning?: string;
};
export declare function configureCordyAssets({ assets }: {
    assets: CordyAssetsConfig;
}): void;
/** Bridge a configured ERC-20 asset between the configured internal and external EVM sides. */
export declare function cordy_bridge(amount: number | string, from: CordyBridgeSide, to: CordyBridgeSide, recipient: string, options?: CordyBridgeOptions): Promise<CordyBridgeResult>;
/** Read the full-precision balance for the active wallet and selected asset. */
export declare function cordy_balance(options?: CordyBalanceOptions): Promise<CordyBalanceResult>;
/** Swap two configured assets using the active EVM or Stellar wallet. */
export declare function cordy_swap(amount: number | string, from: string, to: string, tolerancePercent?: number, options?: CordySwapOptions): Promise<CordySwapResult>;
/** Configure a caller-owned JSON asset registry before requesting transfers. */
export declare function cordy_configure(options: {
    assets: CordyAssetsConfig;
}): void;
/** Send a selected JSON-configured asset using Minikit's active wallet. */
export declare function cordy_transfer(amount: number | string, recipient: string, options?: CordyTransferOptions): Promise<CordyTransferResult>;
//# sourceMappingURL=transfer.d.ts.map