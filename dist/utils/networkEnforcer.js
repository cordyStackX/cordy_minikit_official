import { ethers } from "ethers";
// Supported networks
export const NETWORKS = {
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
};
/**
 * Detect which network the contract is deployed on
 * by checking contract code existence
 */
export async function detectContractNetwork(contractAddress) {
    for (const network of Object.values(NETWORKS)) {
        try {
            const provider = new ethers.JsonRpcProvider(network.rpcUrls[0]);
            const code = await provider.getCode(contractAddress);
            if (code !== "0x") {
                console.log(`✅ Contract found on ${network.chainName}`);
                return network;
            }
        }
        catch (err) {
            console.log(`⚠️ Could not check ${network.chainName}`);
        }
    }
    return null;
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
