'use client';
import { ReactNode, useEffect, useMemo } from 'react';
import { configureCordyAssets, type CordyAssetsConfig } from './client/transfer';
import getConfig, { config as defaultConfig, setActiveWagmiConfig } from './config/walletConfig';
import { defineChain } from 'viem';
import dynamic from 'next/dynamic';

// Dynamically import WalletProviders with SSR disabled
const WalletProviders = dynamic(() => import('./wagmi__providers'), {
  ssr: false,
});

export default function ProvidersClientWrapper({
  children,
  assets,
}: {
  children: ReactNode;
  assets?: CordyAssetsConfig;
}) {
  const walletConfig = useMemo(() => {
    const networks = assets?.networks ?? [];
    if (networks.length === 0) return defaultConfig;
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
    return getConfig(customChains, { walletConnectProjectId: assets?.walletConnectProjectId });
  }, [assets?.networks, assets?.walletConnectProjectId]);

  useEffect(() => {
    if (assets) configureCordyAssets({ assets });
  }, [assets]);
  useEffect(() => setActiveWagmiConfig(walletConfig), [walletConfig]);

  return <WalletProviders config={walletConfig}>{children}</WalletProviders>;
}
