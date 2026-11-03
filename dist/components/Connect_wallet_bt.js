"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { getTokenBalance, loadStellarBalance } from "../controllers";
import { useStellarWallet, useWalletModal } from "../wagmi__providers";
// const ACTIVE_WALLET_SESSION_KEY = "cordy_minikit_active_wallet_session";
const STELLAR_BALANCE_REFRESH_EVENT = "cordy:stellar-balance-updated";
export default function ConnectWalletBT({ className, cons_session = false, navigate, }) {
    const { openModal } = useWalletModal();
    const { stellarWallet, setStellarWallet } = useStellarWallet();
    const { isConnected, address } = useAccount();
    const [balance, setBalance] = useState("");
    const [symbol, setSymbol] = useState("");
    const walletConnected = Boolean((isConnected && address) || stellarWallet.address);
    if (cons_session !== Boolean(navigate)) {
        throw new Error('ConnectWalletBT: provide both "cons_session={true}" and a "navigate" path, or neither.');
    }
    if (cons_session &&
        navigate &&
        (!navigate.startsWith("/") || navigate.startsWith("//") || navigate.includes("\\"))) {
        throw new Error('ConnectWalletBT: "navigate" must be a safe internal path starting with "/".');
    }
    useEffect(() => {
        if (cons_session || !isConnected || !address)
            return;
        void getTokenBalance(address).then(({ balance: nextBalance, symbol: nextSymbol }) => {
            setBalance(nextBalance);
            setSymbol(nextSymbol);
        });
    }, [address, isConnected, cons_session]);
    useEffect(() => {
        if (!stellarWallet.address || cons_session)
            return;
        let active = true;
        void loadStellarBalance(stellarWallet.address)
            .then((result) => {
            if (!active)
                return;
            setStellarWallet((current) => ({
                ...current,
                address: result.address,
                network: result.network,
                balance: result.balance,
            }));
        })
            .catch((error) => {
            console.error("Failed to load Stellar balance:", error);
            if (active)
                setStellarWallet((current) => ({ ...current, balance: "0" }));
        });
        return () => { active = false; };
    }, [cons_session, setStellarWallet, stellarWallet.address]);
    useEffect(() => {
        if (cons_session || !stellarWallet.address)
            return;
        const handler = () => {
            void loadStellarBalance(stellarWallet.address).then((result) => {
                setStellarWallet((current) => ({
                    ...current,
                    address: result.address,
                    network: result.network,
                    balance: result.balance,
                }));
            });
        };
        window.addEventListener(STELLAR_BALANCE_REFRESH_EVENT, handler);
        return () => window.removeEventListener(STELLAR_BALANCE_REFRESH_EVENT, handler);
    }, [cons_session, setStellarWallet, stellarWallet.address]);
    return (_jsx("button", { className: className, onClick: () => openModal({ consSession: cons_session, navigate }), "data-cons-session": cons_session ? "enabled" : undefined, type: "button", children: cons_session
            ? walletConnected ? "Connected" : "Connect Wallet"
            : isConnected
                ? `BAL ${balance} ${symbol}`
                : stellarWallet.address
                    ? `BAL ${stellarWallet.balance ?? "0"} XLM`
                    : "Connect Wallet" }));
}
