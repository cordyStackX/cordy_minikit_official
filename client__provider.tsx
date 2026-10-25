'use client';
import { ReactNode, useEffect } from 'react';
import { configureCordyAssets, type CordyAssetsConfig } from './client/transfer';
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
  useEffect(() => {
    if (assets) configureCordyAssets({ assets });
  }, [assets]);

  return <WalletProviders>{children}</WalletProviders>;
}