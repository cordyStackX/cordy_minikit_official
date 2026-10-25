"use client";
import React, { useEffect } from "react";
import { useConnect } from "wagmi";
import type { Connector } from "wagmi";
import Images from "../config/Image.json";
import { UI_Comp__css } from "../css";

const ACTIVE_WALLET_SESSION_KEY = "cordy_minikit_active_wallet_session";
const ALWAYS_AVAILABLE_CONNECTOR_NAMES = new Set([
  "WalletConnect",
  "MetaMask",
  "Coinbase Wallet",
  "Trust Wallet",
]);

export default function WalletButton({
  onStatusChange,
  connectorGroup = "all",
}: {
  onStatusChange?: (status: { isPending: boolean; error?: string }) => void;
  connectorGroup?: "all" | "browser" | "walletconnect";
}) {
  const { connectors, connectAsync } = useConnect();
  const [pendingConnector, setPendingConnector] = React.useState<Connector | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | undefined>(undefined);
  const [isConnecting, setIsConnecting] = React.useState(false);
  const visibleConnectors = connectors.filter((connector) => {
    const isWalletConnect = connector.name.toLowerCase().includes("walletconnect");
    if (connectorGroup === "walletconnect") return isWalletConnect;
    if (connectorGroup === "browser") return !isWalletConnect;
    return true;
  });

  useEffect(() => {
    onStatusChange?.({ isPending: isConnecting, error: errorMsg });
  }, [isConnecting, errorMsg, onStatusChange]);

  return (
    <>
      {visibleConnectors.map((connector) => (
        <WalletOption
          key={connector.uid}
          connector={connector}
          onClick={async () => {
            setIsConnecting(true);
            setErrorMsg(undefined);
            setPendingConnector(connector);
            try {
              await connectAsync({ connector });
              if (typeof window !== "undefined") window.localStorage.setItem(ACTIVE_WALLET_SESSION_KEY, "evm");
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
  isPending,
}: {
  connector: Connector;
  onClick: () => void;
  isPending: boolean;
}) {
  const [installed, setInstalled] = React.useState(true);
  const isTrustWallet = connector.name.toLowerCase().includes("trust");
  const imageSource = (Images as Record<string, string>)[connector.name]
    || (isTrustWallet ? (Images as Record<string, string>)["Trust Wallet"] : undefined);
  const [imageFailed, setImageFailed] = React.useState(false);
  const displayName = isTrustWallet ? "Trust Wallet" : connector.name;
  const fallbackInitial = displayName.trim().charAt(0).toUpperCase() || "?";

  useEffect(() => {
    void (async () => {
      try {
        if (connector.type !== "injected" || ALWAYS_AVAILABLE_CONNECTOR_NAMES.has(connector.name) || isTrustWallet) {
          setInstalled(true);
          return;
        }
        setInstalled(Boolean(await connector.getProvider()));
      } catch {
        setInstalled(false);
      }
    })();
  }, [connector, isTrustWallet]);

  return (
    <button type="button" disabled={!installed || isPending} onClick={onClick}>
      {imageSource && !imageFailed
        ? <img src={imageSource} alt="" aria-hidden="true" title={displayName} width={23} height={23} onError={() => setImageFailed(true)} />
        : <span className={UI_Comp__css.wallet_icon_fallback} aria-hidden="true">{fallbackInitial}</span>}
      {isPending ? "Connecting…" : isTrustWallet ? "Trust Wallet" : connector.name === "WalletConnect" ? "WalletConnect" : !installed ? `${connector.name} (Not installed)` : connector.name}
    </button>
  );
}
