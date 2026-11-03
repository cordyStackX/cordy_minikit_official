export type ConsSignedResult = {
    chain: "evm";
    address: `0x${string}`;
    network: "testnet" | "public";
    signature: `0x${string}`;
    message: string;
} | {
    chain: "stellar";
    address: string;
    network: "testnet" | "public";
    signedXdr: string;
};
//# sourceMappingURL=authTypes.d.ts.map