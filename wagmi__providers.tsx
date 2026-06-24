"use client";
import { createContext, useContext, useEffect, useState, ReactNode, Dispatch, SetStateAction } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { config } from "./config/walletConfig";
import { UI_Comp } from "./components";

type WalletContextType = {
  openModal: () => void;
  closeModal: () => void;
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

export default function WalletProviders({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [stellarWallet, setStellarWallet] = useState<StellarWalletState>(() => readStellarWallet());

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!stellarWallet.address) {
      window.localStorage.removeItem(STELLAR_WALLET_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(STELLAR_WALLET_STORAGE_KEY, JSON.stringify(stellarWallet));
  }, [stellarWallet]);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <WalletContext.Provider
          value={{
            openModal: () => setOpen(true),
            closeModal: () => setOpen(false),
          }}
        >
          <StellarWalletContext.Provider
            value={{
              stellarWallet,
              setStellarWallet,
              clearStellarWallet: () => {
                if (typeof window !== "undefined") {
                  window.localStorage.removeItem(STELLAR_WALLET_STORAGE_KEY);
                  window.localStorage.removeItem(ACTIVE_WALLET_SESSION_KEY);
                }
                setStellarWallet({ address: null, manuallyDisconnected: true });
              },
            }}
          >
            {children}
            {open && <UI_Comp />} {/* show modal only when open */}
          </StellarWalletContext.Provider>
        </WalletContext.Provider>
      </QueryClientProvider>
    </WagmiProvider>
  );
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
