"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { UI_Comp__css } from "../css";
import { WalletButton, getTokenBalance, StellarWalletButton, loadStellarBalance, useDisconnectWallets } from "../controllers";
import { useWalletModal, useStellarWallet } from "../wagmi__providers";
import { useAccount } from "wagmi";
import { FaUser } from 'react-icons/fa';
import { useState, useEffect } from "react";
import pkg from "../package.json";
import links from "../config/links.json";
const ACTIVE_WALLET_SESSION_KEY = "cordy_minikit_active_wallet_session";
export default function UI_Comp() {
    const { closeModal } = useWalletModal();
    const { stellarWallet, setStellarWallet } = useStellarWallet();
    const { isConnected, address, chain } = useAccount();
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState();
    const [balance, setBalance] = useState("");
    const [symbol, setSymbol] = useState("");
    const [stellarLoading, setStellarLoading] = useState(false);
    const [stellarError, setStellarError] = useState();
    const { disconnectEVM, disconnectStellar,
    // disconnectAll,                                                                                             
     } = useDisconnectWallets();
    useEffect(() => {
        if (isConnected && address) {
            Get_Balance();
        }
    }, [isConnected, address]);
    useEffect(() => {
        if (stellarWallet.address) {
            void loadStellarBalance(stellarWallet.address);
        }
    }, [stellarWallet.address]);
    const Get_Balance = async () => {
        if (!address)
            return;
        const { balance, symbol } = await getTokenBalance(address);
        setBalance(balance);
        setSymbol(symbol);
        return;
    };
    const handleLoadStellarBalance = async (accountId) => {
        setStellarError(undefined);
        try {
            const result = await loadStellarBalance(accountId);
            setStellarWallet((current) => ({
                ...current,
                address: result.address,
                network: result.network,
                balance: result.balance,
            }));
            if (typeof window !== "undefined") {
                window.localStorage.setItem(ACTIVE_WALLET_SESSION_KEY, "stellar");
            }
        }
        catch (err) {
            const message = err instanceof Error ? err.message : "Failed to load Stellar balance";
            console.error("Failed to load Stellar balance:", err);
            setStellarError(message);
            setStellarWallet((current) => ({
                ...current,
                balance: "0",
            }));
        }
    };
    const truncateAddress = (value, head = 8, tail = 4) => {
        if (!value)
            return "";
        if (value.length <= head + tail + 3)
            return value;
        return `${value.slice(0, head)}...${value.slice(-tail)}`;
    };
    // EVM
    if (isConnected) {
        return (_jsx("div", { className: UI_Comp__css.container, children: _jsxs("div", { className: UI_Comp__css.connector, children: [_jsx("p", { className: UI_Comp__css.closed, onClick: closeModal, children: "\u2715" }), _jsx("h2", { children: "Wallet Status" }), _jsxs("div", { className: UI_Comp__css.split_layout, children: [_jsxs("div", { className: UI_Comp__css.left_column, children: [_jsx("h3", { children: "EVM Wallet" }), _jsx("div", { className: UI_Comp__css.icon_wrap, children: _jsx(FaUser, { size: 70 }) })] }), _jsxs("div", { className: UI_Comp__css.right_column, children: [_jsx("h3", { children: "Status" }), balance ? (_jsx("div", { className: UI_Comp__css.info, children: _jsxs("div", { className: UI_Comp__css.status_stack, children: [_jsx("p", { style: { color: "#0f0" }, children: "Connected" }), _jsxs("p", { style: { color: "#2f9" }, children: ["Network: ", chain?.name || "Unknown"] }), _jsxs("p", { style: { color: "#0ff" }, children: ["Balance: ", Number(balance).toFixed(2), " ", symbol] }), _jsx("p", { className: UI_Comp__css.address, style: { color: "#ff0" }, title: address || "", children: truncateAddress(address) })] }) })) : (_jsxs("span", { className: UI_Comp__css.blockchain_loader, children: [_jsx("span", { className: UI_Comp__css.node }), _jsx("span", { className: UI_Comp__css.node }), _jsx("span", { className: UI_Comp__css.node })] }))] })] }), _jsx("button", { onClick: async () => {
                            const success = await disconnectEVM();
                            console.log("EVM disconnect:", success);
                        }, children: "DisConnect" }), _jsxs("a", { style: { marginTop: "2rem" }, href: links.NPM_Pack_links, children: ["Powered By CordyStackX | Version ", pkg.version] })] }) }));
    }
    //Non - EVM
    if (stellarWallet.address) {
        return (_jsx("div", { className: UI_Comp__css.container, children: _jsxs("div", { className: UI_Comp__css.connector, children: [_jsx("p", { className: UI_Comp__css.closed, onClick: closeModal, children: "\u2715" }), _jsx("h2", { children: "Wallet Status" }), _jsxs("div", { className: UI_Comp__css.split_layout, children: [_jsxs("div", { className: UI_Comp__css.left_column, children: [_jsx("h3", { children: "Stellar Wallet" }), _jsx("div", { className: UI_Comp__css.icon_wrap, children: _jsx(FaUser, { size: 70 }) })] }), _jsxs("div", { className: UI_Comp__css.right_column, children: [_jsx("h3", { children: "Status" }), stellarWallet.balance ? (_jsxs("div", { className: UI_Comp__css.status_stack, children: [_jsx("p", { style: { color: "#0f0" }, children: "Connected" }), _jsxs("p", { style: { color: "#2f9" }, children: ["Network: ", stellarWallet.network || "Stellar"] }), _jsxs("p", { style: { color: "#0ff" }, children: ["Balance: ", stellarWallet.balance ?? "0", " XLM"] }), _jsx("p", { className: UI_Comp__css.address, style: { color: "#ff0" }, title: stellarWallet.address || "", children: truncateAddress(stellarWallet.address) }), stellarError ? _jsx("p", { style: { color: "#f55" }, children: stellarError }) : null] })) : (_jsxs("span", { className: UI_Comp__css.blockchain_loader, children: [_jsx("span", { className: UI_Comp__css.node }), _jsx("span", { className: UI_Comp__css.node }), _jsx("span", { className: UI_Comp__css.node })] }))] })] }), _jsx("button", { onClick: async () => {
                            const success = await disconnectStellar();
                            console.log("EVM disconnect:", success);
                        }, children: "DisConnect" }), _jsxs("a", { style: { marginTop: "2rem" }, href: links.NPM_Pack_links, children: ["Powered By CordyStackX | Version ", pkg.version] })] }) }));
    }
    return (_jsx("div", { className: UI_Comp__css.container, children: _jsxs("div", { className: UI_Comp__css.connector, children: [loading || stellarLoading ? (_jsxs("span", { className: UI_Comp__css.blockchain_loader, children: [_jsx("span", { className: UI_Comp__css.node }), _jsx("span", { className: UI_Comp__css.node }), _jsx("span", { className: UI_Comp__css.node })] })) : null, _jsx("p", { className: UI_Comp__css.closed, onClick: closeModal, children: "\u2715" }), _jsx("h2", { children: "Connect Your Wallet" }), _jsxs("div", { className: UI_Comp__css.split_layout, children: [_jsxs("div", { className: UI_Comp__css.left_column, children: [_jsx("h3", { children: "EVM Wallets" }), _jsx(WalletButton, { onStatusChange: ({ isPending, error }) => {
                                        setLoading(isPending);
                                        setErrorMsg(error);
                                    } })] }), _jsxs("div", { className: UI_Comp__css.right_column, children: [_jsx("h3", { children: "Non - EVM Wallets" }), _jsx(StellarWalletButton, { onConnect: (address) => {
                                        setStellarWallet((current) => ({ ...current, address }));
                                        void handleLoadStellarBalance(address);
                                    }, onStatusChange: ({ isPending, error, address, network }) => {
                                        setStellarLoading(isPending);
                                        setStellarError(error);
                                        if (address)
                                            setStellarWallet((current) => ({ ...current, address }));
                                        if (network) {
                                            setStellarWallet((current) => ({ ...current, network }));
                                        }
                                        if (address)
                                            void handleLoadStellarBalance(address);
                                    } })] })] }), _jsx("p", { style: { color: "#f00" }, children: errorMsg }), _jsx("p", { style: { color: "#f00" }, children: stellarError }), _jsxs("a", { style: { marginTop: "2rem" }, href: links.NPM_Pack_links, children: ["Powered By CordyStackX | Version ", pkg.version] })] }) }));
}
