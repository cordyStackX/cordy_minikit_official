"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { config } from "./config/walletConfig";
import { UI_Comp } from "./components";
import { getConsUrl } from "./client/consRuntime";
import { WatchWalletChanges } from "@stellar/freighter-api";
const WalletContext = createContext(null);
const StellarWalletContext = createContext(null);
const queryClient = new QueryClient();
const STELLAR_WALLET_STORAGE_KEY = "cordy_minikit_stellar_wallet";
const ACTIVE_WALLET_SESSION_KEY = "cordy_minikit_active_wallet_session";
const DEFAULT_CONS_PATH = "/services/cons";
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
export default function WalletProviders({ children, config: walletConfig = config, consPath = DEFAULT_CONS_PATH }) {
    const [open, setOpen] = useState(false);
    const [consSession, setConsSession] = useState(false);
    const [consSessionEnabled, setConsSessionEnabled] = useState(false);
    const [navigate, setNavigate] = useState();
    const [signedResult, setSignedResult] = useState();
    const [authError, setAuthError] = useState();
    const [stellarWallet, setStellarWallet] = useState(() => readStellarWallet());
    const clearStellarWallet = useCallback(() => {
        if (typeof window !== "undefined") {
            window.localStorage.removeItem(STELLAR_WALLET_STORAGE_KEY);
            window.localStorage.removeItem(ACTIVE_WALLET_SESSION_KEY);
        }
        setStellarWallet({ address: null, manuallyDisconnected: true });
    }, []);
    const openWalletModal = useCallback((options) => {
        setConsSession(options?.consSession ?? false);
        if (options?.consSession)
            setConsSessionEnabled(true);
        setNavigate(options?.navigate);
        setAuthError(undefined);
        setSignedResult(undefined);
        setOpen(true);
    }, []);
    const closeWalletModal = useCallback(() => {
        setOpen(false);
        setConsSession(false);
        setNavigate(undefined);
    }, []);
    useEffect(() => {
        const handleStellarDisconnect = () => {
            window.localStorage.removeItem(STELLAR_WALLET_STORAGE_KEY);
            window.localStorage.removeItem(ACTIVE_WALLET_SESSION_KEY);
            setStellarWallet({ address: null, manuallyDisconnected: true });
        };
        window.addEventListener("cordy:disconnect-stellar-wallet", handleStellarDisconnect);
        return () => window.removeEventListener("cordy:disconnect-stellar-wallet", handleStellarDisconnect);
    }, []);
    useEffect(() => {
        const handleSessionAuthenticated = () => setConsSessionEnabled(true);
        const handleSessionCleared = () => setConsSessionEnabled(false);
        window.addEventListener("cordy:cons-session-authenticated", handleSessionAuthenticated);
        window.addEventListener("cordy:cons-session-active", handleSessionAuthenticated);
        window.addEventListener("cordy:cons-session-cleared", handleSessionCleared);
        return () => {
            window.removeEventListener("cordy:cons-session-authenticated", handleSessionAuthenticated);
            window.removeEventListener("cordy:cons-session-active", handleSessionAuthenticated);
            window.removeEventListener("cordy:cons-session-cleared", handleSessionCleared);
        };
    }, []);
    useEffect(() => {
        if (typeof window === "undefined")
            return;
        if (!stellarWallet.address) {
            window.localStorage.removeItem(STELLAR_WALLET_STORAGE_KEY);
            return;
        }
        window.localStorage.setItem(STELLAR_WALLET_STORAGE_KEY, JSON.stringify(stellarWallet));
    }, [stellarWallet]);
    return (_jsx(WagmiProvider, { config: walletConfig, children: _jsx(QueryClientProvider, { client: queryClient, children: _jsx(WalletContext.Provider, { value: {
                    openModal: openWalletModal,
                    closeModal: closeWalletModal,
                    consSession,
                    consSessionEnabled,
                    consPath,
                    navigate,
                    signedResult,
                    setSignedResult,
                    authError,
                    setAuthError,
                }, children: _jsxs(StellarWalletContext.Provider, { value: {
                        stellarWallet,
                        setStellarWallet,
                        clearStellarWallet,
                    }, children: [children, open && _jsx(UI_Comp, {}), " ", _jsx(WalletSessionDisconnectWatcher, { consPath: consPath, enabled: consSessionEnabled })] }) }) }) }));
}
function WalletSessionDisconnectWatcher({ consPath, enabled }) {
    const { stellarWallet, clearStellarWallet } = useStellarWallet();
    const [authenticated, setAuthenticated] = useState(false);
    useEffect(() => {
        if (!enabled)
            return;
        let active = true;
        void fetch(getConsUrl("session", consPath), { credentials: "same-origin", cache: "no-store" })
            .then((response) => response.json())
            .then((body) => { if (active)
            setAuthenticated(body?.success === true); })
            .catch(() => { if (active)
            setAuthenticated(false); });
        const markAuthenticated = () => setAuthenticated(true);
        const markCleared = () => setAuthenticated(false);
        window.addEventListener("cordy:cons-session-authenticated", markAuthenticated);
        window.addEventListener("cordy:cons-session-cleared", markCleared);
        return () => {
            active = false;
            window.removeEventListener("cordy:cons-session-authenticated", markAuthenticated);
            window.removeEventListener("cordy:cons-session-cleared", markCleared);
        };
    }, [consPath, enabled]);
    useEffect(() => {
        if (!stellarWallet.address)
            return;
        const watcher = new WatchWalletChanges();
        watcher.watch(({ address, error }) => {
            if (error || address || !stellarWallet.address)
                return;
            clearStellarWallet();
        });
        return () => watcher.stop();
    }, [clearStellarWallet, stellarWallet.address]);
    return null;
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
