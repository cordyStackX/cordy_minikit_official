/** Public app configuration provided to ProvidersClientWrapper as JSON. */
export type EvmAssetConfig = {
  symbol: string;
  type?: "native" | "erc20";
  contractAddress?: string;
  decimals?: number;
  rpcUrl?: string;
};

export type EvmAssetRegistry = Record<string, EvmAssetConfig[]>;

export type EvmNetworkConfig = {
  chainId: number;
  name: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  rpcUrl: string;
  blockExplorerUrl?: string;
  swapRouterAddress?: string;
  /** Optional Uniswap V3-compatible deployment for this chain. */
  swapV3?: {
    routerAddress: string;
    quoterAddress: string;
    feeTiers?: number[];
    /** Defaults to the original Uniswap SwapRouter tuple with a deadline. */
    routerType?: "swapRouter" | "swapRouter02";
  };
  wrappedNativeTokenAddress?: string;
};

export type CordyBridgeNetworkConfig = {
  networkType: "evm" | "stellar";
  chainId?: number;
  domain?: number;
  networkName: string;
  bridgeAddress?: string;
  tokenAddress?: string;
  assetSymbol: string;
  tokenMessenger?: string;
  messageTransmitter?: string;
  tokenMessengerMinter?: string;
  cctpForwarder?: string;
  tokenIssuer?: string;
  /** Optional strict minimum: the bridge rejects amounts less than or equal to this value. */
  minimumAmountExclusive?: string;
  stellarMemo?: string;
};

export type CordyBridgeConfig = {
  /** Available bridge routes. Configure each supported pair as a separate route. */
  routes?: CordyBridgeRouteConfig[];
  /** Legacy single-route fields; new configurations should use routes. */
  resourceId?: string;
  internal?: CordyBridgeNetworkConfig;
  external?: CordyBridgeNetworkConfig;
};

export type CordyBridgeRouteConfig = {
  id: string;
  name: string;
  protocol?: "custom" | "cctp";
  /** Shared bytes32 resource identifier registered by the bridge validators. */
  resourceId?: string;
  internal: CordyBridgeNetworkConfig;
  external: CordyBridgeNetworkConfig;
};

export type StellarAssetConfig =
  | { symbol: string; type: "native"; networkPassphrase?: string }
  | { symbol: string; type: "credit"; code: string; issuer: string; networkPassphrase?: string };

export type StellarNetworkConfig = {
  horizonUrl: string;
  sorobanRpcUrl?: string;
  networkPassphrase: string;
  /** Optional Soroban contract ID used by app-specific contract integrations. */
  contractId?: string;
};

export type CordyAssetsConfig = {
  walletConnectProjectId?: string;
  networks?: EvmNetworkConfig[];
  /** EVM assets grouped by their network chain ID. */
  evm?: EvmAssetRegistry;
  bridge?: CordyBridgeConfig;
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
  return Boolean(
    activeConfig?.networks?.length &&
    activeConfig.evm &&
    Object.keys(activeConfig.evm).length > 0,
  );
}

export function getConfiguredEvmAssets(
  assets: CordyAssetsConfig | undefined,
): Array<EvmAssetConfig & { chainId: number }> {
  return Object.entries(assets?.evm ?? {}).flatMap(([chainId, entries]) =>
    entries.map((asset) => ({ ...asset, chainId: Number(chainId) })),
  );
}

export function requireConfiguredEvmNetwork(
  assets: CordyAssetsConfig | undefined,
  chainId: number,
  networkName: string,
): EvmNetworkConfig {
  const network = assets?.networks?.find((candidate) => candidate.chainId === chainId);
  if (!network) {
    const configured = (assets?.networks ?? []).map((candidate) => `${candidate.name} (${candidate.chainId})`).join(", ");
    throw new Error(
      `${networkName} (chain ID ${chainId}) is not configured in Cordy Minikit. ` +
      `Add it to assets.networks before using EVM assets. Configured networks: ${configured || "none"}.`,
    );
  }
  return network;
}

export function isStellarConfigReady(): boolean {
  return Boolean(
    activeConfig?.stellarNetwork?.horizonUrl &&
    activeConfig.stellarNetwork.networkPassphrase &&
    activeConfig.stellar?.length,
  );
}
