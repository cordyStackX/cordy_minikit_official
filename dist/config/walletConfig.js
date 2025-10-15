import { http, createConfig } from 'wagmi';
import { mainnet, base } from 'wagmi/chains';
import { walletConnect, metaMask, coinbaseWallet } from 'wagmi/connectors';
import { BaseSepolia } from "../chains";
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
export const config = createConfig({
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
