interface NetworkConfig {
    chainId: number;
    chainName: string;
    nativeCurrency: {
        name: string;
        symbol: string;
        decimals: number;
    };
    rpcUrls: string[];
    blockExplorerUrls?: string[];
}
export declare const NETWORKS: Record<string, NetworkConfig>;
/**
 * Detect which network the contract is deployed on
 * by checking contract code existence
 */
export declare function detectContractNetwork(contractAddress: string): Promise<NetworkConfig | null>;
/**
 * Force switch to the required network
 * Throws error if user rejects
 */
export declare function enforceNetwork(requiredChainId: number, networkConfig: NetworkConfig): Promise<boolean>;
/**
 * Monitor network changes and enforce the correct network
 */
export declare function setupNetworkGuard(requiredChainId: number, networkConfig: NetworkConfig, onWrongNetwork?: () => void): () => void;
export {};
//# sourceMappingURL=networkEnforcer.d.ts.map