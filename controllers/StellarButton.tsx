"use client";

import { useState } from "react";
import { requestAccess, getNetworkDetails } from "@stellar/freighter-api";

export default function StellarWalletButton({
  onConnect,
  onStatusChange,
}: {
  onConnect?: (address: string) => void;
  onStatusChange?: (status: {
    isPending: boolean;
    error?: string;
    address?: string;
    network?: string;
  }) => void;
}) {
  const [address, setAddress] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | undefined>();
  const [network, setNetwork] = useState<string | undefined>();

  const connect = async () => {
    setIsPending(true);
    setErrorMsg(undefined);
    onStatusChange?.({ isPending: true });

    try {
      const access = await requestAccess();
      const publicKey = access.address;

      setAddress(publicKey);
      const networkDetails = await getNetworkDetails();
      setNetwork(networkDetails.network || "Unknown");

      onConnect?.(publicKey);
      onStatusChange?.({
        isPending: false,
        address: publicKey,
        network: networkDetails.network || "Unknown",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Freighter connection failed";
      console.error("Freighter error:", err);
      setErrorMsg(message);
      onStatusChange?.({ isPending: false, error: message });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button onClick={connect} disabled={isPending}>
      {isPending
        ? "Connecting..."
        : address
          ? `Connected: ${address.slice(0, 6)}...`
          : "Freighter"}
      {network ? ` • ${network}` : ""}
      {errorMsg ? ` • ${errorMsg}` : ""}
    </button>
  );
}
