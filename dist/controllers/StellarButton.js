"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { requestAccess, getNetworkDetails, isConnected, } from "@stellar/freighter-api";
import img_src from "../config/Image.json";
const FREIGHTER_DOWNLOAD_URL = "https://www.freighter.app/";
function isMobileDevice() {
    if (typeof navigator === "undefined")
        return false;
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}
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
            const connection = await isConnected();
            if (!connection.isConnected) {
                const message = isMobileDevice()
                    ? "Open this page in Freighter mobile or install Freighter to connect."
                    : "Freighter is not installed.";
                if (isMobileDevice() && typeof window !== "undefined") {
                    window.open(FREIGHTER_DOWNLOAD_URL, "_blank", "noopener,noreferrer");
                }
                setErrorMsg(message);
                onStatusChange?.({ isPending: false, error: message });
                return;
            }
            const access = await requestAccess();
            if (access.error) {
                throw new Error(access.error.message);
            }
            const publicKey = access.address;
            setAddress(publicKey);
            const networkDetails = await getNetworkDetails();
            if (networkDetails.error) {
                throw new Error(networkDetails.error.message);
            }
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
    return (_jsxs("button", { onClick: connect, disabled: isPending, children: [_jsx("img", { src: img_src.Freighter, alt: "Freighter", title: "Freighter", width: 18, height: 18 }), isPending
                ? "Connecting..."
                : address
                    ? `Connected: ${address.slice(0, 6)}...`
                    : "Freighter"] }));
}
