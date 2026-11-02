import type { BridgeEvmWalletRequest } from "./useBridgeEvmWallet";

type PendingSession = {
  request: BridgeEvmWalletRequest;
  resolve: (address: string) => void;
  reject: (error: Error) => void;
};

let pendingSession: PendingSession | undefined;
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

export function subscribeBridgeWalletSession(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getBridgeWalletSession(): PendingSession["request"] | undefined {
  return pendingSession?.request;
}

export function waitForBridgeEvmWallet(request: BridgeEvmWalletRequest): Promise<string> {
  if (pendingSession) {
    return Promise.reject(new Error("Another bridge wallet connection is already in progress."));
  }
  return new Promise((resolve, reject) => {
    pendingSession = { request, resolve, reject };
    notify();
  });
}

export function resolveBridgeWalletSession(address: string): void {
  const session = pendingSession;
  if (!session) return;
  pendingSession = undefined;
  notify();
  session.resolve(address);
}

export function rejectBridgeWalletSession(message = "EVM wallet connection was cancelled."): void {
  const session = pendingSession;
  if (!session) return;
  pendingSession = undefined;
  notify();
  session.reject(new Error(message));
}
