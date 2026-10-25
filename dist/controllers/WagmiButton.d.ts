import React from "react";
export default function WalletButton({ onStatusChange, connectorGroup, }: {
    onStatusChange?: (status: {
        isPending: boolean;
        error?: string;
    }) => void;
    connectorGroup?: "all" | "browser" | "walletconnect";
}): React.JSX.Element;
//# sourceMappingURL=WagmiButton.d.ts.map