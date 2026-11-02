let pendingSession;
const listeners = new Set();
function notify() {
    listeners.forEach((listener) => listener());
}
export function subscribeBridgeWalletSession(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}
export function getBridgeWalletSession() {
    return pendingSession?.request;
}
export function waitForBridgeEvmWallet(request) {
    if (pendingSession) {
        return Promise.reject(new Error("Another bridge wallet connection is already in progress."));
    }
    return new Promise((resolve, reject) => {
        pendingSession = { request, resolve, reject };
        notify();
    });
}
export function resolveBridgeWalletSession(address) {
    const session = pendingSession;
    if (!session)
        return;
    pendingSession = undefined;
    notify();
    session.resolve(address);
}
export function rejectBridgeWalletSession(message = "EVM wallet connection was cancelled.") {
    const session = pendingSession;
    if (!session)
        return;
    pendingSession = undefined;
    notify();
    session.reject(new Error(message));
}
