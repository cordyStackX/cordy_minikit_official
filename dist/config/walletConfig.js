import { http, createConfig } from 'wagmi';
import { mainnet, base } from 'wagmi/chains';
import { walletConnect, metaMask, coinbaseWallet } from 'wagmi/connectors';
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
// Function to create config - only called on client side
export default function getConfig(chains = {}) {
    // Combine default chains with custom chains
    const allChains = [mainnet, base, ...Object.values(chains)];
    // Create transports dynamically for all chains
    const transports = allChains.reduce((acc, chain) => {
        acc[chain.id] = http();
        return acc;
    }, {});
    return createConfig({
        chains: allChains,
        connectors: [
            metaMask(),
            walletConnect({ projectId }),
            coinbaseWallet({
                appName: "cordy_minikit",
                version: "3"
            })
        ],
        transports,
    });
}
export const config = typeof window !== 'undefined'
    ? getConfig()
    : {};
