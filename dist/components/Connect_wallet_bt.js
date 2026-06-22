"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { getTokenBalance } from "../controllers";
import { useWalletModal, useStellarWallet } from "../wagmi__providers";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { Horizon } from "@stellar/stellar-sdk";
const STELLAR_RPC = process.env.NEXT_PUBLIC_STELLAR_RPC || "https://soroban-testnet.stellar.org";
const STELLAR_HORIZON = process.env.NEXT_PUBLIC_STELLAR_HORIZON || "https://horizon-testnet.stellar.org";
export default function ConnectWalletBT({ className, }) {
    const { openModal } = useWalletModal();
    const { stellarWallet, setStellarWallet } = useStellarWallet();
    const { isConnected, address } = useAccount();
    const [balance, setBalance] = useState("");
    const [symbol, setSymbol] = useState("");
    useEffect(() => {
        if (isConnected && address) {
            Get_Balance();
        }
    }, [isConnected, address]);
    const Get_Balance = async () => {
        if (!address)
            return;
        const { balance, symbol } = await getTokenBalance(address);
        setBalance(balance);
        setSymbol(symbol);
        return;
    };
    const loadStellarBalance = async (accountId) => {
        try {
            const server = new Horizon.Server(STELLAR_HORIZON);
            const account = await server.loadAccount(accountId);
            const native = account.balances.find((item) => item.asset_type === "native");
            setStellarWallet((current) => ({
                ...current,
                balance: native?.balance ?? "0",
            }));
        }
        catch (err) {
            console.error("Failed to load Stellar balance:", err);
            setStellarWallet((current) => ({ ...current, balance: "0" }));
        }
    };
    useEffect(() => {
        if (stellarWallet.address) {
            void loadStellarBalance(stellarWallet.address);
        }
    }, [stellarWallet.address]);
    return (_jsx("button", { className: className, onClick: openModal, children: isConnected
            ? `BAL ${balance} ${symbol ?? ""}`
            : stellarWallet.address
                ? `BAL ${stellarWallet.balance ?? "0"} XLM`
                : "Connect Wallet" }));
}
