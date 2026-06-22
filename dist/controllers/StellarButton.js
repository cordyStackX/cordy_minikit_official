"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { useState } from "react";
import * as Freighter from "@stellar/freighter-api";
export default function StellarWalletButton({ onConnect, }) {
    const [address, setAddress] = useState(null);
    const connect = async () => {
        try {
            // 👇 force runtime access (ignore TS mismatch)
            const publicKey = await Freighter.getPublicKey();
            setAddress(publicKey);
            onConnect?.(publicKey);
        }
        catch (err) {
            console.error("Freighter error:", err);
        }
    };
    return (_jsx("button", { onClick: connect, children: address
            ? `Connected: ${address.slice(0, 6)}...`
            : "Connect Freighter" }));
}
