import { ethers } from "ethers";
// Supported networks - Add more as needed
export const NETWORKS = {
    // Ethereum Networks
    ETHEREUM_MAINNET: {
        chainId: 1,
        chainName: "Ethereum Mainnet",
        nativeCurrency: {
            name: "Ethereum",
            symbol: "ETH",
            decimals: 18,
        },
        rpcUrls: ["https://eth.llamarpc.com"],
        blockExplorerUrls: ["https://etherscan.io"],
    },
    ETHEREUM_SEPOLIA: {
        chainId: 11155111,
        chainName: "Sepolia Testnet",
        nativeCurrency: {
            name: "Ethereum",
            symbol: "ETH",
            decimals: 18,
        },
        rpcUrls: ["https://rpc.sepolia.org"],
        blockExplorerUrls: ["https://sepolia.etherscan.io"],
    },
    // Base Networks
    BASE_MAINNET: {
        chainId: 8453,
        chainName: "Base Mainnet",
        nativeCurrency: {
            name: "Ethereum",
            symbol: "ETH",
            decimals: 18,
        },
        rpcUrls: ["https://mainnet.base.org"],
        blockExplorerUrls: ["https://basescan.org"],
    },
    BASE_SEPOLIA: {
        chainId: 84532,
        chainName: "Base Sepolia",
        nativeCurrency: {
            name: "Ethereum",
            symbol: "ETH",
            decimals: 18,
        },
        rpcUrls: ["https://sepolia.base.org"],
        blockExplorerUrls: ["https://sepolia.basescan.org"],
    },
    // Core Networks
    CORE_MAINNET: {
        chainId: 1116,
        chainName: "Core Blockchain Mainnet",
        nativeCurrency: {
            name: "Core",
            symbol: "CORE",
            decimals: 18,
        },
        rpcUrls: ["https://rpc.coredao.org"],
        blockExplorerUrls: ["https://scan.coredao.org"],
    },
    CORE_TESTNET: {
        chainId: 1115,
        chainName: "Core Blockchain Testnet",
        nativeCurrency: {
            name: "tCore",
            symbol: "tCORE",
            decimals: 18,
        },
        rpcUrls: ["https://rpc.test.btcs.network"],
        blockExplorerUrls: ["https://scan.test.btcs.network"],
    },
    // Polygon Networks
    POLYGON_MAINNET: {
        chainId: 137,
        chainName: "Polygon Mainnet",
        nativeCurrency: {
            name: "MATIC",
            symbol: "MATIC",
            decimals: 18,
        },
        rpcUrls: ["https://polygon-rpc.com"],
        blockExplorerUrls: ["https://polygonscan.com"],
    },
    POLYGON_AMOY: {
        chainId: 80002,
        chainName: "Polygon Amoy Testnet",
        nativeCurrency: {
            name: "MATIC",
            symbol: "MATIC",
            decimals: 18,
        },
        rpcUrls: ["https://rpc-amoy.polygon.technology"],
        blockExplorerUrls: ["https://amoy.polygonscan.com"],
    },
    // Arbitrum Networks
    ARBITRUM_ONE: {
        chainId: 42161,
        chainName: "Arbitrum One",
        nativeCurrency: {
            name: "Ethereum",
            symbol: "ETH",
            decimals: 18,
        },
        rpcUrls: ["https://arb1.arbitrum.io/rpc"],
        blockExplorerUrls: ["https://arbiscan.io"],
    },
    ARBITRUM_SEPOLIA: {
        chainId: 421614,
        chainName: "Arbitrum Sepolia",
        nativeCurrency: {
            name: "Ethereum",
            symbol: "ETH",
            decimals: 18,
        },
        rpcUrls: ["https://sepolia-rollup.arbitrum.io/rpc"],
        blockExplorerUrls: ["https://sepolia.arbiscan.io"],
    },
    // Optimism Networks
    OPTIMISM_MAINNET: {
        chainId: 10,
        chainName: "Optimism Mainnet",
        nativeCurrency: {
            name: "Ethereum",
            symbol: "ETH",
            decimals: 18,
        },
        rpcUrls: ["https://mainnet.optimism.io"],
        blockExplorerUrls: ["https://optimistic.etherscan.io"],
    },
    OPTIMISM_SEPOLIA: {
        chainId: 11155420,
        chainName: "Optimism Sepolia",
        nativeCurrency: {
            name: "Ethereum",
            symbol: "ETH",
            decimals: 18,
        },
        rpcUrls: ["https://sepolia.optimism.io"],
        blockExplorerUrls: ["https://sepolia-optimism.etherscan.io"],
    },
    // Avalanche Networks
    AVALANCHE_C_CHAIN: {
        chainId: 43114,
        chainName: "Avalanche C-Chain",
        nativeCurrency: {
            name: "Avalanche",
            symbol: "AVAX",
            decimals: 18,
        },
        rpcUrls: ["https://api.avax.network/ext/bc/C/rpc"],
        blockExplorerUrls: ["https://snowtrace.io"],
    },
    AVALANCHE_FUJI: {
        chainId: 43113,
        chainName: "Avalanche Fuji Testnet",
        nativeCurrency: {
            name: "Avalanche",
            symbol: "AVAX",
            decimals: 18,
        },
        rpcUrls: ["https://api.avax-test.network/ext/bc/C/rpc"],
        blockExplorerUrls: ["https://testnet.snowtrace.io"],
    },
    // BNB Chain Networks
    BNB_SMART_CHAIN: {
        chainId: 56,
        chainName: "BNB Smart Chain",
        nativeCurrency: {
            name: "BNB",
            symbol: "BNB",
            decimals: 18,
        },
        rpcUrls: ["https://bsc-dataseed.binance.org"],
        blockExplorerUrls: ["https://bscscan.com"],
    },
    BNB_TESTNET: {
        chainId: 97,
        chainName: "BNB Smart Chain Testnet",
        nativeCurrency: {
            name: "BNB",
            symbol: "tBNB",
            decimals: 18,
        },
        rpcUrls: ["https://data-seed-prebsc-1-s1.binance.org:8545"],
        blockExplorerUrls: ["https://testnet.bscscan.com"],
    },
};
/**
 * Detect which network the contract is deployed on
 * by checking contract code existence across all supported networks
 */
