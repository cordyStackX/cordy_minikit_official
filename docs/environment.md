# Public runtime configuration

The Minikit reads browser-visible network and asset settings from the JSON object passed to `ProvidersClientWrapper`. Keep these values together in an app-owned JSON file and import it in the provider. The Minikit no longer reads `NEXT_PUBLIC_*` variables for wallet, network, or asset configuration.

```tsx
import assets from "./assets.json";
import type { CordyAssetsConfig } from "@cordystackx/cordy_minikit";

<ProvidersClientWrapper assets={assets as CordyAssetsConfig}>
  {children}
</ProvidersClientWrapper>
```

## Configuration shape

```json
{
  "walletConnectProjectId": "your-public-project-id",
  "networks": [
    {
      "chainId": 1,
      "name": "Ethereum Mainnet",
      "nativeCurrency": { "name": "Ether", "symbol": "ETH", "decimals": 18 },
      "rpcUrl": "https://ethereum.publicnode.com",
      "blockExplorerUrl": "https://etherscan.io",
      "swapRouterAddress": "0xRouterAddress",
      "swapV3": {
        "routerAddress": "0xV3SwapRouter",
        "quoterAddress": "0xQuoterV2",
        "feeTiers": [500, 3000, 10000],
        "routerType": "swapRouter"
      },
      "wrappedNativeTokenAddress": "0xWrappedNativeAddress"
    }
  ],
  "evm": {
    "1": [
      { "symbol": "USDC", "contractAddress": "0xTokenContract", "decimals": 6 }
    ]
  },
  "stellarNetwork": {
    "horizonUrl": "https://horizon-testnet.stellar.org",
    "contractId": "CCXI...",
    "networkPassphrase": "Test SDF Network ; September 2015"
  },
  "stellar": [
    { "symbol": "XLM", "type": "native" },
    { "symbol": "USDC", "type": "credit", "code": "USDC", "issuer": "G..." }
  ]
}
```

`walletConnectProjectId` is a public client identifier, not a secret. `networks` provides the EVM chain ID, RPC, currency, explorer, and optional swap contracts. `swapRouterAddress` configures a V2-compatible router; `swapV3` configures a V3-compatible router and QuoterV2. Its `feeTiers` list is the default set queried by V3 swaps. A `cordy.swap()` call can override this list with `options.feeTiers` to choose pools for that call; common values are `500` (0.05%), `3000` (0.30%), and `10000` (1.00%). Tiers must match pools deployed by that DEX for the selected token pair. Group each EVM token or native asset under its numeric chain ID in `evm`, for example `"1": [...]` and `"11155111": [...]`.

Native EVM currencies come only from `networks[].nativeCurrency`. Do not
repeat ETH, BOT, or another native currency in `evm`; use `evm` for ERC-20
contracts. Wallets may connect on an unconfigured chain, but balance,
transfer, and swap operations reject that chain with an explicit configuration
error.

## Bridge routes

Put bridge settings under `bridge.routes` in the same `assets.json` passed to `ProvidersClientWrapper`. Keep your existing assets and networks. The demo provider imports only `assets.json`.

Each route connects two EVM sides. In `cordy.bridge()`, `from` and `to` select `internal` or `external`; `options.routeId` selects which configured pair to use.

```json
{
  "bridge": {
    "routes": [
      {
        "id": "bot-testnet-sepolia-usdt",
        "name": "BOT Chain Testnet ↔ Ethereum Sepolia · USDT",
        "resourceId": "0xac589789ed8c9d2c61f17b13369864b5f181e58eba230a6ee4ec4c3e7750cd1d",
        "internal": {
          "chainId": 968,
          "networkName": "BOT Chain Testnet",
          "bridgeAddress": "0x6239404Aa276ba68486E2Fa40E90CDd36ff8ec3A",
          "tokenAddress": "0x75edC9335175Fc0552D51D48439F229c10420fe3",
          "assetSymbol": "USDT",
          "minimumAmountExclusive": "10"
        },
        "external": {
          "chainId": 11155111,
          "networkName": "Ethereum Sepolia",
          "bridgeAddress": "0xc83AE6F73e8918750b87DD001E36093A1AB7b272",
          "tokenAddress": "0x7B1e05a39adF207a759EAf89E867dBcC1C615130",
          "assetSymbol": "USDT"
        }
      },
      {
        "id": "bot-testnet-bsc-testnet-usdt",
        "name": "BOT Chain Testnet ↔ BNB Smart Chain Testnet · USDT",
        "resourceId": "0xac589789ed8c9d2c61f17b13369864b5f181e58eba230a6ee4ec4c3e7750cd1d",
        "internal": {
          "chainId": 968,
          "networkName": "BOT Chain Testnet",
          "bridgeAddress": "0x6239404Aa276ba68486E2Fa40E90CDd36ff8ec3A",
          "tokenAddress": "0x75edC9335175Fc0552D51D48439F229c10420fe3",
          "assetSymbol": "USDT",
          "minimumAmountExclusive": "10"
        },
        "external": {
          "chainId": 97,
          "networkName": "BNB Smart Chain Testnet",
          "bridgeAddress": "0xbCAA929FdB16f5a7185C96A4Ed0CC4F25ab86E40",
          "tokenAddress": "0x5d012516D129Ab3aE7673FE32E5ABFCD9be4d086",
          "assetSymbol": "USDT"
        }
      }
    ]
  }
}
```

Add each custom chain to `networks` so the wallet can connect to it. The demo has two testnet routes: BOT Chain Testnet ↔ Sepolia, and BOT Chain Testnet ↔ BNB Smart Chain Testnet. Both use USDT and the same test resource ID. The addresses come from the [BOT Chain bridge contract list](https://dev-docs.bohr.life/docs/Bridge/contract-addresses/); BNB Testnet uses chain ID `97` and the [official BNB RPC](https://docs.bnbchain.org/bnb-smart-chain/developers/json_rpc/json-rpc-endpoint/).

Each route needs a unique `id`, display `name`, validator-registered `resourceId`, and matching `assetSymbol` on both sides. Each side defines `chainId`, `networkName`, `bridgeAddress`, and ERC-20 `tokenAddress`. The contracts must implement `deposit(destinationChainId, resourceId, recipient, amount)`, and bridge validators must be running for that route. `minimumAmountExclusive` is optional and applies when that side is the source. In the demo, the BOT Chain Testnet source requires more than 10 USDT; Sepolia and BNB Testnet have no configured minimum. Testnet tokens have no real-world value.

During bridge wallet connection, the SDK can prepare the route's configured
EVM network. Wallets that support the relevant methods may be asked to add a
missing chain, switch to it, and display the configured ERC-20 with
`wallet_watchAsset`. Wallet rejection is returned and no bridge deposit is
started.

Stellar requires `stellarNetwork.horizonUrl`, `stellarNetwork.networkPassphrase`, and at least one `stellar` asset. `contractId` is optional metadata for app-specific Soroban integrations; Horizon balance and payment operations do not need it. A credit asset must match the account's issuer and trustline.

The wallet's selected EVM network must match the selected asset's chain ID. An RPC URL cannot switch the wallet's network. Stellar's configured passphrase must match the connected Freighter network.
