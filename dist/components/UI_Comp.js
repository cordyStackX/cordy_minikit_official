"use client";
import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { UI_Comp__css } from "../css";
import { WalletButton, getTokenBalance, StellarWalletButton, loadStellarBalance, useDisconnectWallets } from "../controllers";
import { useWalletModal, useStellarWallet } from "../wagmi__providers";
import { useAccount } from "wagmi";
import { useSignMessage } from "wagmi";
import { useRouter } from "next/navigation";
import { signTransaction as freighterSignTransaction } from "@stellar/freighter-api";
import { WebAuth } from "@stellar/stellar-sdk";
import { createSiweMessage } from "viem/siwe";
import { useState, useEffect, useRef } from "react";
import pkg from "../package.json";
import links from "../config/links.json";
const ACTIVE_WALLET_SESSION_KEY = "cordy_minikit_active_wallet_session";
const walletRoutes = [
    { id: "browser-evm", title: "EVM · Browser", subtitle: "Use MetaMask, Coinbase Wallet, or another extension", icon: "E", hint: "Browser" },
    { id: "walletconnect", title: "WalletConnect · Mobile", subtitle: "Connect with a wallet on your phone using a QR code", icon: "W", hint: "QR code" },
    { id: "stellar", title: "Stellar · Non-EVM", subtitle: "Connect a Stellar account with Freighter", icon: "✦", hint: "Freighter" },
];
function CordyLogo() {
    return (_jsxs("svg", { viewBox: "0 0 512 512", role: "img", "aria-label": "Cordy Minikit", children: [_jsxs("defs", { children: [_jsxs("linearGradient", { id: "cordy-logo-gradient", x1: "140", y1: "140", x2: "350", y2: "380", gradientUnits: "userSpaceOnUse", children: [_jsx("stop", { offset: "0", stopColor: "#F2F4F8" }), _jsx("stop", { offset: "1", stopColor: "#AEBBD6" })] }), _jsxs("linearGradient", { id: "cordy-star-gradient", x1: "307", y1: "218", x2: "383", y2: "294", gradientUnits: "userSpaceOnUse", children: [_jsx("stop", { offset: "0", stopColor: "#4F8CFF" }), _jsx("stop", { offset: "1", stopColor: "#5CE1E6" })] })] }), _jsx("rect", { width: "512", height: "512", rx: "112", fill: "#111214" }), _jsx("path", { d: "M355.6 172.4 A130 130 0 1 0 355.6 339.6 A105 105 0 1 1 355.6 172.4 Z", fill: "url(#cordy-logo-gradient)" }), _jsx("path", { d: "M345 218 Q345 256 383 256 Q345 256 345 294 Q345 256 307 256 Q345 256 345 218 Z", fill: "url(#cordy-star-gradient)" })] }));
}
export default function UI_Comp() {
    const { openModal, closeModal, consSession, consPath, navigate, setSignedResult, authError, setAuthError } = useWalletModal();
    const { stellarWallet, setStellarWallet } = useStellarWallet();
    const { isConnected, address, chain } = useAccount();
    const { signMessageAsync } = useSignMessage();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState();
    const [balance, setBalance] = useState("");
    const [symbol, setSymbol] = useState("");
    const [stellarLoading, setStellarLoading] = useState(false);
    const [stellarError, setStellarError] = useState();
    const [selectedRoute, setSelectedRoute] = useState(null);
    const { disconnectEVM, disconnectStellar } = useDisconnectWallets();
    const signingAttempt = useRef(null);
    useEffect(() => {
        if (!consSession) {
            signingAttempt.current = null;
            return;
        }
        const stellarPreferred = selectedRoute === "stellar" ||
            (typeof window !== "undefined" && window.localStorage.getItem(ACTIVE_WALLET_SESSION_KEY) === "stellar");
        const useStellar = stellarPreferred && Boolean(stellarWallet.address);
        const evmAddress = address;
        const evmChain = chain;
        if ((!useStellar && (!isConnected || !evmAddress || !evmChain)) || (useStellar && !stellarWallet.network))
            return;
        const account = useStellar ? stellarWallet.address : evmAddress;
        const attemptKey = `${useStellar ? "stellar" : "evm"}:${account}`;
        if (signingAttempt.current === attemptKey)
            return;
        signingAttempt.current = attemptKey;
        setAuthError(undefined);
        void (async () => {
            try {
                let signedPayload;
                if (useStellar) {
                    const detectedNetwork = String(stellarWallet.network).toLowerCase();
                    if (detectedNetwork !== "testnet" && detectedNetwork !== "public") {
                        throw new Error("Freighter must be connected to Stellar Testnet or Public network.");
                    }
                    const networkName = detectedNetwork;
                    const host = window.location.host;
                    const challengeResponse = await fetch(`${consPath}/challenge`, {
                        method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" },
                        body: JSON.stringify({ chain: "stellar", account, network: networkName }),
                    });
                    const challenge = await challengeResponse.json();
                    if (!challengeResponse.ok || challenge?.success !== true || challenge.chain !== "stellar") {
                        throw new Error(typeof challenge?.message === "string" ? challenge.message : "Could not get Stellar authentication challenge.");
                    }
                    if (typeof challenge.transaction !== "string" || typeof challenge.network_passphrase !== "string" || typeof challenge.server_account !== "string" || typeof challenge.home_domain !== "string" || typeof challenge.web_auth_domain !== "string") {
                        throw new Error("The server returned an incomplete Stellar challenge.");
                    }
                    if (challenge.home_domain !== host || challenge.web_auth_domain !== host)
                        throw new Error("The Stellar challenge domain does not match this app.");
                    const parsed = WebAuth.readChallengeTx(challenge.transaction, challenge.server_account, challenge.network_passphrase, host, host);
                    if (parsed.clientAccountID !== account)
                        throw new Error("The Stellar challenge account does not match the connected wallet.");
                    if (parsed.matchedHomeDomain !== host)
                        throw new Error("The Stellar challenge home domain does not match this app.");
                    const result = await freighterSignTransaction(challenge.transaction, { networkPassphrase: challenge.network_passphrase, address: account });
                    if (result.error)
                        throw new Error(result.error.message || "The Stellar challenge could not be signed.");
                    if (!result.signedTxXdr || result.signerAddress !== account)
                        throw new Error("Freighter returned a signature for a different account.");
                    signedPayload = { chain: "stellar", address: account, network: networkName, signedXdr: result.signedTxXdr };
                }
                else {
                    const network = evmChain.testnet ? "testnet" : "public";
                    const challengeResponse = await fetch(`${consPath}/challenge`, {
                        method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" },
                        body: JSON.stringify({ chain: "evm", account, network }),
                    });
                    const challenge = await challengeResponse.json();
                    if (!challengeResponse.ok || challenge?.success !== true || challenge.chain !== "evm" || typeof challenge.nonce !== "string") {
                        throw new Error(typeof challenge?.message === "string" ? challenge.message : "Could not get EVM authentication challenge.");
                    }
                    const message = createSiweMessage({
                        domain: window.location.host,
                        address: evmAddress,
                        statement: "Sign in to Cordy Minikit.",
                        uri: window.location.origin,
                        version: "1",
                        chainId: evmChain.id,
                        nonce: challenge.nonce,
                        issuedAt: new Date(),
                        expirationTime: new Date(Date.now() + 5 * 60 * 1000),
                    });
                    const signature = await signMessageAsync({ message });
                    signedPayload = { chain: "evm", address: evmAddress, network, signature, message };
                }
                setSignedResult(signedPayload);
                const verifyResponse = await fetch(`${consPath}/verify`, {
                    method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify(signedPayload),
                });
                const verifyBody = await verifyResponse.json().catch(() => ({}));
                if (verifyResponse.ok && verifyBody?.success === true) {
                    window.dispatchEvent(new Event("cordy:cons-session-authenticated"));
                    closeModal();
                    if (navigate)
                        router.replace(navigate);
                    return;
                }
                throw new Error(typeof verifyBody?.message === "string" ? verifyBody.message : "Signature verification failed.");
            }
            catch (error) {
                const message = error instanceof Error ? error.message : "Authentication signing failed.";
                const stellarAttempt = attemptKey.startsWith("stellar:");
                if (stellarAttempt)
                    await disconnectStellar();
                else
                    await disconnectEVM();
                openModal({ consSession: true, navigate });
                setAuthError(message.toLowerCase().includes("reject") || message.toLowerCase().includes("denied")
                    ? "You rejected the signature request. The wallet was disconnected."
                    : `Could not complete wallet signing: ${message}`);
                signingAttempt.current = null;
            }
        })();
    }, [address, chain, closeModal, consPath, consSession, disconnectEVM, disconnectStellar, isConnected, navigate, openModal, router, selectedRoute, setAuthError, setSignedResult, signMessageAsync, stellarWallet.address, stellarWallet.network]);
    useEffect(() => {
        if (!consSession && isConnected && address)
            void Get_Balance();
    }, [isConnected, address, consSession]);
    useEffect(() => {
        if (!consSession && stellarWallet.address)
            void loadStellarBalance(stellarWallet.address);
    }, [stellarWallet.address, consSession]);
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
        return (_jsx("div", { className: UI_Comp__css.container, children: _jsxs("section", { className: UI_Comp__css.connector, role: "dialog", "aria-modal": "true", "aria-labelledby": "wallet-modal-title", children: [_jsxs("header", { className: UI_Comp__css.modal_header, children: [_jsx("div", { className: UI_Comp__css.brand_mark, children: _jsx(CordyLogo, {}) }), _jsxs("div", { children: [_jsx("p", { className: UI_Comp__css.eyebrow, children: "CORDY MINIKIT" }), _jsx("h2", { id: "wallet-modal-title", children: "Wallet connected" })] }), _jsx("button", { className: UI_Comp__css.close_button, type: "button", onClick: closeModal, "aria-label": "Close wallet dialog", children: "\u00D7" })] }), _jsxs("div", { className: UI_Comp__css.connected_card, children: [_jsxs("div", { className: UI_Comp__css.connected_heading, children: [_jsx("span", { className: UI_Comp__css.connected_dot }), " ", isStellar ? "Stellar wallet" : "EVM wallet", _jsx("span", { className: UI_Comp__css.network_badge, children: connectedNetwork })] }), !consSession && _jsxs(_Fragment, { children: [_jsx("div", { className: UI_Comp__css.balance_value, children: connectedBalance }), _jsx("p", { className: UI_Comp__css.muted, children: isStellar ? "Native balance" : "Token balance" })] }), _jsxs("div", { className: UI_Comp__css.address_row, children: [_jsx("span", { children: "Address" }), _jsx("code", { title: connectedAddress || "", children: truncateAddress(connectedAddress, 12, 8) })] }), authError && _jsx("p", { className: UI_Comp__css.error_message, role: "status", children: authError }), isStellar && stellarError && _jsx("p", { className: UI_Comp__css.error_message, role: "alert", children: stellarError })] }), consSession && !authError && _jsx("p", { className: UI_Comp__css.loading_notice, role: "status", children: "Check your wallet and approve the sign-in request to confirm ownership. This signs a message only; it does not send a transaction." }), _jsx("button", { className: UI_Comp__css.disconnect_button, type: "button", onClick: async () => { if (isStellar)
                            await disconnectStellar();
                        else
                            await disconnectEVM(); }, children: "Disconnect wallet" }), footer] }) }));
    }
    const selectedWalletRoute = walletRoutes.find((route) => route.id === selectedRoute);
    return (_jsx("div", { className: UI_Comp__css.container, children: _jsxs("section", { className: UI_Comp__css.connector, role: "dialog", "aria-modal": "true", "aria-labelledby": "wallet-modal-title", "aria-describedby": "wallet-modal-description", children: [_jsxs("header", { className: UI_Comp__css.modal_header, children: [_jsx("div", { className: UI_Comp__css.brand_mark, children: _jsx(CordyLogo, {}) }), _jsxs("div", { children: [_jsxs("p", { className: UI_Comp__css.eyebrow, children: ["CORDY MINIKIT ", _jsx("span", { children: "\u00B7" }), " WALLET ACCESS"] }), _jsx("h2", { id: "wallet-modal-title", children: selectedWalletRoute?.title || "Choose a wallet" })] }), _jsx("button", { className: UI_Comp__css.close_button, type: "button", onClick: closeModal, "aria-label": "Close wallet dialog", children: "\u00D7" })] }), _jsx("p", { id: "wallet-modal-description", className: UI_Comp__css.modal_description, children: selectedWalletRoute ? selectedWalletRoute.subtitle : "Select how you want to connect." }), (loading || stellarLoading) && _jsxs("div", { className: UI_Comp__css.loading_notice, role: "status", children: [_jsx("span", { className: UI_Comp__css.spinner }), " Waiting for wallet approval\u2026"] }), !selectedRoute ? (_jsx("div", { className: UI_Comp__css.wallet_choices, role: "group", "aria-label": "Wallet connection options", children: walletRoutes.map((route) => (_jsxs("button", { type: "button", className: UI_Comp__css.wallet_choice, onClick: () => { setErrorMsg(undefined); setStellarError(undefined); setSelectedRoute(route.id); }, children: [_jsx("span", { className: `${UI_Comp__css.choice_icon} ${route.id === "stellar" ? UI_Comp__css.stellar_choice_icon : ""}`, "aria-hidden": "true", children: route.icon }), _jsxs("span", { className: UI_Comp__css.choice_copy, children: [_jsx("span", { className: UI_Comp__css.choice_title, children: route.title }), _jsx("span", { className: UI_Comp__css.choice_subtitle, children: route.subtitle })] }), _jsx("span", { className: UI_Comp__css.choice_hint, children: route.hint }), _jsx("svg", { className: UI_Comp__css.choice_chevron, "aria-hidden": "true", viewBox: "0 0 16 16", fill: "none", children: _jsx("path", { d: "m6 3 5 5-5 5", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }) })] }, route.id))) })) : (_jsxs(_Fragment, { children: [_jsxs("button", { type: "button", className: UI_Comp__css.back_button, onClick: () => { setSelectedRoute(null); setErrorMsg(undefined); setStellarError(undefined); }, children: [_jsx("svg", { "aria-hidden": "true", viewBox: "0 0 16 16", fill: "none", children: _jsx("path", { d: "M10 3 5 8l5 5M5 8h8", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }) }), "All connection options"] }), _jsxs("div", { className: UI_Comp__css.wallet_panel, children: [_jsx("p", { className: UI_Comp__css.panel_label, children: "AVAILABLE WALLETS" }), _jsxs("div", { className: UI_Comp__css.wallet_options, children: [selectedRoute === "browser-evm" && _jsx(WalletButton, { connectorGroup: "browser", onStatusChange: ({ isPending, error }) => { setLoading(isPending); setErrorMsg(error); } }), selectedRoute === "walletconnect" && _jsx(WalletButton, { connectorGroup: "walletconnect", onStatusChange: ({ isPending, error }) => { setLoading(isPending); setErrorMsg(error); } }), selectedRoute === "stellar" && _jsx(StellarWalletButton, { onConnect: (accountId) => {
                                                setStellarWallet((current) => ({ ...current, address: accountId }));
                                                if (!consSession)
                                                    void handleLoadStellarBalance(accountId);
                                            }, onStatusChange: ({ isPending, error, address: accountId, network }) => {
                                                setStellarLoading(isPending);
                                                setStellarError(error);
                                                if (accountId) {
                                                    setStellarWallet((current) => ({ ...current, address: accountId }));
                                                    if (!consSession)
                                                        void handleLoadStellarBalance(accountId);
                                                }
                                                if (network)
                                                    setStellarWallet((current) => ({ ...current, network }));
                                            } })] }), _jsx("p", { className: UI_Comp__css.panel_note, children: selectedRoute === "walletconnect" ? "Scan the QR code with your mobile wallet to continue." : selectedRoute === "stellar" ? "Freighter will ask you to approve access to your Stellar account." : "Choose an installed browser wallet to continue." })] })] })), (errorMsg || stellarError || authError) && _jsx("div", { className: UI_Comp__css.error_message, role: "alert", children: errorMsg || stellarError || authError }), _jsxs("div", { className: UI_Comp__css.modal_footer, children: [_jsx("span", { children: "Connecting only shares your public wallet address." }), footer] })] }) }));
}
