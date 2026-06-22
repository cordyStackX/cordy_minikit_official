"use client";
import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction } from "react";
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

export default function WalletProviders({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [stellarWallet, setStellarWallet] = useState<StellarWalletState>({ address: null });

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
              clearStellarWallet: () => setStellarWallet({ address: null, manuallyDisconnected: true }),
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