export async function detectContractNetwork(contractAddress) {
    console.log(`🔍 Scanning ${Object.keys(NETWORKS).length} networks for contract...`);
    for (const [networkKey, network] of Object.entries(NETWORKS)) {
        try {
            const provider = new ethers.JsonRpcProvider(network.rpcUrls[0]);
            const code = await provider.getCode(contractAddress);
            if (code !== "0x") {
                console.log(`✅ Contract found on ${network.chainName} (Chain ID: ${network.chainId})`);
                return network;
            }
        }
        catch (err) {
            console.log(`⚠️ Could not check ${network.chainName}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    }
    console.error(`❌ Contract not found on any supported network`);
    console.log(`📋 Supported networks: ${Object.values(NETWORKS).map(n => n.chainName).join(', ')}`);
    return null;
}
/**
 * Get network configuration by chain ID
 */
export function getNetworkByChainId(chainId) {
    for (const network of Object.values(NETWORKS)) {
        if (network.chainId === chainId) {
            return network;
        }
    }
    return null;
}
/**
 * Check if a chain ID is supported
 */
export function isNetworkSupported(chainId) {
    return getNetworkByChainId(chainId) !== null;
}
/**
 * Force switch to the required network
 * Throws error if user rejects
 */
export async function enforceNetwork(requiredChainId, networkConfig) {
    if (!window.ethereum) {
        throw new Error("No wallet detected");
    }
    try {
        // Try to switch to the network
        await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: ethers.toBeHex(requiredChainId) }],
        });
        console.log(`✅ Switched to ${networkConfig.chainName}`);
        return true;
    }
    catch (switchError) {
        // Network not added to wallet, try to add it
        if (switchError.code === 4902) {
            try {
                await window.ethereum.request({
                    method: "wallet_addEthereumChain",
                    params: [
                        {
                            chainId: ethers.toBeHex(requiredChainId),
                            chainName: networkConfig.chainName,
                            nativeCurrency: networkConfig.nativeCurrency,
                            rpcUrls: networkConfig.rpcUrls,
                            blockExplorerUrls: networkConfig.blockExplorerUrls,
                        },
                    ],
                });
                console.log(`✅ Added and switched to ${networkConfig.chainName}`);
                return true;
            }
            catch (addError) {
                console.error("❌ Failed to add network:", addError);
                throw new Error(`Failed to add ${networkConfig.chainName} to wallet`);
            }
        }
        else if (switchError.code === 4001) {
            // User rejected the request
            throw new Error("Network switch rejected by user");
        }
        else {
            console.error("❌ Network switch failed:", switchError);
            throw new Error("Failed to switch network");
        }
    }
}
/**
 * Monitor network changes and enforce the correct network
 */
export function setupNetworkGuard(requiredChainId, networkConfig, onWrongNetwork) {
    if (!window.ethereum) {
        console.warn("No wallet detected for network guard");
        return () => { };
    }
    const handleChainChanged = async (chainIdHex) => {
        const currentChainId = parseInt(chainIdHex, 16);
        if (currentChainId !== requiredChainId) {
            console.warn(`⚠️ Wrong network detected (Chain ID: ${currentChainId}). Enforcing ${networkConfig.chainName}...`);
            if (onWrongNetwork) {
                onWrongNetwork();
            }
            try {
                await enforceNetwork(requiredChainId, networkConfig);
            }
            catch (err) {
                console.error("❌ Failed to enforce network:", err);
            }
        }
    };
    // Listen for network changes
    window.ethereum.on("chainChanged", handleChainChanged);
    // Cleanup function
    return () => {
        window.ethereum?.removeListener("chainChanged", handleChainChanged);
    };
}
