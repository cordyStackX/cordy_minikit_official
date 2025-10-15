"use client";
import React, { useEffect } from "react";
import { useConnect } from "wagmi";
import type { Connector } from "wagmi";

export default function WalletButton({ 
  onStatusChange 
}: { 
  onStatusChange?: (status: { isPending: boolean; error?: string }) => void 
}) {
  const { connectors, connectAsync, status } = useConnect();
  const [pendingConnector, setPendingConnector] = React.useState<Connector | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | undefined>(undefined);

  // Derived isPending (true/false only)
  const isPending = status === "pending";

  // Notify parent whenever status changes
  useEffect(() => {
    if (onStatusChange) {
      onStatusChange({
        isPending,
        error: errorMsg,
      });
    }
  }, [isPending, errorMsg, onStatusChange]);

  return (
    <>
      {connectors.map((connector) => (
        <WalletOption
          key={connector.uid}
          connector={connector}
          onClick={async () => {
            setPendingConnector(connector);
            setErrorMsg(undefined); // reset old errors
            try {
              await connectAsync({ connector });
            } catch (err) {
              setErrorMsg((err as Error)?.message || "Connection failed");
            } finally {
              setPendingConnector(null);
            }
          }}
          isPending={pendingConnector?.uid === connector.uid && isPending}
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
  const [ready, setReady] = React.useState(true); // ✅ default to true so it still renders
  const [installed, setInstalled] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const provider = await connector.getProvider();
        setInstalled(!!provider); // true if wallet found
      } catch {
        setInstalled(false);
      }
    })();
  }, [connector]);

  const disabled = isPending || !installed;

  return (
    <button disabled={disabled} onClick={onClick}>
      {isPending
        ? "Connecting..."
        : !installed
        ? `${connector.name} (Not Installed)`
        : connector.name}
    </button>
  );
}
