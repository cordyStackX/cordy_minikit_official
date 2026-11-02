"use client";

import { useEffect, useSyncExternalStore, useState } from "react";
import { useConnect } from "wagmi";
import type { Connector } from "wagmi";
import type { Eip1193Provider } from "ethers";
import Images from "../config/Image.json";
import { UI_Comp__css } from "../css";
import { isEvmEnvironmentConfigured } from "../config/walletConfig";
import { getConfiguredEvmAssets, getCordyRuntimeConfig } from "../client/runtimeConfig";
import {
  getBridgeWalletSession,
  rejectBridgeWalletSession,
  resolveBridgeWalletSession,
  subscribeBridgeWalletSession,
} from "./bridgeWalletSession";

export type BridgeEvmWalletModalProps = {
  open?: boolean;
  onClose?: () => void;
  onConnected?: (address?: string) => void;
  onConnectionError?: (error: string) => void;
  targetChainName?: string;
  title?: string;
  note?: string;
};

const ALWAYS_AVAILABLE_CONNECTOR_NAMES = new Set([
  "WalletConnect",
  "MetaMask",
  "Coinbase Wallet",
  "Trust Wallet",
]);

async function prepareConnectedWallet(
  connector: Connector,
  routeId: string | undefined,
  from: "internal" | "external" | undefined,
  to: "internal" | "external" | undefined,
): Promise<void> {
  const runtimeConfig = getCordyRuntimeConfig();
  const route = runtimeConfig?.bridge?.routes?.find((candidate) => candidate.id === routeId);
  const source = route?.[from ?? "internal"];
  const destination = route?.[to ?? "external"];
  const target = source?.networkType === "evm" ? source : destination?.networkType === "evm" ? destination : undefined;
  const targetChainId = target?.chainId ?? runtimeConfig?.networks?.[0]?.chainId;
  if (targetChainId === undefined) return;

  const network = runtimeConfig?.networks?.find((candidate) => candidate.chainId === targetChainId);
  if (!network) {
    throw new Error(`Chain ${targetChainId} is not configured in Cordy Minikit.`);
  }
  const provider = await connector.getProvider() as Eip1193Provider;
  const chainId = `0x${targetChainId.toString(16)}`;
  try {
    await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId }] });
  } catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error
      ? (error as { code?: number }).code
      : undefined;
    if (code !== 4902) {
      throw new Error(`The wallet could not switch to ${network.name}. ${error instanceof Error ? error.message : "The request was rejected."}`);
    }
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [{
        chainId,
        chainName: network.name,
        nativeCurrency: network.nativeCurrency,
        rpcUrls: [network.rpcUrl],
        ...(network.blockExplorerUrl ? { blockExplorerUrls: [network.blockExplorerUrl] } : {}),
      }],
    });
    await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId }] });
  }

  const token = target?.tokenAddress && target.assetSymbol
    ? getConfiguredEvmAssets(runtimeConfig).find((asset) =>
      asset.chainId === targetChainId &&
      asset.contractAddress?.toLowerCase() === target.tokenAddress?.toLowerCase(),
    )
    : undefined;
  if (target?.tokenAddress && target.assetSymbol) {
    await provider.request({
      method: "wallet_watchAsset",
      params: {
        type: "ERC20",
        options: {
          address: target.tokenAddress,
          symbol: target.assetSymbol,
          decimals: token?.decimals ?? 18,
        },
      },
    });
  }
}

