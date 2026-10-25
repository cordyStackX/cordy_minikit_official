"use client";
import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect } from "react";
import { useConnect } from "wagmi";
import Images from "../config/Image.json";
import { UI_Comp__css } from "../css";
const ACTIVE_WALLET_SESSION_KEY = "cordy_minikit_active_wallet_session";
const ALWAYS_AVAILABLE_CONNECTOR_NAMES = new Set([
    "WalletConnect",
    "MetaMask",
    "Coinbase Wallet",
    "Trust Wallet",
]);
export default function WalletButton({ onStatusChange, connectorGroup = "all", }) {
    const { connectors, connectAsync } = useConnect();
    const [pendingConnector, setPendingConnector] = React.useState(null);
    const [errorMsg, setErrorMsg] = React.useState(undefined);
    const [isConnecting, setIsConnecting] = React.useState(false);
    const visibleConnectors = connectors.filter((connector) => {
        const isWalletConnect = connector.name.toLowerCase().includes("walletconnect");
        if (connectorGroup === "walletconnect")
            return isWalletConnect;
        if (connectorGroup === "browser")
            return !isWalletConnect;
        return true;
    });
    useEffect(() => {
        onStatusChange?.({ isPending: isConnecting, error: errorMsg });
    }, [isConnecting, errorMsg, onStatusChange]);
    return (_jsx(_Fragment, { children: visibleConnectors.map((connector) => (_jsx(WalletOption, { connector: connector, onClick: async () => {
                setIsConnecting(true);
                setErrorMsg(undefined);
                setPendingConnector(connector);
                try {
                    await connectAsync({ connector });
                    if (typeof window !== "undefined")
                        window.localStorage.setItem(ACTIVE_WALLET_SESSION_KEY, "evm");
                }
                catch (err) {
                    setErrorMsg(err?.message || "Connection failed");
                }
                finally {
                    setIsConnecting(false);
                    setPendingConnector(null);
                }
            }, isPending: pendingConnector?.uid === connector.uid && isConnecting }, connector.uid))) }));
}
function WalletOption({ connector, onClick, isPending, }) {
    const [installed, setInstalled] = React.useState(true);
    const isTrustWallet = connector.name.toLowerCase().includes("trust");
    const imageSource = Images[connector.name]
        || (isTrustWallet ? Images["Trust Wallet"] : undefined);
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
            }
            catch {
                setInstalled(false);
            }
        })();
    }, [connector, isTrustWallet]);
    return (_jsxs("button", { type: "button", disabled: !installed || isPending, onClick: onClick, children: [imageSource && !imageFailed
                ? _jsx("img", { src: imageSource, alt: "", "aria-hidden": "true", title: displayName, width: 23, height: 23, onError: () => setImageFailed(true) })
                : _jsx("span", { className: UI_Comp__css.wallet_icon_fallback, "aria-hidden": "true", children: fallbackInitial }), isPending ? "Connecting…" : isTrustWallet ? "Trust Wallet" : connector.name === "WalletConnect" ? "WalletConnect" : !installed ? `${connector.name} (Not installed)` : connector.name] }));
}
