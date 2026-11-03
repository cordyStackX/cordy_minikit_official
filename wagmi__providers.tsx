"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode, Dispatch, SetStateAction } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, useAccount, type Config } from "wagmi";
import { config } from "./config/walletConfig";
import { UI_Comp } from "./components";
import type { ConsSignedResult } from "./client/authTypes";
import { getConsUrl, requestConsDisconnect } from "./client/consRuntime";
import { WatchWalletChanges } from "@stellar/freighter-api";

type WalletContextType = {
  openModal: (options?: { consSession?: boolean; navigate?: string }) => void;
  closeModal: () => void;
  consSession: boolean;
  consSessionEnabled: boolean;
  consPath: string;
  navigate?: string;
  signedResult?: ConsSignedResult;
  setSignedResult: Dispatch<SetStateAction<ConsSignedResult | undefined>>;
  authError?: string;
  setAuthError: Dispatch<SetStateAction<string | undefined>>;
};

type StellarWalletState = {
  address: string | null;
  network?: string;
  balance?: string;
  manuallyDisconnected?: boolean;
};

const WalletContext = createContext<WalletContextType | null>(null);
const StellarWalletContext = createContext<{
  stellarWallet: StellarWalletState;
  setStellarWallet: Dispatch<SetStateAction<StellarWalletState>>;
  clearStellarWallet: () => void;
} | null>(null);

const queryClient = new QueryClient();
const STELLAR_WALLET_STORAGE_KEY = "cordy_minikit_stellar_wallet";
const ACTIVE_WALLET_SESSION_KEY = "cordy_minikit_active_wallet_session";
const DEFAULT_CONS_PATH = "/services/cons";

function readStellarWallet(): StellarWalletState {
  if (typeof window === "undefined") {
    return { address: null };
  }

  try {
    const raw = window.localStorage.getItem(STELLAR_WALLET_STORAGE_KEY);
    if (!raw) return { address: null };

    const parsed = JSON.parse(raw) as StellarWalletState;
    return {
      address: parsed.address ?? null,
      network: parsed.network,
      balance: parsed.balance,
      manuallyDisconnected: parsed.manuallyDisconnected,
    };
  } catch {
    return { address: null };
  }
}

export default function WalletProviders({ children, config: walletConfig = config, consPath = DEFAULT_CONS_PATH }: { children: ReactNode; config?: Config; consPath?: string }) {
  const [open, setOpen] = useState(false);
  const [consSession, setConsSession] = useState(false);
  const [consSessionEnabled, setConsSessionEnabled] = useState(false);
  const [navigate, setNavigate] = useState<string | undefined>();
  const [signedResult, setSignedResult] = useState<ConsSignedResult | undefined>();
  const [authError, setAuthError] = useState<string | undefined>();
  const [stellarWallet, setStellarWallet] = useState<StellarWalletState>(() => readStellarWallet());
  const clearStellarWallet = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STELLAR_WALLET_STORAGE_KEY);
      window.localStorage.removeItem(ACTIVE_WALLET_SESSION_KEY);
    }
    setStellarWallet({ address: null, manuallyDisconnected: true });
  }, []);
  const openWalletModal = useCallback((options?: { consSession?: boolean; navigate?: string }) => {
    setConsSession(options?.consSession ?? false);
    if (options?.consSession) setConsSessionEnabled(true);
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
    if (typeof window === "undefined") return;

    if (!stellarWallet.address) {
      window.localStorage.removeItem(STELLAR_WALLET_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(STELLAR_WALLET_STORAGE_KEY, JSON.stringify(stellarWallet));
  }, [stellarWallet]);

  return (
    <WagmiProvider config={walletConfig}>
      <QueryClientProvider client={queryClient}>
        <WalletContext.Provider
          value={{
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
          }}
        >
          <StellarWalletContext.Provider
            value={{
              stellarWallet,
              setStellarWallet,
              clearStellarWallet,
            }}
          >
            {children}
            {open && <UI_Comp />} {/* show modal only when open */}
            <WalletSessionDisconnectWatcher consPath={consPath} enabled={consSessionEnabled} />
          </StellarWalletContext.Provider>
        </WalletContext.Provider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

function WalletSessionDisconnectWatcher({ consPath, enabled }: { consPath: string; enabled: boolean }) {
  const { isConnected } = useAccount();
  const { stellarWallet, clearStellarWallet } = useStellarWallet();
  const [authenticated, setAuthenticated] = useState(false);
  const previouslyConnected = useRef(Boolean(isConnected || stellarWallet.address));
  const connected = Boolean(isConnected || stellarWallet.address);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    void fetch(getConsUrl("session", consPath), { credentials: "same-origin", cache: "no-store" })
      .then((response) => response.json())
      .then((body) => { if (active) setAuthenticated(body?.success === true); })
      .catch(() => { if (active) setAuthenticated(false); });
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
    if (!stellarWallet.address) return;
    const watcher = new WatchWalletChanges();
    watcher.watch(({ address, error }) => {
      if (error || address || !stellarWallet.address) return;
      clearStellarWallet();
    });
    return () => watcher.stop();
  }, [clearStellarWallet, stellarWallet.address]);

  useEffect(() => {
    if (!enabled) return;
    if (connected) {
      previouslyConnected.current = true;
      return;
    }
    if (previouslyConnected.current) {
      previouslyConnected.current = false;
      void requestConsDisconnect(consPath).then(() => setAuthenticated(false));
    } else if (!authenticated) {
      previouslyConnected.current = false;
    }
  }, [authenticated, connected, consPath, enabled]);

  return null;
}

export function useWalletModal() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("Wrap in <WalletProviders>");
  return ctx;
}

export function useStellarWallet() {
  const ctx = useContext(StellarWalletContext);
  if (!ctx) throw new Error("Wrap in <WalletProviders>");
  return ctx;
}
