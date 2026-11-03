"use client";
import { configureCordyAssets, cordy_balance, cordy_bridge, cordy_swap, cordy_transfer } from "./transfer";
import { getConsUrl } from "./consRuntime";
const STELLAR_WALLET_STORAGE_KEY = "cordy_minikit_stellar_wallet";
const ACTIVE_WALLET_SESSION_KEY = "cordy_minikit_active_wallet_session";
export async function cons_verify() {
    try {
        const response = await fetch(getConsUrl("session"), { credentials: "same-origin", cache: "no-store" });
        const body = await response.json();
        return {
            success: response.ok && body?.success === true,
            authenticated: response.ok && body?.success === true,
            ...(typeof body?.address === "string" ? { address: body.address } : {}),
            ...(body?.chain === "evm" || body?.chain === "stellar" ? { chain: body.chain } : {}),
            ...(typeof body?.message === "string" ? { message: body.message } : {}),
        };
    }
    catch {
        return { success: false, authenticated: false, message: "Could not check the authentication session." };
    }
}
export async function cons_disconnect() {
    let serverCleared = false;
    let walletDisconnected = false;
    let message;
    try {
        const response = await fetch(getConsUrl("disconnect"), { method: "POST", credentials: "same-origin" });
        const body = await response.json().catch(() => null);
        serverCleared = response.ok && body?.success === true;
        if (!serverCleared)
            message = typeof body?.message === "string" ? body.message : "Could not clear the server session.";
        else if (typeof window !== "undefined")
            window.dispatchEvent(new Event("cordy:cons-session-cleared"));
    }
    catch {
        message = "Could not reach the server to clear the session.";
    }
    try {
        const { disconnect } = await import("wagmi/actions");
        const { getActiveWagmiConfig } = await import("../config/walletConfig");
        const config = getActiveWagmiConfig();
        const connections = Array.from(config.state.connections.values());
        for (const connection of connections)
            await disconnect(config, { connector: connection.connector });
        window.localStorage.removeItem(STELLAR_WALLET_STORAGE_KEY);
        window.localStorage.removeItem(ACTIVE_WALLET_SESSION_KEY);
        window.dispatchEvent(new Event("cordy:disconnect-stellar-wallet"));
        walletDisconnected = true;
    }
    catch {
        message = message ?? "Wallet disconnect failed.";
    }
    return { success: serverCleared && walletDisconnected, walletDisconnected, ...(message ? { error: message } : {}) };
}
export const cordy = {
    configure: configureCordyAssets,
    cons_verify,
    cons_disconnect,
    balance: cordy_balance,
    transfer: cordy_transfer,
    swap: cordy_swap,
    bridge: cordy_bridge,
};
