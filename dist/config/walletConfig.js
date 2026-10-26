import { http, createConfig } from 'wagmi';
import { mainnet, base } from 'wagmi/chains';
import { walletConnect, metaMask, coinbaseWallet } from 'wagmi/connectors';
import { defineChain } from 'viem';
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
const hasConfiguredEvmEnvironment = Boolean(process.env.NEXT_PUBLIC_RPC_ENDPOINT &&
    process.env.NEXT_PUBLIC_CHAIN_ID &&
    process.env.NEXT_PUBLIC_TOKENADDRESS);
const configuredChainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || mainnet.id);
if (!Number.isSafeInteger(configuredChainId) || configuredChainId <= 0) {
    throw new Error('NEXT_PUBLIC_CHAIN_ID must be a positive integer.');
}
const configuredRpcEndpoint = process.env.NEXT_PUBLIC_RPC_ENDPOINT
    || mainnet.rpcUrls.default.http[0];
const configuredChain = defineChain({
    id: configuredChainId,
    name: process.env.NEXT_PUBLIC_CHAIN_NAME || mainnet.name,
    nativeCurrency: process.env.NEXT_PUBLIC_CHAIN_ID
        ? { name: 'Configured native token', symbol: 'NATIVE', decimals: 18 }
        : mainnet.nativeCurrency,
    rpcUrls: {
        default: { http: [configuredRpcEndpoint] },
    },
    blockExplorers: {
        default: {
            name: process.env.NEXT_PUBLIC_CHAIN_NAME ? `${process.env.NEXT_PUBLIC_CHAIN_NAME} Explorer` : mainnet.blockExplorers.default.name,
            url: process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL || mainnet.blockExplorers.default.url,
        },
    },
});
export default function getConfig(customChains = {}) {
    const uniqueChains = [...Object.values(customChains), configuredChain, mainnet, base]
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
            walletConnect({ projectId }),
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
    return hasConfiguredEvmEnvironment;
}
