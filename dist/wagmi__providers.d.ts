import { ReactNode } from "react";
import type { Config } from "wagmi";
type WalletContextType = {
    openModal: () => void;
    closeModal: () => void;
};
export default function WalletProviders({ children, config }: {
    children: ReactNode;
    config?: Config;
}): import("react/jsx-runtime").JSX.Element;
export declare function useWalletModal(): WalletContextType;
export {};
//# sourceMappingURL=wagmi__providers.d.ts.map