"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { useWalletModal } from "../wagmi__providers";
import { useAccount, useBalance } from "wagmi";
import { formatUnits } from "viem";
export default function ConnectWalletBT({ className, }) {
    const { openModal } = useWalletModal();
    const { isConnected, address } = useAccount();
    const { data: balance } = useBalance({
        address,
    });
    const formattedBalance = balance
        ? Number(formatUnits(balance.value, balance.decimals)).toFixed(4)
        : "0.0000";
    return (_jsx("button", { className: className, onClick: openModal, children: isConnected
            ? `${formattedBalance} ${balance?.symbol ?? ""}`
            : "Connect Wallet" }));
}
