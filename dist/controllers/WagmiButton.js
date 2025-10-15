"use client";
import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useEffect } from "react";
import { useConnect } from "wagmi";
export default function WalletButton({ onStatusChange }) {
    const { connectors, connectAsync, status } = useConnect();
    const [pendingConnector, setPendingConnector] = React.useState(null);
    const [errorMsg, setErrorMsg] = React.useState(undefined);
    // Derived isPending (true/false only)
    const isPending = status === "pending";
    // Notify parent whenever status changes
    useEffect(() => {
        if (onStatusChange) {
            onStatusChange({
                isPending,
                error: errorMsg,
            });
        }
    }, [isPending, errorMsg, onStatusChange]);
    return (_jsx(_Fragment, { children: connectors.map((connector) => (_jsx(WalletOption, { connector: connector, onClick: async () => {
                setPendingConnector(connector);
                setErrorMsg(undefined); // reset old errors
                try {
                    await connectAsync({ connector });
                }
                catch (err) {
                    setErrorMsg(err?.message || "Connection failed");
                }
                finally {
                    setPendingConnector(null);
                }
            }, isPending: pendingConnector?.uid === connector.uid && isPending }, connector.uid))) }));
}
function WalletOption({ connector, onClick, isPending }) {
    const [ready, setReady] = React.useState(false);
    React.useEffect(() => {
        (async () => {
            const provider = await connector.getProvider();
            setReady(!!provider);
        })();
    }, [connector]);
    return (_jsx("button", { disabled: !ready || isPending, onClick: onClick, children: isPending ? "Connecting..." : connector.name }));
}
