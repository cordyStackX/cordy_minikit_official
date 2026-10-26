import { http, createConfig } from 'wagmi';
import { mainnet, base, sepolia } from 'wagmi/chains';
import { walletConnect, metaMask, coinbaseWallet } from 'wagmi/connectors';
import { isEvmConfigReady } from '../client/runtimeConfig';
export default function getConfig(customChains = {}, options = {}) {
    const uniqueChains = [...Object.values(customChains), mainnet, base, sepolia]
        .filter((chain, index, chains) => chains.findIndex((candidate) => candidate.id === chain.id) === index);
    const [firstChain, ...otherChains] = uniqueChains;
    if (!firstChain)
        throw new Error('At least one EVM chain must be configured.');
    const allChains = [firstChain, ...otherChains];
    // Use the chain's RPC URL if available
    const transports = allChains.reduce((acc, chain) => {
        const rpcUrl = chain.rpcUrls?.default?.http?.[0];
        acc[chain.id] = rpcUrl ? http(rpcUrl) : http();
        return acc;
    }, {});
    return createConfig({
        chains: allChains,
        connectors: [
            metaMask(),
            ...(options.walletConnectProjectId ? [walletConnect({ projectId: options.walletConnectProjectId })] : []),
            coinbaseWallet({
                appName: "cordy_minikit",
            }),
        ],
        transports,
    });
}
export const config = typeof window !== "undefined"
    ? getConfig()
    : {};
let activeWagmiConfig = config;
export function setActiveWagmiConfig(nextConfig) {
    activeWagmiConfig = nextConfig;
}
export function getActiveWagmiConfig() {
    return activeWagmiConfig;
}
export function isEvmEnvironmentConfigured() {
    return isEvmConfigReady();
}
