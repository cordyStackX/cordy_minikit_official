'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useMemo } from 'react';
import { configureCordyAssets } from './client/transfer';
import getConfig, { config as defaultConfig, setActiveWagmiConfig } from './config/walletConfig';
import { defineChain } from 'viem';
import dynamic from 'next/dynamic';
// Dynamically import WalletProviders with SSR disabled
const WalletProviders = dynamic(() => import('./wagmi__providers'), {
    ssr: false,
});
export default function ProvidersClientWrapper({ children, assets, }) {
    const walletConfig = useMemo(() => {
        const networks = assets?.networks ?? [];
        if (networks.length === 0)
            return defaultConfig;
        const customChains = Object.fromEntries(networks.map((network) => [
            String(network.chainId),
            defineChain({
                id: network.chainId,
                name: network.name,
                nativeCurrency: network.nativeCurrency,
                rpcUrls: { default: { http: [network.rpcUrl] } },
                ...(network.blockExplorerUrl
                    ? { blockExplorers: { default: { name: `${network.name} Explorer`, url: network.blockExplorerUrl } } }
                    : {}),
            }),
        ]));
        return getConfig(customChains);
    }, [assets?.networks]);
    useEffect(() => {
        if (assets)
            configureCordyAssets({ assets });
    }, [assets]);
    useEffect(() => setActiveWagmiConfig(walletConfig), [walletConfig]);
    return _jsx(WalletProviders, { config: walletConfig, children: children });
}
