"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useContext, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { config as defaultConfig } from "./config/walletConfig";
import { UI_Comp } from "./components";
const WalletContext = createContext(null);
const queryClient = new QueryClient();
export default function WalletProviders({ children, config }) {
    const [open, setOpen] = useState(false);
    return (_jsx(WagmiProvider, { config: config || defaultConfig, children: _jsx(QueryClientProvider, { client: queryClient, children: _jsxs(WalletContext.Provider, { value: {
                    openModal: () => setOpen(true),
                    closeModal: () => setOpen(false),
                }, children: [children, open && _jsx(UI_Comp, {}), " "] }) }) }));
}
export function useWalletModal() {
    const ctx = useContext(WalletContext);
    if (!ctx)
        throw new Error("Wrap in <WalletProviders>");
    return ctx;
}
