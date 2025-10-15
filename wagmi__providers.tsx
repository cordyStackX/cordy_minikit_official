"use client";
import { createContext, useContext, useState, ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { config } from "./config/walletConfig";
import { UI_Comp } from "./components";

type WalletContextType = {
  openModal: () => void;
  closeModal: () => void;
};

const WalletContext = createContext<WalletContextType | null>(null);

const queryClient = new QueryClient();

export default function WalletProviders({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <WalletContext.Provider
          value={{
            openModal: () => setOpen(true),
            closeModal: () => setOpen(false),
          }}
        >
          {children}
          {open && <UI_Comp />} {/* show modal only when open */}
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
