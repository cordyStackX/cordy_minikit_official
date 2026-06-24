"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { config } from "./config/walletConfig";
import { UI_Comp } from "./components";
const WalletContext = createContext(null);
const StellarWalletContext = createContext(null);
const queryClient = new QueryClient();
const STELLAR_WALLET_STORAGE_KEY = "cordy_minikit_stellar_wallet";
const ACTIVE_WALLET_SESSION_KEY = "cordy_minikit_active_wallet_session";
function readStellarWallet() {
    if (typeof window === "undefined") {
        return { address: null };
    }
    try {
        const raw = window.localStorage.getItem(STELLAR_WALLET_STORAGE_KEY);
        if (!raw)
            return { address: null };
        const parsed = JSON.parse(raw);
        return {
            address: parsed.address ?? null,
            network: parsed.network,
            balance: parsed.balance,
            manuallyDisconnected: parsed.manuallyDisconnected,
        };
    }
    catch {
        return { address: null };
    }
}
export default function WalletProviders({ children }) {
    const [open, setOpen] = useState(false);
    const [stellarWallet, setStellarWallet] = useState(() => readStellarWallet());
    useEffect(() => {
        if (typeof window === "undefined")
            return;
        if (!stellarWallet.address) {
            window.localStorage.removeItem(STELLAR_WALLET_STORAGE_KEY);
            return;
        }
        window.localStorage.setItem(STELLAR_WALLET_STORAGE_KEY, JSON.stringify(stellarWallet));
    }, [stellarWallet]);
    return (_jsx(WagmiProvider, { config: config, children: _jsx(QueryClientProvider, { client: queryClient, children: _jsx(WalletContext.Provider, { value: {
                    openModal: () => setOpen(true),
                    closeModal: () => setOpen(false),
                }, children: _jsxs(StellarWalletContext.Provider, { value: {
                        stellarWallet,
                        setStellarWallet,
                        clearStellarWallet: () => {
                            if (typeof window !== "undefined") {
                                window.localStorage.removeItem(STELLAR_WALLET_STORAGE_KEY);
                                window.localStorage.removeItem(ACTIVE_WALLET_SESSION_KEY);
                            }
                            setStellarWallet({ address: null, manuallyDisconnected: true });
                        },
                    }, children: [children, open && _jsx(UI_Comp, {}), " "] }) }) }) }));
}
export function useWalletModal() {
    const ctx = useContext(WalletContext);
    if (!ctx)
        throw new Error("Wrap in <WalletProviders>");
    return ctx;
}
export function useStellarWallet() {
    const ctx = useContext(StellarWalletContext);
    if (!ctx)
        throw new Error("Wrap in <WalletProviders>");
    return ctx;
}
