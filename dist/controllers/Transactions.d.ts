type CordyStackStellarTransOptions = {
    memo?: string;
    source?: string;
};
/** @deprecated Use `cordy.transfer(amount, recipient, { asset })` instead. */
export default function CordyStackTrans(address: string, cost: number): Promise<boolean>;
/** @deprecated Use `cordy.transfer(amount, recipient, { asset: "XLM", memo })` instead. */
export declare function CordyStackTransStellar(address: string, cost: number, options?: CordyStackStellarTransOptions): Promise<boolean>;
export {};
//# sourceMappingURL=Transactions.d.ts.map