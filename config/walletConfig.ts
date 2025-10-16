import { http, createConfig } from 'wagmi';
import { mainnet, base } from 'wagmi/chains';
import { walletConnect, metaMask } from 'wagmi/connectors';
import type { Chain } from 'wagmi/chains';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!;

export default function getConfig(customChains: Record<string, Chain> = {}): ReturnType<typeof createConfig> {
  const allChains = [mainnet, base, ...Object.values(customChains)] as const;

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
      walletConnect({ projectId })
    ],
    transports,
  });
}

export const config: ReturnType<typeof createConfig> =
  typeof window !== "undefined"
    ? getConfig()
    : ({} as ReturnType<typeof createConfig>);
