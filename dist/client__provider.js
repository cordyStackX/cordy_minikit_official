'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect } from 'react';
import { configureCordyAssets } from './client/transfer';
import dynamic from 'next/dynamic';
// Dynamically import WalletProviders with SSR disabled
const WalletProviders = dynamic(() => import('./wagmi__providers'), {
    ssr: false,
});
export default function ProvidersClientWrapper({ children, assets, }) {
    useEffect(() => {
        if (assets)
            configureCordyAssets({ assets });
    }, [assets]);
    return _jsx(WalletProviders, { children: children });
}
