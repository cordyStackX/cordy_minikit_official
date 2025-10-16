"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Image__src from "../config/Image.json";
import { UI_Comp__css } from "../css";
import { WalletButton, getTokenBalance } from "../controllers";
import { useWalletModal } from "../wagmi__providers";
import { useAccount, useDisconnect } from "wagmi";
import { FaUser } from 'react-icons/fa';
import { useState, useEffect } from "react";
export default function UI_Comp() {
    const { closeModal } = useWalletModal();
    const { isConnected, address } = useAccount();
    const { disconnect } = useDisconnect();
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState();
    const [balance, setBalance] = useState("");
    const [symbol, setSymbol] = useState("");
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
        return (_jsx("div", { className: UI_Comp__css.container, children: _jsxs("div", { className: UI_Comp__css.connector, children: [_jsx("p", { className: UI_Comp__css.closed, onClick: closeModal, children: "\u2715" }), isConnected && (_jsx("div", { className: UI_Comp__css.info, children: balance ? (_jsxs("span", { children: [_jsx(FaUser, { size: 70 }), _jsx("p", { style: { color: "#0f0" }, children: "Connected" }), _jsxs("p", { style: { color: "#0ff" }, children: ["Balance: ", Number(balance).toFixed(2), " ", symbol] }), _jsx("p", { style: { color: "#ff0" }, children: address })] })) : (_jsx("p", { style: { color: "var(--foreground_wagmi)" }, children: "Loading balance..." })) })), _jsx("button", { onClick: () => {
                            closeModal();
                            disconnect();
                        }, children: "DisConnect" }), _jsx("a", { href: "https://cordy-stack-x.vercel.app/", children: "Powered By CordyStackX" })] }) }));
    }
    return (_jsx("div", { className: UI_Comp__css.container, children: _jsxs("div", { className: UI_Comp__css.connector, children: [_jsx("p", { className: UI_Comp__css.closed, onClick: closeModal, children: "\u2715" }), _jsx("img", { src: Image__src.logo, width: 50, height: 50 }), _jsx("h2", { children: "Cordy MiniKit" }), _jsxs("div", { children: [_jsx("h3", { children: loading ? "Loading..." : "" }), _jsx(WalletButton, { onStatusChange: ({ isPending, error }) => {
                                setLoading(isPending);
                                setErrorMsg(error);
                            } }), _jsx("p", { children: errorMsg })] }), _jsx("a", { href: "https://cordy-stack-x.vercel.app/", children: "Powered By CordyStackX" })] }) }));
}
