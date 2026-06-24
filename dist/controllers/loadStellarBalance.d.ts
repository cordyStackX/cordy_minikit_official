export type StellarBalanceResult = {
    address: string;
    network: string;
    balance: string;
};
export default function loadStellarBalance(accountId: string): Promise<StellarBalanceResult>;
//# sourceMappingURL=loadStellarBalance.d.ts.map