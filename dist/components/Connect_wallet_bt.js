"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { Buttons__css } from "../css";
import { useWalletModal } from "../wagmi__providers";
import { useAccount } from "wagmi";
export default function ConnectWalletBT() {
    const { openModal } = useWalletModal();
    const { isConnected, address } = useAccount();
    return (_jsx("button", { className: Buttons__css.button__button, onClick: openModal, children: isConnected ? `Connected ${address}` : "Connect Wallet" }));
}
