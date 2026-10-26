import { createConfig } from 'wagmi';
import type { Chain } from 'wagmi/chains';
export default function getConfig(customChains?: Record<string, Chain>, options?: {
    walletConnectProjectId?: string;
}): ReturnType<typeof createConfig>;
export declare const config: ReturnType<typeof createConfig>;
export declare function setActiveWagmiConfig(nextConfig: ReturnType<typeof createConfig>): void;
export declare function getActiveWagmiConfig(): ReturnType<typeof createConfig>;
export declare function isEvmEnvironmentConfigured(): boolean;
//# sourceMappingURL=walletConfig.d.ts.map