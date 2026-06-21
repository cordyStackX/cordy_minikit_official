"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { getTokenBalance } from "../controllers";
import { useWalletModal } from "../wagmi__providers";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
export default function ConnectWalletBT({ className, }) {
    const { openModal } = useWalletModal();
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
    return (_jsx("button", { className: className, onClick: openModal, children: isConnected
            ? `BAL ${balance} ${symbol ?? ""}`
            : "Connect Wallet" }));
}
