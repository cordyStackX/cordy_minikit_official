"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { requestAccess, getNetworkDetails } from "@stellar/freighter-api";
import img_src from "../config/Image.json";
export default function StellarWalletButton({ onConnect, onStatusChange, }) {
    const [address, setAddress] = useState(null);
    const [isPending, setIsPending] = useState(false);
    const [errorMsg, setErrorMsg] = useState();
    const [network, setNetwork] = useState();
    const connect = async () => {
        setIsPending(true);
        setErrorMsg(undefined);
        onStatusChange?.({ isPending: true });
        try {
            const access = await requestAccess();
            const publicKey = access.address;
            setAddress(publicKey);
            const networkDetails = await getNetworkDetails();
            setNetwork(networkDetails.network || "Unknown");
            onConnect?.(publicKey);
            onStatusChange?.({
                isPending: false,
                address: publicKey,
                network: networkDetails.network || "Unknown",
            });
        }
        catch (err) {
            const message = err instanceof Error ? err.message : "Freighter connection failed";
            console.error("Freighter error:", err);
            setErrorMsg(message);
            onStatusChange?.({ isPending: false, error: message });
        }
        finally {
            setIsPending(false);
        }
    };
    return (_jsxs("button", { onClick: connect, disabled: isPending, children: [_jsx("img", { src: img_src.Freighter, alt: "Freighter", title: "Freighter", width: 23, height: 18 }), isPending
                ? "Connecting..."
                : address
                    ? `Connected: ${address.slice(0, 6)}...`
                    : "Freighter", network ? ` • ${network}` : "", errorMsg ? ` • ${errorMsg}` : ""] }));
}
