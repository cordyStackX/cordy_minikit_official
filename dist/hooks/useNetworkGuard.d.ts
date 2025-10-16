interface UseNetworkGuardOptions {
    enabled?: boolean;
    onWrongNetwork?: () => void;
}
export declare function useNetworkGuard(options?: UseNetworkGuardOptions): {
    isEnforcing: boolean;
    requiredChainId: number | null;
    isCorrectNetwork: boolean;
};
export {};
//# sourceMappingURL=useNetworkGuard.d.ts.map