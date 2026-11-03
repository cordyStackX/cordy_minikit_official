"use client";
import { useDisconnect } from "wagmi";
import { useWalletModal, useStellarWallet } from "../wagmi__providers";
import { requestConsDisconnect } from "../client/consRuntime";
const ACTIVE_WALLET_SESSION_KEY = "***";
export default function useDisconnectWallets() {
    const { disconnectAsync } = useDisconnect();
    const { closeModal, consSession, consSessionEnabled, consPath } = useWalletModal();
    const { clearStellarWallet } = useStellarWallet();
    const clearSession = () => {
        if (typeof window !== "undefined") {
            window.localStorage.removeItem(ACTIVE_WALLET_SESSION_KEY);
        }
    };
    const disconnectEVM = async () => {
        try {
            if (consSession || consSessionEnabled)
                await requestConsDisconnect(consPath);
            await disconnectAsync();
            clearSession();
            closeModal();
            return true;
        }
        catch (err) {
            console.error("Failed to disconnect EVM wallet:", err);
            return false;
        }
    };
    const disconnectStellar = async () => {
        try {
            if (consSession || consSessionEnabled)
                await requestConsDisconnect(consPath);
            clearStellarWallet();
            clearSession();
            closeModal();
            return true;
        }
        catch (err) {
            console.error("Failed to disconnect Stellar wallet:", err);
            return false;
        }
    };
    const disconnectAll = async () => {
        try {
            if (consSession || consSessionEnabled)
                await requestConsDisconnect(consPath);
            await disconnectAsync();
            clearStellarWallet();
            clearSession();
            closeModal();
            return true;
        }
        catch (err) {
            console.error("Failed to disconnect wallets:", err);
            return false;
        }
    };
    return {
        disconnectEVM,
        disconnectStellar,
        disconnectAll,
    };
}
