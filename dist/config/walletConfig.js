import { http, createConfig } from 'wagmi';
import { mainnet, base, sepolia } from 'wagmi/chains';
import { walletConnect, metaMask, coinbaseWallet } from 'wagmi/connectors';
import { isEvmConfigReady } from '../client/runtimeConfig';
const configCache = new Map();
export default function getConfig(customChains = {}, options = {}) {
    const uniqueChains = [...Object.values(customChains), mainnet, base, sepolia]
        .filter((chain, index, chains) => chains.findIndex((candidate) => candidate.id === chain.id) === index);
    const [firstChain, ...otherChains] = uniqueChains;
    if (!firstChain)
        throw new Error('At least one EVM chain must be configured.');
    const allChains = [firstChain, ...otherChains];
    const cacheKey = JSON.stringify({
        walletConnectProjectId: options.walletConnectProjectId ?? null,
        chains: allChains.map(({ id, name, nativeCurrency, rpcUrls, blockExplorers }) => ({
            id,
            name,
            nativeCurrency,
            rpcUrls,
            blockExplorers,
        })),
    });
    const cachedConfig = configCache.get(cacheKey);
    if (cachedConfig)
        return cachedConfig;
    // Use the chain's RPC URL if available
    const transports = allChains.reduce((acc, chain) => {
        const rpcUrl = chain.rpcUrls?.default?.http?.[0];
        acc[chain.id] = rpcUrl ? http(rpcUrl) : http();
        return acc;
    }, {});
    const nextConfig = createConfig({
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
    configCache.set(cacheKey, nextConfig);
    return nextConfig;
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
