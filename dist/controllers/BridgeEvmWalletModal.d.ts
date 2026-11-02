export type BridgeEvmWalletModalProps = {
    open?: boolean;
    onClose?: () => void;
    onConnected?: (address?: string) => void;
    onConnectionError?: (error: string) => void;
    targetChainName?: string;
    title?: string;
    note?: string;
};
export default function BridgeEvmWalletModal({ open: controlledOpen, onClose: controlledOnClose, onConnected, onConnectionError, targetChainName, title, note, }: BridgeEvmWalletModalProps): import("react").JSX.Element | null;
//# sourceMappingURL=BridgeEvmWalletModal.d.ts.map