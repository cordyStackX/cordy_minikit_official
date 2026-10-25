"use client";
import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { UI_Comp__css } from "../css";
import { WalletButton, getTokenBalance, StellarWalletButton, loadStellarBalance, useDisconnectWallets } from "../controllers";
import { useWalletModal, useStellarWallet } from "../wagmi__providers";
import { useAccount } from "wagmi";
import { useState, useEffect } from "react";
import pkg from "../package.json";
import links from "../config/links.json";
const ACTIVE_WALLET_SESSION_KEY = "cordy_minikit_active_wallet_session";
const walletRoutes = [
    { id: "browser-evm", title: "EVM · Browser", subtitle: "Use MetaMask, Coinbase Wallet, or another extension", icon: "E", hint: "Browser" },
    { id: "walletconnect", title: "WalletConnect · Mobile", subtitle: "Connect with a wallet on your phone using a QR code", icon: "W", hint: "QR code" },
    { id: "stellar", title: "Stellar · Non-EVM", subtitle: "Connect a Stellar account with Freighter", icon: "✦", hint: "Freighter" },
];
export default function UI_Comp() {
    const { closeModal, jwtSession } = useWalletModal();
    const { stellarWallet, setStellarWallet } = useStellarWallet();
    const { isConnected, address, chain } = useAccount();
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState();
    const [balance, setBalance] = useState("");
    const [symbol, setSymbol] = useState("");
    const [stellarLoading, setStellarLoading] = useState(false);
    const [stellarError, setStellarError] = useState();
    const [selectedRoute, setSelectedRoute] = useState(null);
    const { disconnectEVM, disconnectStellar } = useDisconnectWallets();
    useEffect(() => {
        if (!jwtSession && isConnected && address)
            void Get_Balance();
    }, [isConnected, address, jwtSession]);
    useEffect(() => {
        if (!jwtSession && stellarWallet.address)
            void loadStellarBalance(stellarWallet.address);
    }, [stellarWallet.address, jwtSession]);
    const Get_Balance = async () => {
        if (!address)
            return;
        const result = await getTokenBalance(address);
        setBalance(result.balance);
        setSymbol(result.symbol);
    };
    const handleLoadStellarBalance = async (accountId) => {
        setStellarError(undefined);
        try {
            const result = await loadStellarBalance(accountId);
            setStellarWallet((current) => ({ ...current, address: result.address, network: result.network, balance: result.balance }));
            window.localStorage.setItem(ACTIVE_WALLET_SESSION_KEY, "stellar");
        }
        catch (err) {
            const message = err instanceof Error ? err.message : "Failed to load Stellar balance";
            console.error("Failed to load Stellar balance:", err);
            setStellarError(message);
            setStellarWallet((current) => ({ ...current, balance: "0" }));
        }
    };
    const truncateAddress = (value, head = 8, tail = 4) => {
        if (!value)
            return "";
        if (value.length <= head + tail + 3)
            return value;
        return `${value.slice(0, head)}...${value.slice(-tail)}`;
    };
    const footer = _jsxs("a", { className: UI_Comp__css.footer_link, href: links.NPM_Pack_links, target: "_blank", rel: "noreferrer", children: ["Cordy Minikit ", _jsx("span", { "aria-hidden": "true", children: "\u00B7" }), " v", pkg.version] });
    if (isConnected || stellarWallet.address) {
        const isStellar = !isConnected && Boolean(stellarWallet.address);
        const connectedAddress = isStellar ? stellarWallet.address : address;
        const connectedNetwork = isStellar ? stellarWallet.network || "Stellar" : chain?.name || "Network unavailable";
        const connectedBalance = isStellar
            ? stellarWallet.balance ? `${stellarWallet.balance} XLM` : "Loading balance…"
            : balance ? `${Number(balance).toFixed(4)} ${symbol}` : "Loading balance…";
        return (_jsx("div", { className: UI_Comp__css.container, children: _jsxs("section", { className: UI_Comp__css.connector, role: "dialog", "aria-modal": "true", "aria-labelledby": "wallet-modal-title", children: [_jsxs("header", { className: UI_Comp__css.modal_header, children: [_jsx("div", { className: UI_Comp__css.brand_mark, "aria-hidden": "true", children: "C" }), _jsxs("div", { children: [_jsx("p", { className: UI_Comp__css.eyebrow, children: "CORDY MINIKIT" }), _jsx("h2", { id: "wallet-modal-title", children: "Wallet connected" })] }), _jsx("button", { className: UI_Comp__css.close_button, type: "button", onClick: closeModal, "aria-label": "Close wallet dialog", children: "\u00D7" })] }), _jsxs("div", { className: UI_Comp__css.connected_card, children: [_jsxs("div", { className: UI_Comp__css.connected_heading, children: [_jsx("span", { className: UI_Comp__css.connected_dot }), " ", isStellar ? "Stellar wallet" : "EVM wallet", _jsx("span", { className: UI_Comp__css.network_badge, children: connectedNetwork })] }), !jwtSession && _jsxs(_Fragment, { children: [_jsx("div", { className: UI_Comp__css.balance_value, children: connectedBalance }), _jsx("p", { className: UI_Comp__css.muted, children: isStellar ? "Native balance" : "Token balance" })] }), _jsxs("div", { className: UI_Comp__css.address_row, children: [_jsx("span", { children: "Address" }), _jsx("code", { title: connectedAddress || "", children: truncateAddress(connectedAddress, 12, 8) })] }), isStellar && stellarError && _jsx("p", { className: UI_Comp__css.error_message, role: "alert", children: stellarError })] }), _jsx("button", { className: UI_Comp__css.disconnect_button, type: "button", onClick: async () => { if (isStellar)
                            await disconnectStellar();
                        else
                            await disconnectEVM(); }, children: "Disconnect wallet" }), footer] }) }));
    }
    const selectedWalletRoute = walletRoutes.find((route) => route.id === selectedRoute);
    return (_jsx("div", { className: UI_Comp__css.container, children: _jsxs("section", { className: UI_Comp__css.connector, role: "dialog", "aria-modal": "true", "aria-labelledby": "wallet-modal-title", "aria-describedby": "wallet-modal-description", children: [_jsxs("header", { className: UI_Comp__css.modal_header, children: [_jsx("div", { className: UI_Comp__css.brand_mark, "aria-hidden": "true", children: "C" }), _jsxs("div", { children: [_jsxs("p", { className: UI_Comp__css.eyebrow, children: ["CORDY MINIKIT ", _jsx("span", { children: "\u00B7" }), " WALLET ACCESS"] }), _jsx("h2", { id: "wallet-modal-title", children: selectedWalletRoute?.title || "Choose a wallet" })] }), _jsx("button", { className: UI_Comp__css.close_button, type: "button", onClick: closeModal, "aria-label": "Close wallet dialog", children: "\u00D7" })] }), _jsx("p", { id: "wallet-modal-description", className: UI_Comp__css.modal_description, children: selectedWalletRoute ? selectedWalletRoute.subtitle : "Select how you want to connect." }), (loading || stellarLoading) && _jsxs("div", { className: UI_Comp__css.loading_notice, role: "status", children: [_jsx("span", { className: UI_Comp__css.spinner }), " Waiting for wallet approval\u2026"] }), !selectedRoute ? (_jsx("div", { className: UI_Comp__css.wallet_choices, role: "group", "aria-label": "Wallet connection options", children: walletRoutes.map((route) => (_jsxs("button", { type: "button", className: UI_Comp__css.wallet_choice, onClick: () => { setErrorMsg(undefined); setStellarError(undefined); setSelectedRoute(route.id); }, children: [_jsx("span", { className: `${UI_Comp__css.choice_icon} ${route.id === "stellar" ? UI_Comp__css.stellar_choice_icon : ""}`, "aria-hidden": "true", children: route.icon }), _jsxs("span", { className: UI_Comp__css.choice_copy, children: [_jsx("span", { className: UI_Comp__css.choice_title, children: route.title }), _jsx("span", { className: UI_Comp__css.choice_subtitle, children: route.subtitle })] }), _jsx("span", { className: UI_Comp__css.choice_hint, children: route.hint }), _jsx("svg", { className: UI_Comp__css.choice_chevron, "aria-hidden": "true", viewBox: "0 0 16 16", fill: "none", children: _jsx("path", { d: "m6 3 5 5-5 5", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }) })] }, route.id))) })) : (_jsxs(_Fragment, { children: [_jsxs("button", { type: "button", className: UI_Comp__css.back_button, onClick: () => { setSelectedRoute(null); setErrorMsg(undefined); setStellarError(undefined); }, children: [_jsx("svg", { "aria-hidden": "true", viewBox: "0 0 16 16", fill: "none", children: _jsx("path", { d: "M10 3 5 8l5 5M5 8h8", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }) }), "All connection options"] }), _jsxs("div", { className: UI_Comp__css.wallet_panel, children: [_jsx("p", { className: UI_Comp__css.panel_label, children: "AVAILABLE WALLETS" }), _jsxs("div", { className: UI_Comp__css.wallet_options, children: [selectedRoute === "browser-evm" && _jsx(WalletButton, { connectorGroup: "browser", onStatusChange: ({ isPending, error }) => { setLoading(isPending); setErrorMsg(error); } }), selectedRoute === "walletconnect" && _jsx(WalletButton, { connectorGroup: "walletconnect", onStatusChange: ({ isPending, error }) => { setLoading(isPending); setErrorMsg(error); } }), selectedRoute === "stellar" && _jsx(StellarWalletButton, { onConnect: (accountId) => {
                                                setStellarWallet((current) => ({ ...current, address: accountId }));
                                                if (!jwtSession)
                                                    void handleLoadStellarBalance(accountId);
                                            }, onStatusChange: ({ isPending, error, address: accountId, network }) => {
                                                setStellarLoading(isPending);
                                                setStellarError(error);
                                                if (accountId) {
                                                    setStellarWallet((current) => ({ ...current, address: accountId }));
                                                    if (!jwtSession)
                                                        void handleLoadStellarBalance(accountId);
                                                }
                                                if (network)
                                                    setStellarWallet((current) => ({ ...current, network }));
                                            } })] }), _jsx("p", { className: UI_Comp__css.panel_note, children: selectedRoute === "walletconnect" ? "Scan the QR code with your mobile wallet to continue." : selectedRoute === "stellar" ? "Freighter will ask you to approve access to your Stellar account." : "Choose an installed browser wallet to continue." })] })] })), (errorMsg || stellarError) && _jsx("div", { className: UI_Comp__css.error_message, role: "alert", children: errorMsg || stellarError }), _jsxs("div", { className: UI_Comp__css.modal_footer, children: [_jsx("span", { children: "Connecting only shares your public wallet address." }), footer] })] }) }));
}
