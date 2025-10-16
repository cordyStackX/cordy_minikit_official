"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { useWalletModal } from "../wagmi__providers";
import { useAccount } from "wagmi";
export default function ConnectWalletBT({ className }) {
    const { openModal } = useWalletModal();
    const { isConnected, address } = useAccount();
    return (_jsx("button", { className: className, onClick: openModal, children: isConnected ? `Connected ${address}` : "Connect Wallet" }));
}
