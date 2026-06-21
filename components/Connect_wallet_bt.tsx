"use client";
import { getTokenBalance } from "../controllers";
import { useWalletModal } from "../wagmi__providers";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";

interface ConnectWalletBTProps {
  className?: string;
}

export default function ConnectWalletBT({
  className,
}: ConnectWalletBTProps) {
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

    if (!address) return;

    const { balance, symbol } = await getTokenBalance(address);

    setBalance(balance);
    setSymbol(symbol);
    return;
  };
  return (
    <button
      className={className}
      onClick={openModal}
    >
      {isConnected
        ? `BAL ${balance} ${symbol ?? ""}`
        : "Connect Wallet"}
    </button>
  );
}