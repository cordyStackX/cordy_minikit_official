import type { CordyBridgeRouteConfig } from "../client/runtimeConfig";
import type { CordyBridgeResult } from "../client/transfer";
type CordyBridgeSide = "internal" | "external";
export declare function cctpBridge(amount: string, from: CordyBridgeSide, to: CordyBridgeSide, recipient: string, route: CordyBridgeRouteConfig): Promise<CordyBridgeResult>;
export {};
//# sourceMappingURL=cctpBridge.d.ts.map