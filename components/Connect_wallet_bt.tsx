"use client";

import { useWalletModal } from "../wagmi__providers";
import { useAccount, useBalance } from "wagmi";
import { formatUnits } from "viem";

interface ConnectWalletBTProps {
  className?: string;
}

export default function ConnectWalletBT({
  className,
}: ConnectWalletBTProps) {
  const { openModal } = useWalletModal();
  const { isConnected, address } = useAccount();

  const { data: balance } = useBalance({
    address,
  });

  const formattedBalance = balance
    ? Number(
        formatUnits(balance.value, balance.decimals)
      ).toFixed(4)
    : "0.0000";

  return (
    <button
      className={className}
      onClick={openModal}
    >
      {isConnected
        ? `${formattedBalance} ${balance?.symbol ?? ""}`
        : "Connect Wallet"}
    </button>
  );
}