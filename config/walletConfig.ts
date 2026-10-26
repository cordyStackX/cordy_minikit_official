import { http, createConfig } from 'wagmi';
import { mainnet, base, sepolia } from 'wagmi/chains';
import { walletConnect, metaMask, coinbaseWallet } from 'wagmi/connectors';
import type { Chain } from 'wagmi/chains';
import { isEvmConfigReady } from '../client/runtimeConfig';

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

  // Use the chain's RPC URL if available
  const transports = allChains.reduce((acc, chain) => {
    const rpcUrl = chain.rpcUrls?.default?.http?.[0];
    acc[chain.id] = rpcUrl ? http(rpcUrl) : http();
    return acc;
  }, {} as Record<number, ReturnType<typeof http>>);

  return createConfig({
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
