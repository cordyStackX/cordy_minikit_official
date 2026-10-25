export type EvmAssetConfig = {
    symbol: string;
    chainId: number;
    contractAddress: string;
    decimals?: number;
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
export declare function configureCordyAssets({ assets }: {
    assets: CordyAssetsConfig;
}): void;
/** Configure a caller-owned JSON asset registry before requesting transfers. */
export declare function cordy_configure(options: {
    assets: CordyAssetsConfig;
}): void;
/** Send a selected JSON-configured asset using Minikit's active wallet. */
export declare function cordy_transfer(amount: number | string, recipient: string, options?: CordyTransferOptions): Promise<CordyTransferResult>;
//# sourceMappingURL=transfer.d.ts.map