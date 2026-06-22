"use client";
import { getTokenBalance } from "../controllers";
import { useWalletModal, useStellarWallet } from "../wagmi__providers";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { isConnected as stellarIsConnected, getAddress as stellarGetAddress } from "@stellar/freighter-api";
import { Horizon } from "@stellar/stellar-sdk";

const STELLAR_RPC = process.env.NEXT_PUBLIC_STELLAR_RPC || "https://soroban-testnet.stellar.org";

interface ConnectWalletBTProps {
  className?: string;
}

export default function ConnectWalletBT({
  className,
}: ConnectWalletBTProps) {
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

  useEffect(() => {
    const hydrateStellar = async () => {
      if (stellarWallet.manuallyDisconnected) {
        return;
      }

      try {
        const connected = await stellarIsConnected();
        if (!connected.isConnected) return;

        const account = await stellarGetAddress();
        setStellarWallet((current) => ({ ...current, address: account.address, manuallyDisconnected: false }));
        void loadStellarBalance(account.address);
      } catch {
        return;
      }
    };

    void hydrateStellar();
  }, []);

  const Get_Balance = async () => {

    if (!address) return;

    const { balance, symbol } = await getTokenBalance(address);

    setBalance(balance);
    setSymbol(symbol);
    return;
  };

  const loadStellarBalance = async (accountId: string) => {
    try {
      const server = new Horizon.Server(STELLAR_RPC);
      const account = await server.loadAccount(accountId);
      const native = account.balances.find(
        (item) => item.asset_type === "native"
      );

      setStellarWallet((current) => ({
        ...current,
        balance: native?.balance ?? "0",
      }));
    } catch (err) {
      console.error("Failed to load Stellar balance:", err);
      setStellarWallet((current) => ({ ...current, balance: "0" }));
    }
  };

  useEffect(() => {
    if (stellarWallet.address) {
      void loadStellarBalance(stellarWallet.address);
    }
  }, [stellarWallet.address]);

  return (
    <button
      className={className}
      onClick={openModal}
    >
      {isConnected
        ? `BAL ${balance} ${symbol ?? ""}`
        : stellarWallet.address
          ? `BAL ${stellarWallet.balance ?? "0"} XLM`
        : "Connect Wallet"}
    </button>
  );
}
