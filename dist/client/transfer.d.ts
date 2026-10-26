export type EvmAssetConfig = {
    symbol: string;
    chainId: number;
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
/** JSON registry supplied by the application developer. */
export type CordyAssetsConfig = {
    networks?: EvmNetworkConfig[];
    evm?: EvmAssetConfig[];
    stellar?: StellarAssetConfig[];
};
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
    /** Asset symbol from the configured JSON registry. Defaults to the EVM env token or Stellar XLM. */
    asset?: string;
};
export type CordyBalanceResult = {
    success: boolean;
    network?: string;
    balance?: string;
    asset?: string;
    error?: string;
};
export declare function configureCordyAssets({ assets }: {
    assets: CordyAssetsConfig;
}): void;
/** Read the full-precision balance for the active wallet and selected asset. */
export declare function cordy_balance(options?: CordyBalanceOptions): Promise<CordyBalanceResult>;
/** Configure a caller-owned JSON asset registry before requesting transfers. */
export declare function cordy_configure(options: {
    assets: CordyAssetsConfig;
}): void;
/** Send a selected JSON-configured asset using Minikit's active wallet. */
export declare function cordy_transfer(amount: number | string, recipient: string, options?: CordyTransferOptions): Promise<CordyTransferResult>;
//# sourceMappingURL=transfer.d.ts.map