"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { UI_Comp__css } from "../css";
import { WalletButton, getTokenBalance } from "../controllers";
import { useWalletModal } from "../wagmi__providers";
import { useAccount, useDisconnect } from "wagmi";
import { FaUser } from 'react-icons/fa';
import { useState, useEffect } from "react";
import pkg from "../package.json";
import links from "../config/links.json";
import { useNetworkGuard } from "../hooks/useNetworkGuard";
export default function UI_Comp() {
    const { closeModal } = useWalletModal();
    const { isConnected, address, chain } = useAccount();
    const { disconnect } = useDisconnect();
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState();
    const [balance, setBalance] = useState("");
    const [symbol, setSymbol] = useState("");
    // Enable network guard to prevent network switching
    const { isEnforcing, isCorrectNetwork } = useNetworkGuard({
        enabled: isConnected,
        onWrongNetwork: () => {
            console.warn("⚠️ User attempted to switch network - forcing back to correct network");
        }
    });
    useEffect(() => {
        Get_Balance();
    }, [balance]);
    const Get_Balance = async () => {
        if (!address || !process.env.NEXT_PUBLIC_TOKENADDRESS)
            return;
        const { balance, symbol } = await getTokenBalance(address, process.env.NEXT_PUBLIC_TOKENADDRESS);
        setBalance(balance);
        setSymbol(symbol);
        return;
    };
    if (isConnected) {
        if (balance === "") {
            Get_Balance();
        }
        return (_jsx("div", { className: UI_Comp__css.container, children: _jsxs("div", { className: UI_Comp__css.connector, children: [_jsx("p", { className: UI_Comp__css.closed, onClick: closeModal, children: "\u2715" }), isConnected && (_jsxs("div", { className: UI_Comp__css.info, children: [isEnforcing && (_jsx("p", { style: { color: "#fa0", marginBottom: "10px" }, children: "\uD83D\uDD04 Switching to correct network..." })), !isCorrectNetwork && !isEnforcing && (_jsx("p", { style: { color: "#f00", marginBottom: "10px" }, children: "\u26A0\uFE0F Wrong network detected" })), balance ? (_jsxs("span", { children: [_jsx(FaUser, { size: 70 }), _jsx("p", { style: { color: "#0f0" }, children: "Connected" }), _jsxs("p", { style: { color: "#2f9" }, children: ["Network: ", chain?.name || "Unknown"] }), _jsxs("p", { style: { color: "#0ff" }, children: ["Balance: ", Number(balance).toFixed(2), " ", symbol] }), _jsx("p", { style: { color: "#ff0" }, children: address })] })) : (_jsx("p", { style: { color: "var(--foreground_wagmi)" }, children: "Loading balance..." }))] })), _jsx("button", { onClick: () => {
                            closeModal();
                            disconnect();
                        }, children: "DisConnect" }), _jsxs("a", { href: links.NPM_Pack_links, children: ["Powered By CordyStackX | Version ", pkg.version] })] }) }));
    }
    return (_jsx("div", { className: UI_Comp__css.container, children: _jsxs("div", { className: UI_Comp__css.connector, children: [_jsx("p", { className: UI_Comp__css.closed, onClick: closeModal, children: "\u2715" }), _jsx("h2", { children: "Connect Your Wallet" }), _jsxs("div", { children: [_jsx("h3", { children: loading ? "Loading..." : "" }), _jsx(WalletButton, { onStatusChange: ({ isPending, error }) => {
                                setLoading(isPending);
                                setErrorMsg(error);
                            } }), _jsx("p", { children: errorMsg })] }), _jsxs("a", { href: links.NPM_Pack_links, children: ["Powered By CordyStackX | Version ", pkg.version] })] }) }));
}
