# Public runtime configuration

The Minikit reads browser-visible network and asset settings from the JSON object passed to `ProvidersClientWrapper`. Keep these values together in an app-owned JSON file and import it in the provider. The Minikit no longer reads `NEXT_PUBLIC_*` variables for wallet, network, or asset configuration.

Authentication keys are separate from this public configuration. If you enable wallet sign-in, pass server environment values to `createCordyServer()` from a server-only module. Use a Stellar secret key for `SIGNING_SECRET` and a random value of at least 32 bytes for `JWT_SECRET`. Never put these values in `assets.json`, a `NEXT_PUBLIC_*` variable, or a client component. See [Server authentication](./api.md#server-authentication).

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

Put routes in `bridge.routes` in the same `assets.json` passed to
`ProvidersClientWrapper`. Keep the route ID stable: your UI passes it to
`cordy.bridge()`. Each route has `internal` and `external` sides; these names
are labels only. `networkType` selects the implementation (`"evm"` or
`"stellar"`), and `from`/`to` select the source and destination sides.

### EVM to EVM: validator based route

Use `protocol: "custom"` (or omit `protocol`) when both sides use compatible
EVM bridge contracts and a bridge validator/relayer delivers the destination
asset. Every EVM side must have a matching chain in `networks` and the route
needs a validator-registered 32-byte `resourceId`.

```json
{
  "bridge": {
    "routes": [
      {
        "id": "my-evm-route",
        "name": "Chain A ↔ Chain B · USDC",
        "protocol": "custom",
        "resourceId": "0x<64-hex-characters-registered-with-the-bridge>",
        "internal": {
          "networkType": "evm",
          "chainId": 11155111,
          "networkName": "Ethereum Sepolia",
          "bridgeAddress": "0x<bridge-contract-on-sepolia>",
          "tokenAddress": "0x<usdc-on-sepolia>",
          "assetSymbol": "USDC"
        },
        "external": {
          "networkType": "evm",
          "chainId": 97,
          "networkName": "BNB Smart Chain Testnet",
          "bridgeAddress": "0x<bridge-contract-on-bnb-testnet>",
          "tokenAddress": "0x<usdc-on-bnb-testnet>",
          "assetSymbol": "USDC"
        }
      }
    ]
  }
}
```

For this route type, each bridge contract must implement the SDK's `deposit`
interface and validators must be configured to observe the source event and
release the destination asset. The token symbols must match. An optional
`minimumAmountExclusive` is enforced only when that side is the source. The
wallet must be connected to the source EVM chain, hold the configured token,
and have native gas. Cordy requests token approval when needed, submits the
source deposit, waits for its confirmation, then returns; validator delivery
happens separately.

### Stellar to Stellar: validator based route

A custom Stellar route sends the configured Stellar asset from the source account
to a Stellar bridge receiver account. Set `networkType: "stellar"` on both
sides and use a 32-byte `resourceId` registered with the service that handles
destination delivery. `bridgeAddress` on the source side must be a valid
Stellar public receiver address. That service must watch the source payment
(and the optional `stellarMemo`) and deliver the matching asset on the
destination network; Cordy only submits the source payment.

```json
{
  "bridge": {
    "routes": [
      {
        "id": "stellar-testnet-to-public-usdc",
        "name": "Stellar Testnet ↔ Stellar Public · USDC",
        "protocol": "custom",
        "resourceId": "0x<64-hex-characters-registered-with-the-bridge>",
        "internal": {
          "networkType": "stellar",
          "networkName": "Stellar Testnet",
          "bridgeAddress": "G<TESTNET-BRIDGE-RECEIVER>",
          "assetSymbol": "USDC",
          "stellarMemo": "<OPTIONAL-ROUTE-MEMO>"
        },
        "external": {
          "networkType": "stellar",
          "networkName": "Stellar Public",
          "assetSymbol": "USDC"
        }
      }
    ]
  }
}
```

Configure the source Stellar network, asset issuer, and trustline in
`stellarNetwork` and `stellar`. The configured Stellar passphrase must match
the connected Freighter network. Set up the destination receiver and delivery
service separately; there is no automatic validator setup in the SDK.

### Stellar and EVM: Circle CCTP

For the configured Circle route, set `protocol` to `"cctp"`. Use the actual
Circle-supported USDC contract/token messenger/forwarder deployments and
Circle domain IDs for the networks you select. Do not substitute a bridge
`resourceId`: CCTP uses `domain` plus Circle contract addresses. The Stellar
side uses Soroban, so `stellarNetwork` needs both Horizon (for Stellar wallet
account data) and Soroban RPC (for CCTP contract calls). Configure Stellar
USDC as a credit asset with the correct issuer so the account has the required
trustline.

```json
{
  "stellarNetwork": {
    "horizonUrl": "https://horizon-testnet.stellar.org",
    "sorobanRpcUrl": "https://soroban-testnet.stellar.org",
    "networkPassphrase": "Test SDF Network ; September 2015"
  },
  "stellar": [
    { "symbol": "USDC", "type": "credit", "code": "USDC", "issuer": "G<USDC-ISSUER>" }
  ],
  "bridge": {
    "routes": [
      {
        "id": "stellar-testnet-sepolia-usdc",
        "name": "Stellar Testnet ↔ Ethereum Sepolia · USDC",
        "protocol": "cctp",
        "internal": {
          "networkType": "stellar",
          "networkName": "Stellar Testnet",
          "domain": 27,
          "assetSymbol": "USDC",
          "tokenAddress": "C<STELLAR-USDC-CONTRACT>",
          "tokenMessengerMinter": "C<STELLAR-TOKEN-MESSENGER-MINTER>",
          "messageTransmitter": "C<STELLAR-MESSAGE-TRANSMITTER>",
          "cctpForwarder": "C<STELLAR-CCTP-FORWARDER>",
          "tokenIssuer": "G<USDC-ISSUER>"
        },
        "external": {
          "networkType": "evm",
          "networkName": "Ethereum Sepolia",
          "chainId": 11155111,
          "domain": 0,
          "assetSymbol": "USDC",
          "tokenMessenger": "0x<SEPOLIA-TOKEN-MESSENGER>",
          "messageTransmitter": "0x<SEPOLIA-MESSAGE-TRANSMITTER>",
          "tokenAddress": "0x<SEPOLIA-USDC>"
        }
      }
    ]
  }
}
```

The actual demo keeps the deployment addresses in
[`demo/src/config/assets.json`](../demo/src/config/assets.json); copy the
verified values for your target network rather than using the placeholders
above. Add each EVM chain to `networks` and its USDC token to `evm[chainId]` as
well. `domain` is Circle's domain ID, not an EVM chain ID. Stellar CCTP also
requires `stellarNetwork.sorobanRpcUrl` and a connected Stellar account with
USDC trustline and enough XLM for fees.

On Stellar → EVM, Cordy asks for the Stellar approval and burn signatures,
waits for Circle's attestation, then submits the EVM destination mint. An EVM
wallet must also be connected on the destination chain. On EVM → Stellar, the
current SDK submits the EVM burn and reports `status: "pending"`; it does not
complete the Stellar-side mint/forward in that call. Do not treat that result
as delivered USDC: the destination CCTP forwarder/relayer flow must be
operational and the Stellar balance should be checked separately.

### Call a configured route

```ts
const result = await cordy.bridge(
  "10.5",
  "internal", // source side: "internal" or "external"
  "external", // destination side
  "0xRecipient", // use a G... address when destination is Stellar
  { routeId: "my-evm-route" },
);

if (!result.success) {
  console.error(result.error);
} else {
  console.log(result.status, result.transactionHash);
}
```

Replace `"0xRecipient"` with the address format for the destination network:
EVM `0x...` for an EVM destination; Stellar `G...` (or a supported contract
address for CCTP forwarding) for Stellar. For more than one configured route,
`routeId` is required. Mount `BridgeEvmWalletModal` once in the client tree if
the SDK should open its EVM connection dialog when a route needs an EVM wallet.

A successful response confirms the source-side operation only. For custom
routes, validator delivery is external. For CCTP, use the direction-specific
completion behavior above and verify the destination token balance. Testnet
tokens have no real-world value.
Stellar requires `stellarNetwork.horizonUrl`, `stellarNetwork.networkPassphrase`, and at least one `stellar` asset. `contractId` is optional metadata for app-specific Soroban integrations; Horizon balance and payment operations do not need it. A credit asset must match the account's issuer and trustline.

The wallet's selected EVM network must match the selected asset's chain ID. An RPC URL cannot switch the wallet's network. Stellar's configured passphrase must match the connected Freighter network.
