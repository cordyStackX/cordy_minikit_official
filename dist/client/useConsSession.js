"use client";
import { useCallback, useEffect, useState } from "react";
import { getConsUrl } from "./consRuntime";
export function useConsSession() {
    const [session, setSession] = useState({ loading: true, authenticated: false });
    const refresh = useCallback(async () => {
        try {
            const response = await fetch(getConsUrl("session"), { credentials: "same-origin", cache: "no-store" });
            const body = await response.json();
            const authenticated = response.ok && body.success === true;
            setSession({
                loading: false,
                authenticated,
                ...(typeof body.address === "string" ? { address: body.address } : {}),
                ...(body.chain === "evm" || body.chain === "stellar" ? { chain: body.chain } : {}),
            });
            if (authenticated && typeof window !== "undefined")
                window.dispatchEvent(new Event("cordy:cons-session-active"));
        }
        catch {
            setSession({ loading: false, authenticated: false });
        }
    }, []);
    useEffect(() => {
        void refresh();
        const handleAuthenticated = () => { void refresh(); };
        const handleCleared = () => setSession({ loading: false, authenticated: false });
        window.addEventListener("cordy:cons-session-authenticated", handleAuthenticated);
        window.addEventListener("cordy:cons-session-cleared", handleCleared);
        return () => {
            window.removeEventListener("cordy:cons-session-authenticated", handleAuthenticated);
            window.removeEventListener("cordy:cons-session-cleared", handleCleared);
        };
    }, [refresh]);
    return session;
}
