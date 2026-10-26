"use client";
import { configureCordyAssets, cordy_balance, cordy_bridge, cordy_swap, cordy_transfer } from "./transfer";
/** Ask the app server whether the current browser session is authenticated. */
export async function jwt_verify(options = {}) {
    const response = await fetch(options.endpoint ?? "/api/auth/session", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: { Accept: "application/json" },
    });
    if (response.status === 401 || response.status === 403) {
        return { authenticated: false };
    }
    if (!response.ok) {
        throw new Error(`Session check failed (${response.status})`);
    }
    const data = await response.json();
    if (typeof data === "object" && data !== null) {
        return { ...data, authenticated: true };
    }
    return { authenticated: true };
}
/** @deprecated Use jwt_verify instead. */
export const jwt_confirm = jwt_verify;
/** Ask the app server to revoke and clear the current HttpOnly session cookie. */
export async function jwt_disconnect(options = {}) {
    let status;
    let sessionCleared = false;
    let errorMessage;
    try {
        const response = await fetch(options.endpoint ?? "/api/auth/logout", {
            method: "POST",
            credentials: "include",
            cache: "no-store",
            headers: { Accept: "application/json" },
        });
        status = response.status;
        // A missing or expired session is already logged out.
        sessionCleared = response.ok || response.status === 401;
        if (!sessionCleared)
            errorMessage = `Session logout failed (${response.status})`;
    }
    catch (error) {
        errorMessage = error instanceof Error ? error.message : "Session logout request failed";
    }
    let walletDisconnected = false;
    if (typeof window !== "undefined") {
        try {
            const { disconnect } = await import("wagmi/actions");
            const { getActiveWagmiConfig } = await import("../config/walletConfig");
            const config = getActiveWagmiConfig();
            const connections = Array.from(config.state.connections.values());
            for (const connection of connections) {
                await disconnect(config, { connector: connection.connector });
            }
            window.localStorage.removeItem("cordy_minikit_stellar_wallet");
            window.localStorage.removeItem("cordy_minikit_active_wallet_session");
            window.dispatchEvent(new Event("cordy:disconnect-stellar-wallet"));
            walletDisconnected = true;
        }
        catch (error) {
            errorMessage ?? (errorMessage = error instanceof Error ? error.message : "Wallet disconnect failed");
        }
    }
    else {
        errorMessage ?? (errorMessage = "Wallet disconnect is only available in the browser");
    }
    return {
        success: sessionCleared && walletDisconnected,
        walletDisconnected,
        status,
        ...(errorMessage ? { error: errorMessage } : {}),
    };
}
export const cordy = {
    configure: configureCordyAssets,
    jwt_verify,
    jwt_confirm,
    jwt_disconnect,
    balance: cordy_balance,
    transfer: cordy_transfer,
    swap: cordy_swap,
    bridge: cordy_bridge,
};
