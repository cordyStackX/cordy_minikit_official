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
      "wrappedNativeTokenAddress": "0xWrappedNativeAddress"
    }
  ],
  "evm": [
    { "symbol": "ETH", "type": "native", "chainId": 1, "decimals": 18 },
    { "symbol": "USDC", "contractAddress": "0xTokenContract", "chainId": 1, "decimals": 6 }
  ],
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

`walletConnectProjectId` is a public client identifier, not a secret. `networks` provides the EVM chain ID, RPC, currency, explorer, and optional swap contracts. Add an `evm` entry for each token or native asset the app wants the Minikit to read, transfer, or swap. If an EVM asset omits `chainId`, the Minikit associates it with the first configured network. The first configured ERC-20 is the default token for calls such as `cordy.balance()` without an asset option.

Stellar requires `stellarNetwork.horizonUrl`, `stellarNetwork.networkPassphrase`, and at least one `stellar` asset. `contractId` is optional metadata for app-specific Soroban integrations; Horizon balance and payment operations do not need it. A credit asset must match the account's issuer and trustline.

The wallet's selected EVM network must match the selected asset's chain ID. An RPC URL cannot switch the wallet's network. Stellar's configured passphrase must match the connected Freighter network.

## Secrets

JSON config is shipped to the browser and is public. Do not put private keys, signing keys, JWT secrets, or server credentials in it. Keep server-only secrets in the consuming app's server environment, without a `NEXT_PUBLIC_` prefix.
