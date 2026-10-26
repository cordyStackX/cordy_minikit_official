# Environment configuration

Environment variables are read by the consuming application. Create `.env.local` in that application, not inside the installed package.

Restart the development server after changing `.env.local`. Next.js exposes `NEXT_PUBLIC_*` values to browser bundles at build/dev-server startup; changing the file while the server is running does not update an already-built client bundle.

## EVM

When using a custom EVM network, configure all required values:

```env
NEXT_PUBLIC_RPC_ENDPOINT=https://your-rpc.example
NEXT_PUBLIC_CHAIN_ID=677
NEXT_PUBLIC_CHAIN_NAME=BOT Chain
NEXT_PUBLIC_BLOCK_EXPLORER_URL=https://scan.example
NEXT_PUBLIC_TOKENADDRESS=0xYourDefaultErc20Contract
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

`NEXT_PUBLIC_RPC_ENDPOINT`, `NEXT_PUBLIC_CHAIN_ID`, and `NEXT_PUBLIC_TOKENADDRESS` are required for EVM wallet connection and the default ERC-20 balance. `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is required for WalletConnect. `NEXT_PUBLIC_CHAIN_NAME` and `NEXT_PUBLIC_BLOCK_EXPLORER_URL` are optional display metadata.

The RPC endpoint and connected wallet must report the same chain ID. An endpoint does not switch the user's wallet network. If the wallet is on another network, switch it in the wallet or add a matching asset entry.

For Ethereum Mainnet:

```env
NEXT_PUBLIC_RPC_ENDPOINT=https://ethereum.publicnode.com
NEXT_PUBLIC_CHAIN_ID=1
NEXT_PUBLIC_CHAIN_NAME=Ethereum Mainnet
NEXT_PUBLIC_BLOCK_EXPLORER_URL=https://etherscan.io
NEXT_PUBLIC_TOKENADDRESS=0xYourMainnetErc20Contract
```

For native EVM coins, register an asset with `"type": "native"` rather than supplying a token contract:

```json
{ "symbol": "ETH", "type": "native", "chainId": 1, "decimals": 18 }
```

## Stellar / Soroban

Stellar configuration is explicit in 3.0.0. There are no implicit testnet defaults:

```env
NEXT_PUBLIC_STELLAR_HORIZON=https://horizon-testnet.stellar.org
NEXT_PUBLIC_STELLAR_CONTRACT_ID=CCXI...
NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
```

All three values are required before Stellar connection or balance operations are allowed. The contract ID identifies the Soroban contract configuration; native XLM balance reads still use Horizon.

## Asset registry

Pass application-owned assets to `ProvidersClientWrapper`:

```json
{
  "evm": [
    {
      "symbol": "USDT",
      "contractAddress": "0xTokenContract",
      "decimals": 6,
      "rpcUrl": "https://rpc.example"
    },
    { "symbol": "BOT", "type": "native", "decimals": 18 }
  ],
  "stellar": [
    { "symbol": "XLM", "type": "native" },
    { "symbol": "USDC", "type": "credit", "code": "USDC", "issuer": "G..." }
  ]
}
```

If an EVM asset omits `chainId`, the Minikit associates it with `NEXT_PUBLIC_CHAIN_ID`. Add an explicit `chainId` only when the registry contains assets for multiple chains. The token contract address must belong to the selected chain. A Stellar credit asset must match the account's issuer and trustline.

## Security

All `NEXT_PUBLIC_*` values are public. Do not put private keys, JWT secrets, signing keys, or server credentials in them. RPC URLs and token contract addresses are configuration, not secrets.
