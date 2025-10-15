"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Image__src from "../config/Image.json";
import { UI_Comp__css } from "../css";
import { WalletButton, Disconnect } from "../controllers";
import { useWalletModal } from "../wagmi__providers";
import { useAccount, useBalance } from "wagmi";
import { FaUser } from 'react-icons/fa';
import { useState } from "react";
export default function UI_Comp() {
    const { closeModal } = useWalletModal();
    const { isConnected, address, chain } = useAccount();
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState();
    const { data, isLoading, error } = useBalance({
        address,
        token: process.env.NEXT_PUBLIC_TOKENADDRESS
    });
    if (isConnected) {
        return (_jsx("div", { className: UI_Comp__css.container, children: _jsxs("div", { className: UI_Comp__css.connector, children: [_jsx("p", { className: UI_Comp__css.closed, onClick: closeModal, children: "\u2715" }), isConnected && (_jsx("div", { className: UI_Comp__css.info, children: !isLoading && data ? (_jsxs("span", { children: [_jsx(FaUser, { size: 70 }), _jsx("p", { style: { color: "#0f0" }, children: "Connected" }), _jsxs("p", { style: { color: "#9f0" }, children: ["Network: ", chain?.name || 'Unknown'] }), _jsxs("p", { style: { color: "#0ff" }, children: ["Balance: ", Number(data?.formatted).toFixed(2), " ", data?.symbol] }), _jsx("p", { style: { color: "#ff0" }, children: address })] })) : error ? (_jsx("p", { style: { color: "#f00" }, children: "Error loading balance" })) : (_jsx("p", { style: { color: "var(--foreground_wagmi)" }, children: "Loading balance..." })) })), _jsx(Disconnect, {}), _jsx("a", { href: "https://cordy-stack-x.vercel.app/", children: "Powered By CordyStackX" })] }) }));
    }
    return (_jsx("div", { className: UI_Comp__css.container, children: _jsxs("div", { className: UI_Comp__css.connector, children: [_jsx("p", { className: UI_Comp__css.closed, onClick: closeModal, children: "\u2715" }), _jsx("img", { src: Image__src.logo, width: 50, height: 50 }), _jsx("h2", { children: "Cordy MiniKit" }), _jsxs("div", { children: [_jsx("h3", { children: loading ? "Loading..." : "" }), _jsx(WalletButton, { onStatusChange: ({ isPending, error }) => {
                                setLoading(isPending);
                                setErrorMsg(error);
                            } }), _jsx("p", { children: errorMsg })] }), _jsx("a", { href: "https://cordy-stack-x.vercel.app/", children: "Powered By CordyStackX" })] }) }));
}
