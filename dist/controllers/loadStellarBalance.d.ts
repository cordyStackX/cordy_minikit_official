export declare function isStellarEnvironmentConfigured(): boolean;
export type StellarBalanceAsset = {
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
export type StellarBalanceOptions = {
    assetSymbol?: string;
    asset?: StellarBalanceAsset;
    assets?: StellarBalanceAsset[];
    horizonUrl?: string;
    networkPassphrase?: string;
};
export type StellarBalanceResult = {
    address: string;
    network: string;
    networkPassphrase: string;
    balance: string;
    asset: string;
};
/** Shared Stellar account balance reader for wallet status and Cordy APIs. */
export default function loadStellarBalance(accountId: string, options?: StellarBalanceOptions): Promise<StellarBalanceResult>;
//# sourceMappingURL=loadStellarBalance.d.ts.map