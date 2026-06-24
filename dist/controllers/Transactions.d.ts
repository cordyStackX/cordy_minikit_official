type CordyStackStellarTransOptions = {
    memo?: string;
    source?: string;
};
export default function CordyStackTrans(address: string, cost: number): Promise<boolean>;
export declare function CordyStackTransStellar(address: string, cost: number, options?: CordyStackStellarTransOptions): Promise<boolean>;
export {};
//# sourceMappingURL=Transactions.d.ts.map