export type WalletContext = "EVM" | "Non_EVM" | "MULTI" | "NONE";
export default function useWalletStatus(): {
    context: string;
    evm: {
        isConnected: boolean;
        address: `0x${string}` | undefined;
        chain: import("viem").Chain | undefined;
        balance: string;
        symbol: string;
        error: string | undefined;
    };
    stellar: {
        isConnected: boolean;
        address: string | null;
        network: string | undefined;
        balance: string | undefined;
        error: string | undefined;
    };
    refreshEvmBalance: () => Promise<boolean>;
    refreshStellarBalance: (accountId?: string) => Promise<boolean>;
    refreshBalances: () => Promise<boolean>;
    disconnectEVM: () => Promise<boolean>;
    disconnectStellar: () => Promise<boolean>;
    disconnectAll: () => Promise<boolean>;
};
//# sourceMappingURL=Get_Account_Info.d.ts.map