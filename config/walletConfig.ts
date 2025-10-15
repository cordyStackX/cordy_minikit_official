import { http, createConfig } from 'wagmi';
import { mainnet, base } from 'wagmi/chains';
import { walletConnect, metaMask, coinbaseWallet } from 'wagmi/connectors';
import type { Chain } from 'wagmi/chains';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!;

// Function to create config - only called on client side
export default function getConfig(chains: Record<string, Chain> = {}): ReturnType<typeof createConfig> {
  // Combine default chains with custom chains
  const allChains = [mainnet, base, ...Object.values(chains)] as const as readonly [Chain, ...Chain[]];
  
  // Create transports dynamically for all chains
  const transports = allChains.reduce((acc, chain) => {
    acc[chain.id] = http();
    return acc;
  }, {} as Record<number, ReturnType<typeof http>>);

  return createConfig({
    chains: allChains,
    connectors: [
      metaMask(),
      walletConnect({ projectId }),
      coinbaseWallet({
        appName: "cordy_minikit",
        version: "3"
      })
    ],
    transports,
  });
}

export const config: ReturnType<typeof createConfig> = typeof window !== 'undefined' 
  ? getConfig() 
  : {} as ReturnType<typeof createConfig>;