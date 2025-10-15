'use client';
import { ReactNode } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import WalletProviders with SSR disabled
const WalletProviders = dynamic(() => import('./wagmi__providers'), {
  ssr: false,
});

export default function ProvidersClientWrapper({ children }: { children: ReactNode }) {
  return <WalletProviders>{children}</WalletProviders>;
}