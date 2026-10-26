import { Horizon } from "@stellar/stellar-sdk";
import { getNetworkDetails } from "@stellar/freighter-api";
import { getCordyRuntimeConfig, isStellarConfigReady } from "../client/runtimeConfig";

export function isStellarEnvironmentConfigured(): boolean {
  return isStellarConfigReady();
}

export type StellarBalanceAsset =
  | { symbol: string; type: "native"; networkPassphrase?: string }
  | { symbol: string; type: "credit"; code: string; issuer: string; networkPassphrase?: string };

export type StellarBalanceOptions = {
  assetSymbol?: string;
  asset?: StellarBalanceAsset;
  assets?: StellarBalanceAsset[];
  horizonUrl?: string;
  networkPassphrase?: string;
};

export type StellarBalanceResult = {
  address: string;
  network: string;
  networkPassphrase: string;
  balance: string;
  asset: string;
};

/** Shared Stellar account balance reader for wallet status and Cordy APIs. */
export default async function loadStellarBalance(
  accountId: string,
  options: StellarBalanceOptions = {},
): Promise<StellarBalanceResult> {
  const runtimeConfig = getCordyRuntimeConfig();
  const stellarConfig = runtimeConfig?.stellarNetwork;
  const horizonUrl = options.horizonUrl || stellarConfig?.horizonUrl;
  const configuredPassphrase = options.networkPassphrase || stellarConfig?.networkPassphrase;
  if (!isStellarEnvironmentConfigured() || !horizonUrl || !configuredPassphrase) {
    throw new Error("Stellar is not configured. Add stellarNetwork and Stellar assets to the JSON passed to ProvidersClientWrapper.");
  }
  const networkDetails = await getNetworkDetails();
  const expectedPassphrase = configuredPassphrase;
  const freighterPassphrase = networkDetails.networkPassphrase;

  if (freighterPassphrase && freighterPassphrase !== expectedPassphrase) {
    throw new Error(`Freighter network mismatch. Expected ${expectedPassphrase}, got ${freighterPassphrase}.`);
  }

  const networkPassphrase = freighterPassphrase || expectedPassphrase;
  const requestedSymbol = options.asset?.symbol || options.assetSymbol || "XLM";
  let asset = options.asset;

  if (!asset) {
    const candidates = (options.assets ?? runtimeConfig?.stellar ?? []).filter((candidate) =>
      candidate.symbol.toLowerCase() === requestedSymbol.toLowerCase() &&
      (!candidate.networkPassphrase || candidate.networkPassphrase === networkPassphrase),
    );
    if (candidates.length > 1) {
      throw new Error(`More than one ${requestedSymbol} asset matches this Stellar network; make the JSON entries unique.`);
    }
    asset = candidates[0];
  }

  if (!asset && requestedSymbol.toLowerCase() === "xlm") {
    asset = { symbol: "XLM", type: "native" };
  }
  if (!asset) throw new Error(`No ${requestedSymbol} asset is configured for this Stellar network.`);
  if (asset.networkPassphrase && asset.networkPassphrase !== networkPassphrase) {
    throw new Error(`The ${asset.symbol} asset is not configured for the connected Stellar network.`);
  }

  const server = new Horizon.Server(horizonUrl);
  const account = await server.loadAccount(accountId);
  const balance = asset.type === "native"
    ? account.balances.find((item) => item.asset_type === "native")
    : account.balances.find((item) =>
      (item.asset_type === "credit_alphanum4" || item.asset_type === "credit_alphanum12") &&
      item.asset_code === asset.code &&
      item.asset_issuer === asset.issuer,
    );

  return {
    address: accountId,
    network: networkDetails.network || "Stellar",
    networkPassphrase,
    balance: balance?.balance ?? "0",
    asset: asset.symbol,
  };
}
