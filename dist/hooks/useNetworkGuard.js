"use client";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { detectContractNetwork, enforceNetwork, setupNetworkGuard } from "../utils/networkEnforcer";
export function useNetworkGuard(options = {}) {
    const { enabled = true, onWrongNetwork } = options;
    const { isConnected, chainId } = useAccount();
    const [isEnforcing, setIsEnforcing] = useState(false);
    const [requiredChainId, setRequiredChainId] = useState(null);
    useEffect(() => {
        if (!enabled || !isConnected)
            return;
        const tokenAddress = process.env.NEXT_PUBLIC_TOKENADDRESS;
        if (!tokenAddress)
            return;
        // Detect the required network
        detectContractNetwork(tokenAddress).then((network) => {
            if (network) {
                setRequiredChainId(network.chainId);
                // Set up continuous network monitoring
                const cleanup = setupNetworkGuard(network.chainId, network, () => {
                    setIsEnforcing(true);
                    if (onWrongNetwork) {
                        onWrongNetwork();
                    }
                    setTimeout(() => setIsEnforcing(false), 2000);
                });
                // Check current network on mount
                if (chainId && chainId !== network.chainId) {
                    console.warn("⚠️ Wrong network on mount, enforcing correct network...");
                    setIsEnforcing(true);
                    enforceNetwork(network.chainId, network)
                        .catch((err) => {
                        console.error("❌ Failed to enforce network:", err);
                    })
                        .finally(() => {
                        setIsEnforcing(false);
                    });
                }
                return cleanup;
            }
        });
    }, [enabled, isConnected, chainId, onWrongNetwork]);
    return {
        isEnforcing,
        requiredChainId,
        isCorrectNetwork: requiredChainId ? chainId === requiredChainId : true,
    };
}
