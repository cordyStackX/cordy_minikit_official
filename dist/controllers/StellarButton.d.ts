export default function StellarWalletButton({ onConnect, onStatusChange, }: {
    onConnect?: (address: string) => void;
    onStatusChange?: (status: {
        isPending: boolean;
        error?: string;
        address?: string;
        network?: string;
    }) => void;
}): import("react").JSX.Element;
//# sourceMappingURL=StellarButton.d.ts.map