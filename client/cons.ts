"use client";

import { configureCordyAssets, cordy_balance, cordy_bridge, cordy_swap, cordy_transfer } from "./transfer";

export type ConsVerifyResult = {
  /** Application-level status; no HTTP request is made. */
  status: 200 | 401;
  connected: boolean;
  network?: "evm" | "stellar";
  address?: string;
};

/** @deprecated Use JwtVerifyResult; this describes wallet state, not a JWT session. */
export type ConsSessionResult = ConsVerifyResult;

export type ConsDisconnectResult = {
  success: boolean;
  walletDisconnected: boolean;
  error?: string;
};

const STELLAR_WALLET_STORAGE_KEY = "cordy_minikit_stellar_wallet";
const ACTIVE_WALLET_SESSION_KEY = "cordy_minikit_active_wallet_session";

function getStellarAddress(): string | undefined {
  try {
    const raw = window.localStorage.getItem(STELLAR_WALLET_STORAGE_KEY);
    if (!raw) return undefined;
    const wallet: unknown = JSON.parse(raw);
    if (typeof wallet !== "object" || wallet === null || !("address" in wallet)) return undefined;
    const address = wallet.address;
    return typeof address === "string" && address.length > 0 ? address : undefined;
  } catch {
    return undefined;
  }
}

/** Check whether this browser currently has a connected EVM or Stellar wallet. */
export async function cons_verify(): Promise<ConsVerifyResult> {
  if (typeof window === "undefined") {
    return { status: 401, connected: false };
  }

  const stellarAddress = getStellarAddress();
  const activeWallet = window.localStorage.getItem(ACTIVE_WALLET_SESSION_KEY);

  if (activeWallet === "stellar" && stellarAddress) {
    return { status: 200, connected: true, network: "stellar", address: stellarAddress };
  }

  try {
    const { getActiveWagmiConfig } = await import("../config/walletConfig");
    const state = getActiveWagmiConfig().state;
    const currentConnection = state.current ? state.connections.get(state.current) : undefined;
    const connection = currentConnection?.accounts[0]
      ? currentConnection
      : Array.from(state.connections.values()).find((item) => item.accounts[0]);
    const address = connection?.accounts[0];
    if (address) {
      return { status: 200, connected: true, network: "evm", address };
    }
  } catch {
    // A missing or unavailable EVM connector does not prevent checking Stellar.
  }

  if (stellarAddress) {
    return { status: 200, connected: true, network: "stellar", address: stellarAddress };
  }

  return { status: 401, connected: false };
}

/** Disconnect the connected EVM wallet and clear the Minikit Stellar wallet selection. */
export async function cons_disconnect(): Promise<ConsDisconnectResult> {
  if (typeof window === "undefined") {
    return { success: false, walletDisconnected: false, error: "Wallet disconnect is only available in the browser." };
  }

  try {
    const { disconnect } = await import("wagmi/actions");
    const { getActiveWagmiConfig } = await import("../config/walletConfig");
    const config = getActiveWagmiConfig();
    const connections = Array.from(config.state.connections.values());
    for (const connection of connections) {
      await disconnect(config, { connector: connection.connector });
    }

    window.localStorage.removeItem(STELLAR_WALLET_STORAGE_KEY);
    window.localStorage.removeItem(ACTIVE_WALLET_SESSION_KEY);
    window.dispatchEvent(new Event("cordy:disconnect-stellar-wallet"));
    return { success: true, walletDisconnected: true };
  } catch (error) {
    return {
      success: false,
      walletDisconnected: false,
      error: error instanceof Error ? error.message : "Wallet disconnect failed.",
    };
  }
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
