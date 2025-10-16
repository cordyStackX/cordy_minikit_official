"use client";
import { useWalletModal } from "../wagmi__providers";
import { useAccount } from "wagmi";

interface ConnectWalletBTProps {
  className?: string;
}

export default function ConnectWalletBT({ className }: ConnectWalletBTProps) {
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
