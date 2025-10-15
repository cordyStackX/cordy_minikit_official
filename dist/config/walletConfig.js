import { http, createConfig } from 'wagmi';
import { mainnet, base } from 'wagmi/chains';
import { walletConnect, metaMask, coinbaseWallet } from 'wagmi/connectors';
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
export default function getConfig(customChains = {}) {
    const allChains = [mainnet, base, ...Object.values(customChains)];
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
                version: "3",
            }),
        ],
        transports,
    });
}
export const config = typeof window !== "undefined"
    ? getConfig()
    : {};
