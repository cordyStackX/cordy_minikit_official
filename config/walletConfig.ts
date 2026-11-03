import { http, createConfig } from 'wagmi';
import { mainnet, base, sepolia } from 'wagmi/chains';
import { walletConnect, metaMask, coinbaseWallet } from 'wagmi/connectors';
import type { Chain } from 'wagmi/chains';
import { isEvmConfigReady } from '../client/runtimeConfig';

const configCache = new Map<string, ReturnType<typeof createConfig>>();

export default function getConfig(
  customChains: Record<string, Chain> = {},
  options: { walletConnectProjectId?: string } = {},
): ReturnType<typeof createConfig> {
  const uniqueChains = [...Object.values(customChains), mainnet, base, sepolia]
    .filter((chain, index, chains) =>
      chains.findIndex((candidate) => candidate.id === chain.id) === index,
    );
  const [firstChain, ...otherChains] = uniqueChains;
  if (!firstChain) throw new Error('At least one EVM chain must be configured.');
  const allChains: [Chain, ...Chain[]] = [firstChain, ...otherChains];

  const cacheKey = JSON.stringify({
    walletConnectProjectId: options.walletConnectProjectId ?? null,
    chains: allChains.map(({ id, name, nativeCurrency, rpcUrls, blockExplorers }) => ({
      id,
      name,
      nativeCurrency,
      rpcUrls,
      blockExplorers,
    })),
  });
  const cachedConfig = configCache.get(cacheKey);
  if (cachedConfig) return cachedConfig;

  // Use the chain's RPC URL if available
  const transports = allChains.reduce((acc, chain) => {
    const rpcUrl = chain.rpcUrls?.default?.http?.[0];
    acc[chain.id] = rpcUrl ? http(rpcUrl) : http();
    return acc;
  }, {} as Record<number, ReturnType<typeof http>>);

  const nextConfig = createConfig({
    chains: allChains,
    connectors: [
      metaMask(),
      ...(options.walletConnectProjectId ? [walletConnect({ projectId: options.walletConnectProjectId })] : []),
      coinbaseWallet({
        appName: "cordy_minikit",
      }),
    ],
    transports,
  });
  configCache.set(cacheKey, nextConfig);
  return nextConfig;
}

export const config: ReturnType<typeof createConfig> =
  typeof window !== "undefined"
    ? getConfig()
    : ({} as ReturnType<typeof createConfig>);

let activeWagmiConfig = config;

export function setActiveWagmiConfig(nextConfig: ReturnType<typeof createConfig>): void {
  activeWagmiConfig = nextConfig;
}

export function getActiveWagmiConfig(): ReturnType<typeof createConfig> {
  return activeWagmiConfig;
}

export function isEvmEnvironmentConfigured(): boolean {
  return isEvmConfigReady();
}
