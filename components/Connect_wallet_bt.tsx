"use client";
import { Buttons__css } from "../css";
import { useWalletModal } from "../wagmi__providers";
import { useAccount } from "wagmi";

export default function ConnectWalletBT() {
  const { openModal } = useWalletModal();
  const { isConnected, address } = useAccount();

  return (
    <button
      className={Buttons__css.button__button}
      onClick={openModal}
    >
      {isConnected ? `Connected ${address}` : "Connect Wallet"}
    </button>
  );
}