export default function BridgeEvmWalletModal({
  open: controlledOpen,
  onClose: controlledOnClose,
  onConnected,
  onConnectionError,
  targetChainName,
  title,
  note,
}: BridgeEvmWalletModalProps) {
  const sessionRequest = useSyncExternalStore(
    subscribeBridgeWalletSession,
    getBridgeWalletSession,
    () => undefined,
  );
  const open = controlledOpen ?? Boolean(sessionRequest);
  const onClose = controlledOnClose ?? (() => rejectBridgeWalletSession());
  const route = getCordyRuntimeConfig()?.bridge?.routes?.find((candidate) => candidate.id === sessionRequest?.routeId);
  const source = route?.[sessionRequest?.from ?? "internal"];
  const destination = route?.[sessionRequest?.to ?? "external"];
  const resolvedTargetChain = targetChainName
    ?? (source?.networkType === "evm" ? source.networkName : destination?.networkName)
    ?? "the destination network";
  const resolvedTitle = title
    ?? (source?.networkType === "evm" ? "Connect the source EVM wallet" : "Connect the destination EVM wallet");
  const { connectors, connectAsync } = useConnect();
  const [pendingConnector, setPendingConnector] = useState<string>();
  const [error, setError] = useState<string>();
  const description = note ?? `Connect your EVM wallet. The bridge continues automatically on ${resolvedTargetChain}.`;

  useEffect(() => {
    if (!open) {
      setPendingConnector(undefined);
      setError(undefined);
    }
  }, [open]);

  if (!open) return null;

  const connect = async (connector: Connector) => {
    setPendingConnector(connector.uid);
    setError(undefined);
    try {
      if (!isEvmEnvironmentConfigured()) {
        throw new Error("EVM is not configured. Add an EVM network and asset to the provider configuration.");
      }
      const connection = await connectAsync({ connector });
      const connectedAddress = connection.accounts?.[0];
      await prepareConnectedWallet(
        connector,
        sessionRequest?.routeId,
        sessionRequest?.from,
        sessionRequest?.to,
      );
      onConnected?.(connectedAddress);
      if (connectedAddress && sessionRequest) resolveBridgeWalletSession(connectedAddress);
      onClose();
    } catch (connectionError) {
      const message = connectionError instanceof Error ? connectionError.message : "EVM wallet connection failed.";
      setError(message);
      onConnectionError?.(message);
      if (sessionRequest) rejectBridgeWalletSession(message);
    } finally {
      setPendingConnector(undefined);
    }
  };

  return (
    <div className={UI_Comp__css.bridge_modal_container} role="presentation">
      <section
        className={UI_Comp__css.bridge_modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cordy-bridge-wallet-title"
      >
        <div className={UI_Comp__css.bridge_modal_header}>
          <div>
            <p className={UI_Comp__css.eyebrow}>CORDY MINIKIT · EVM DESTINATION</p>
            <h2 id="cordy-bridge-wallet-title">{resolvedTitle}</h2>
          </div>
          <button
            className={UI_Comp__css.close_button}
            type="button"
            onClick={onClose}
            aria-label="Close EVM wallet connection dialog"
          >
            ×
          </button>
        </div>
        <p className={UI_Comp__css.modal_description}>{description}</p>
        <div className={UI_Comp__css.bridge_wallet_options}>
          {connectors.map((connector) => {
            const isTrustWallet = connector.name.toLowerCase().includes("trust");
            const imageSource = (Images as Record<string, string>)[connector.name]
              || (isTrustWallet ? (Images as Record<string, string>)["Trust Wallet"] : undefined);
            const displayName = isTrustWallet ? "Trust Wallet" : connector.name;
            const imageUnavailable = connector.type === "injected"
              && !ALWAYS_AVAILABLE_CONNECTOR_NAMES.has(connector.name)
              && !isTrustWallet;

            return (
              <BridgeWalletOption
                key={connector.uid}
                connector={connector}
                displayName={displayName}
                imageSource={imageSource}
                imageUnavailable={imageUnavailable}
                isPending={pendingConnector === connector.uid}
                disabled={Boolean(pendingConnector)}
                onClick={() => void connect(connector)}
              />
            );
          })}
        </div>
        {error && <div className={UI_Comp__css.error_message} role="alert">{error}</div>}
        <p className={UI_Comp__css.panel_note}>
          Connect your EVM wallet. The bridge continues automatically on {resolvedTargetChain}.
        </p>
      </section>
    </div>
  );
}

function BridgeWalletOption({
  connector,
  displayName,
  imageSource,
  imageUnavailable,
  isPending,
  disabled,
  onClick,
}: {
  connector: Connector;
  displayName: string;
  imageSource?: string;
  imageUnavailable: boolean;
  isPending: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const [installed, setInstalled] = useState(!imageUnavailable);
  const [imageFailed, setImageFailed] = useState(false);
  const fallbackInitial = displayName.trim().charAt(0).toUpperCase() || "?";

  useEffect(() => {
    if (!imageUnavailable) return;
    let active = true;
    void connector.getProvider().then((provider) => {
      if (active) setInstalled(Boolean(provider));
    }).catch(() => {
      if (active) setInstalled(false);
    });
    return () => {
      active = false;
    };
  }, [connector, imageUnavailable]);

  return (
    <button
      className={UI_Comp__css.bridge_wallet_option}
      type="button"
      disabled={!installed || disabled}
      onClick={onClick}
    >
      {imageSource && !imageFailed
        ? <img src={imageSource} alt="" aria-hidden="true" width={23} height={23} onError={() => setImageFailed(true)} />
        : <span className={UI_Comp__css.wallet_icon_fallback} aria-hidden="true">{fallbackInitial}</span>}
      {isPending ? `Connecting ${displayName}…` : !installed ? `${displayName} (Not installed)` : displayName}
    </button>
  );
}
