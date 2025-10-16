export { default as ProvidersClientWrapper } from "./client__provider";
export { default as getConfig } from "./config/walletConfig";
export { useWalletModal } from "./wagmi__providers";
export { useNetworkGuard } from "./hooks/useNetworkGuard";
export { detectContractNetwork, enforceNetwork, setupNetworkGuard, getNetworkByChainId, isNetworkSupported, addCustomNetwork, addCustomNetworks, createNetworkConfig, NETWORKS } from "./utils/networkEnforcer";
export type { NetworkConfig } from "./utils/networkEnforcer";
export * from "./components";
export * from "./controllers";
//# sourceMappingURL=index.d.ts.map