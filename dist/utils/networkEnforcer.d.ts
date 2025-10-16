export interface NetworkConfig {
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
 * by checking contract code existence across all supported networks
 */
export declare function detectContractNetwork(contractAddress: string): Promise<NetworkConfig | null>;
/**
 * Get network configuration by chain ID
 */
export declare function getNetworkByChainId(chainId: number): NetworkConfig | null;
/**
 * Check if a chain ID is supported
 */
export declare function isNetworkSupported(chainId: number): boolean;
/**
 * Add a custom network to the supported networks list
 * Useful for adding networks that aren't included by default
 */
export declare function addCustomNetwork(key: string, network: NetworkConfig): void;
/**
 * Add multiple custom networks at once
 */
export declare function addCustomNetworks(networks: Record<string, NetworkConfig>): void;
/**
 * Helper to create a network configuration
 */
export declare function createNetworkConfig(params: {
    chainId: number;
    chainName: string;
    symbol: string;
    symbolName?: string;
    rpcUrl: string;
    explorerUrl?: string;
}): NetworkConfig;
/**
 * Force switch to the required network
 * Throws error if user rejects
 */
export declare function enforceNetwork(requiredChainId: number, networkConfig: NetworkConfig): Promise<boolean>;
/**
 * Monitor network changes and enforce the correct network
 */
export declare function setupNetworkGuard(requiredChainId: number, networkConfig: NetworkConfig, onWrongNetwork?: () => void): () => void;
//# sourceMappingURL=networkEnforcer.d.ts.map