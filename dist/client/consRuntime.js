const DEFAULT_CONS_PATH = "/services/cons";
let activeConsPath = DEFAULT_CONS_PATH;
export function setConsPath(path) {
    if (path === undefined) {
        activeConsPath = DEFAULT_CONS_PATH;
        return;
    }
    const normalized = path.trim().replace(/\/+$/, "");
    if (!normalized.startsWith("/") || normalized.startsWith("//") || /[?#\\]/.test(normalized)) {
        throw new Error('ProvidersClientWrapper: "consPath" must be a same-origin path such as "/services/cons".');
    }
    activeConsPath = normalized;
}
export function getConsPath() {
    return activeConsPath;
}
export function getConsUrl(action, base = activeConsPath) {
    return `${base}/${action}`;
}
export async function requestConsDisconnect(base = activeConsPath) {
    try {
        const response = await fetch(getConsUrl("disconnect", base), { method: "POST", credentials: "same-origin" });
        const body = await response.json().catch(() => null);
        const success = response.ok && body?.success === true;
        if (success && typeof window !== "undefined")
            window.dispatchEvent(new Event("cordy:cons-session-cleared"));
        return success;
    }
    catch {
        return false;
    }
}
