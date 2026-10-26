/** Public app configuration provided to ProvidersClientWrapper as JSON. */
export type EvmAssetConfig = {
  symbol: string;
  /** Defaults to the first configured EVM network when omitted. */
  chainId?: number;
  type?: "native" | "erc20";
  contractAddress?: string;
  decimals?: number;
  rpcUrl?: string;
};

export type EvmNetworkConfig = {
  chainId: number;
  name: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  rpcUrl: string;
  blockExplorerUrl?: string;
  swapRouterAddress?: string;
  wrappedNativeTokenAddress?: string;
};

export type StellarAssetConfig =
  | { symbol: string; type: "native"; networkPassphrase?: string }
  | { symbol: string; type: "credit"; code: string; issuer: string; networkPassphrase?: string };

export type StellarNetworkConfig = {
  horizonUrl: string;
  networkPassphrase: string;
  /** Optional Soroban contract ID used by app-specific contract integrations. */
  contractId?: string;
};

export type CordyAssetsConfig = {
  walletConnectProjectId?: string;
  networks?: EvmNetworkConfig[];
  evm?: EvmAssetConfig[];
  stellarNetwork?: StellarNetworkConfig;
  stellar?: StellarAssetConfig[];
};

let activeConfig: CordyAssetsConfig | undefined;

export function setCordyRuntimeConfig(config: CordyAssetsConfig): void {
  activeConfig = config;
}

export function getCordyRuntimeConfig(): CordyAssetsConfig | undefined {
  return activeConfig;
}

export function isEvmConfigReady(): boolean {
  return Boolean(activeConfig?.networks?.length && activeConfig.evm?.length);
}

export function isStellarConfigReady(): boolean {
  return Boolean(
    activeConfig?.stellarNetwork?.horizonUrl &&
    activeConfig.stellarNetwork.networkPassphrase &&
    activeConfig.stellar?.length,
  );
}
