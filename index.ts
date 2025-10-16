
// Clients
export { default as ProvidersClientWrapper } from "./client__provider";

// Config
export { default as getConfig } from "./config/walletConfig";

// Hooks
export { useWalletModal } from "./wagmi__providers";
export { useNetworkGuard } from "./hooks/useNetworkGuard";

// Utils
export { 
  detectContractNetwork, 
  enforceNetwork, 
  setupNetworkGuard, 
  getNetworkByChainId,
  isNetworkSupported,
  NETWORKS 
} from "./utils/networkEnforcer";

//Components
export * from "./components";

//Controllers
export * from "./controllers";
