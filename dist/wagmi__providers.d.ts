import { ReactNode, Dispatch, SetStateAction } from "react";
import { type Config } from "wagmi";
type WalletContextType = {
    openModal: (options?: {
        jwtSession?: boolean;
    }) => void;
    closeModal: () => void;
    jwtSession: boolean;
};
type StellarWalletState = {
    address: string | null;
    network?: string;
    balance?: string;
    manuallyDisconnected?: boolean;
};
export default function WalletProviders({ children, config: walletConfig }: {
    children: ReactNode;
    config?: Config;
}): import("react").JSX.Element;
export declare function useWalletModal(): WalletContextType;
export declare function useStellarWallet(): {
    stellarWallet: StellarWalletState;
    setStellarWallet: Dispatch<SetStateAction<StellarWalletState>>;
    clearStellarWallet: () => void;
};
export {};
//# sourceMappingURL=wagmi__providers.d.ts.map