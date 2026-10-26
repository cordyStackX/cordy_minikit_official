import { type Provider } from "ethers";
export type TokenBalanceOptions = {
    tokenAddress?: string;
    rpcUrl?: string;
    provider?: Provider;
    fallbackProvider?: Provider;
    expectedChainId?: number;
    networkName?: string;
    symbol?: string;
    decimals?: number;
};
export type TokenBalanceResult = {
    balance: string;
    rawBalance: string;
    symbol: string;
    decimals: number;
    network: string;
    chainId: number;
};
/** Shared ERC-20 balance reader used by wallet status and the Cordy API. */
export declare function readTokenBalance(address: string, options?: TokenBalanceOptions): Promise<TokenBalanceResult>;
/** Legacy controller API kept for existing `useWalletStatus` and button callers. */
export default function getTokenBalance(address: string, decimals?: number): Promise<{
    balance: string;
    symbol: string;
}>;
//# sourceMappingURL=Get_Balance.d.ts.map