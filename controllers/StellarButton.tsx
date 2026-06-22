"use client";

import { useState } from "react";
import * as Freighter from "@stellar/freighter-api";

export default function StellarWalletButton({
  onConnect,
}: {
  onConnect?: (address: string) => void;
}) {
  const [address, setAddress] = useState<string | null>(null);

  const connect = async () => {
    try {
      // 👇 force runtime access (ignore TS mismatch)
      const publicKey = await (Freighter as any).getPublicKey();

      setAddress(publicKey);
      onConnect?.(publicKey);
    } catch (err) {
      console.error("Freighter error:", err);
    }
  };

  return (
    <button onClick={connect}>
      {address
        ? `Connected: ${address.slice(0, 6)}...`
        : "Connect Freighter"}
    </button>
  );
}