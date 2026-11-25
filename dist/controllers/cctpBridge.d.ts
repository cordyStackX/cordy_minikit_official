import type { CordyBridgeRouteConfig } from "../client/runtimeConfig";
import type { CordyBridgeResult } from "../client/transfer";
type CordyBridgeSide = "internal" | "external";
export type StellarCctpRecoveryRecord = {
    burnTransactionHash: string;
    from: CordyBridgeSide;
    to: CordyBridgeSide;
    routeId: string;
    routeName?: string;
    amount?: string;
    recipient?: string;
    asset?: string;
    fromNetwork?: string;
    toNetwork?: string;
    mintTransactionHash?: string;
};
export declare function getStellarCctpRecoveryRecords(): StellarCctpRecoveryRecord[];
export declare function removeStellarCctpRecoveryRecord(burnHash: string): void;
export declare function cctpResumeStellarToEvm(burnHash: string, route: CordyBridgeRouteConfig, from: CordyBridgeSide, to: CordyBridgeSide): Promise<{
    transactionHash?: string;
    alreadyReceived?: boolean;
}>;
export declare function cctpBridge(amount: string, from: CordyBridgeSide, to: CordyBridgeSide, recipient: string, route: CordyBridgeRouteConfig): Promise<CordyBridgeResult>;
export {};
//# sourceMappingURL=cctpBridge.d.ts.map