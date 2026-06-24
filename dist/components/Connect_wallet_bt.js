"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { getTokenBalance, loadStellarBalance } from "../controllers";
import { useWalletModal, useStellarWallet } from "../wagmi__providers";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
const ACTIVE_WALLET_SESSION_KEY = "cordy_minikit_active_wallet_session";
const STELLAR_BALANCE_REFRESH_EVENT = "cordy:stellar-balance-updated";
export default function ConnectWalletBT({ className, }) {
    const { openModal } = useWalletModal();
    const { stellarWallet, setStellarWallet } = useStellarWallet();
    const { isConnected, address } = useAccount();
    const [balance, setBalance] = useState("");
    const [symbol, setSymbol] = useState("");
    useEffect(() => {
        if (isConnected && address) {
            void Get_Balance();
        }
    }, [isConnected, address]);
    const Get_Balance = async () => {
        if (!address)
            return;
        const { balance, symbol } = await getTokenBalance(address);
        setBalance(balance);
        setSymbol(symbol);
    };
    const handleLoadStellarBalance = async (accountId) => {
        try {
            const result = await loadStellarBalance(accountId);
            setStellarWallet((current) => ({
                ...current,
                address: result.address,
                network: result.network,
                balance: result.balance,
            }));
            if (typeof window !== "undefined") {
                window.localStorage.setItem(ACTIVE_WALLET_SESSION_KEY, "stellar");
            }
        }
        catch (err) {
            console.error("Failed to load Stellar balance:", err);
            setStellarWallet((current) => ({
                ...current,
                balance: "0",
            }));
        }
    };
    useEffect(() => {
        if (stellarWallet.address) {
            void handleLoadStellarBalance(stellarWallet.address);
        }
    }, [stellarWallet.address]);
    useEffect(() => {
        const handler = () => {
            if (stellarWallet.address) {
                void handleLoadStellarBalance(stellarWallet.address);
            }
        };
        window.addEventListener(STELLAR_BALANCE_REFRESH_EVENT, handler);
        return () => {
            window.removeEventListener(STELLAR_BALANCE_REFRESH_EVENT, handler);
        };
    }, [stellarWallet.address]);
    return (_jsx("button", { className: className, onClick: openModal, children: isConnected
            ? `BAL ${balance} ${symbol ?? ""}`
            : stellarWallet.address
                ? `BAL ${stellarWallet.balance ?? "0"} XLM`
                : "Connect Wallet" }));
}
