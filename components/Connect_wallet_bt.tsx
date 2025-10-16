"use client";
import { useWalletModal } from "../wagmi__providers";
import { useAccount } from "wagmi";

export default function ConnectWalletBT({ className }: { className?: string }) {
  const { openModal } = useWalletModal();
  const { isConnected, address } = useAccount();

  return (
    <button
      className={className}
      onClick={openModal}
    >
      {isConnected ? `Connected ${address}` : "Connect Wallet"}
    </button>
  );
}
