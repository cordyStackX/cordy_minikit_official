"use client";
import React, { useEffect } from "react";
import { useConnect } from "wagmi";
import type { Connector } from "wagmi";
import Images from "../config/Image.json";

export default function WalletButton({
  onStatusChange
}: {
  onStatusChange?: (status: { isPending: boolean; error?: string }) => void
}) {
  const { connectors, connectAsync, status } = useConnect();
  const [pendingConnector, setPendingConnector] = React.useState<Connector | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | undefined>(undefined);
  const [isConnecting, setIsConnecting] = React.useState(false);


  // Notify parent whenever status changes
  useEffect(() => {
    if (onStatusChange) {
      onStatusChange({
        isPending: isConnecting,
        error: errorMsg,
      });
    }
  }, [isConnecting, errorMsg, onStatusChange]);

  return (
    <>
      {connectors.map((connector) => (
        <WalletOption
          key={connector.uid}
          connector={connector}
          onClick={async () => {
            setIsConnecting(true);
            setErrorMsg(undefined);
            setPendingConnector(connector);

            try {
              await connectAsync({ connector });
            } catch (err) {
              setErrorMsg((err as Error)?.message || "Connection failed");
            } finally {
              setIsConnecting(false);
              setPendingConnector(null);
            }
          }}
          isPending={pendingConnector?.uid === connector.uid && isConnecting}
        />
      ))}
    </>
  );
}

function WalletOption({
  connector,
  onClick,
  isPending
}: {
  connector: Connector;
  onClick: () => void;
  isPending: boolean
}) {
  const [installed, setInstalled] = React.useState(true);
  const isTrustWallet = connector.name === "Trust Wallet";

  React.useEffect(() => {
  (async () => {
    try {
      if (connector.name === "WalletConnect" || isTrustWallet) {
        setInstalled(true);
        return;
      }

      const provider = await connector.getProvider();
      setInstalled(!!provider);
    } catch {
      setInstalled(false);
    }
  })();
}, [connector]);


  return (
  <button disabled={!installed} onClick={onClick}>
    <img
      src={(Images as Record<string, string>)[connector.name] || Images["Coinbased Wallet"]}
      alt={connector.name}
      title={connector.name}
      width={23}
      height={18}
    />
    {
      isPending
        ? "Connecting..."
        : isTrustWallet
          ? "Trust Wallet"
          : connector.name === "WalletConnect"
            ? "WalletConnect"
            : !installed
              ? `${connector.name} (Not Installed)`
              : connector.name
    }
  </button>
  );
}
