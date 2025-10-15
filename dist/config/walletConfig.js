import { http, createConfig } from 'wagmi';
import { mainnet, base } from 'wagmi/chains';
import { walletConnect, metaMask, coinbaseWallet } from 'wagmi/connectors';
import { BaseSepolia } from "../chains";
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
// Function to create config - only called on client side
export function getConfig() {
    return createConfig({
        chains: [mainnet, base, BaseSepolia()],
        connectors: [
            metaMask(),
            walletConnect({ projectId }),
            coinbaseWallet({
                appName: "cordy_minikit",
                version: "3"
            })
        ],
        transports: {
            [mainnet.id]: http(),
            [base.id]: http(),
            [BaseSepolia().id]: http()
        },
    });
}
// Create config only on client side
export const config = typeof window !== 'undefined'
    ? getConfig()
    : {};
