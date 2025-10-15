import { defineChain }  from "viem";

export default function CoreTestnet() {
    // Custom Chain
    const coreTestnet = defineChain({
    id: 1114,
    name: 'tCORE2',
    network: 'core-testnet',
    nativeCurrency: {
        name: 'tCORE2',
        symbol: 'tCORE2',
        decimals: 18,
    },
    rpcUrls: {
        default: {
        http: ['https://rpc.test2.btcs.network'],
        },
    },
    blockExplorers: {
        default: {
        name: 'CoreScan',
        url: 'https://scan.test2.btcs.network',
        },
    },
    testnet: true,
    });


    return coreTestnet;

}