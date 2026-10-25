"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ConnectWalletBT, ProvidersClientWrapper } from "@cordystackx/cordy_minikit";
function PreviewContent() {
    return (_jsxs("main", { className: "preview-shell", children: [_jsx("div", { className: "preview-glow", "aria-hidden": "true" }), _jsxs("section", { className: "preview-card", children: [_jsxs("div", { className: "preview-brand", children: [_jsx("div", { className: "preview-logo", "aria-hidden": "true", children: "\u2733" }), _jsxs("div", { children: [_jsx("p", { className: "preview-brand-name", children: "Cordy Minikit" }), _jsx("p", { className: "preview-brand-caption", children: "Wallet connection preview" })] }), _jsx("span", { className: "preview-tag", children: "Local demo" })] }), _jsxs("div", { className: "preview-copy", children: [_jsx("p", { className: "preview-eyebrow", children: "EVM + STELLAR" }), _jsx("h1", { children: "Your wallets, one simple connection." }), _jsx("p", { children: "Preview the Minikit connection dialog. Choose an EVM wallet or connect Freighter for Stellar." })] }), _jsxs("div", { className: "preview-action", children: [_jsx(ConnectWalletBT, { className: "preview-connect-button" }), _jsx("p", { children: "This opens the updated wallet dialog. Connecting does not send a transaction." })] }), _jsxs("div", { className: "preview-wallets", "aria-label": "Supported wallets", children: [_jsx("span", { children: "MetaMask" }), _jsx("span", { children: "WalletConnect" }), _jsx("span", { children: "Coinbase Wallet" }), _jsx("span", { children: "Freighter" })] })] })] }));
}
export default function Home() {
    return _jsx(ProvidersClientWrapper, { children: _jsx(PreviewContent, {}) });
}
