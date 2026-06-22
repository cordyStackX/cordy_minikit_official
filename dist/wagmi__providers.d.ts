import { ReactNode, Dispatch, SetStateAction } from "react";
type WalletContextType = {
    openModal: () => void;
    closeModal: () => void;
};
type StellarWalletState = {
    address: string | null;
    network?: string;
    balance?: string;
    manuallyDisconnected?: boolean;
};
export default function WalletProviders({ children }: {
    children: ReactNode;
}): import("react").JSX.Element;
export declare function useWalletModal(): WalletContextType;
export declare function useStellarWallet(): {
    stellarWallet: StellarWalletState;
    setStellarWallet: Dispatch<SetStateAction<StellarWalletState>>;
    clearStellarWallet: () => void;
};
export {};
//# sourceMappingURL=wagmi__providers.d.ts.map