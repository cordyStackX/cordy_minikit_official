'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import dynamic from 'next/dynamic';
// Dynamically import WalletProviders with SSR disabled
const WalletProviders = dynamic(() => import('./wagmi__providers'), {
    ssr: false,
});
export default function ProvidersClientWrapper({ children, config }) {
    return _jsx(WalletProviders, { config: config, children: children });
}
