import { ReactNode, Dispatch, SetStateAction } from "react";
import { type Config } from "wagmi";
import type { ConsSignedResult } from "./client/authTypes";
type WalletContextType = {
    openModal: (options?: {
        consSession?: boolean;
        navigate?: string;
    }) => void;
    closeModal: () => void;
    consSession: boolean;
    consSessionEnabled: boolean;
    consPath: string;
    navigate?: string;
    signedResult?: ConsSignedResult;
    setSignedResult: Dispatch<SetStateAction<ConsSignedResult | undefined>>;
    authError?: string;
    setAuthError: Dispatch<SetStateAction<string | undefined>>;
};
type StellarWalletState = {
    address: string | null;
    network?: string;
    balance?: string;
    manuallyDisconnected?: boolean;
};
export default function WalletProviders({ children, config: walletConfig, consPath }: {
    children: ReactNode;
    config?: Config;
    consPath?: string;
}): import("react").JSX.Element;
export declare function useWalletModal(): WalletContextType;
export declare function useStellarWallet(): {
    stellarWallet: StellarWalletState;
    setStellarWallet: Dispatch<SetStateAction<StellarWalletState>>;
    clearStellarWallet: () => void;
};
export {};
//# sourceMappingURL=wagmi__providers.d.ts.map