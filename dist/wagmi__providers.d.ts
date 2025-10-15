import { ReactNode } from "react";
type WalletContextType = {
    openModal: () => void;
    closeModal: () => void;
};
export default function WalletProviders({ children }: {
    children: ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare function useWalletModal(): WalletContextType;
export {};
//# sourceMappingURL=wagmi__providers.d.ts.map