'use client';
import { ReactNode } from 'react';
import dynamic from 'next/dynamic';
import type { Config } from 'wagmi';

// Dynamically import WalletProviders with SSR disabled
const WalletProviders = dynamic(() => import('./wagmi__providers'), {
  ssr: false,
});

export default function ProvidersClientWrapper({ 
  children,
  config 
}: { 
  children: ReactNode;
  config?: Config;
}) {
  return <WalletProviders config={config}>{children}</WalletProviders>;
}