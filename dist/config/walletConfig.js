import { http, createConfig } from 'wagmi';
import { mainnet, base } from 'wagmi/chains';
import { walletConnect } from 'wagmi/connectors';
import { BaseSepolia } from "../chains";
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
export const config = createConfig({
    chains: [mainnet, base, BaseSepolia()],
    connectors: [
        walletConnect({ projectId })
    ],
    transports: {
        [mainnet.id]: http(),
        [base.id]: http(),
        [BaseSepolia().id]: http()
    },
});
