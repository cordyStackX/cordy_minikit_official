# Client API reference

Import the client API:

```ts
import { cordy } from "@cordystackx/cordy_minikit";
```

All methods return promises. Check `success` before using `balance`, `asset`, or `transactionHash`.

For step-by-step client examples that show how to call each method from UI actions, start with [Use Cordy in your app](./recipes.md). This page documents the method options and results.

## `cordy.configure({ assets })`

Configure the caller-owned EVM, bridge, and Stellar registry before calling balance, transfer, swap, or bridge methods. Most apps should pass the registry to `ProvidersClientWrapper`, which configures Cordy for the app:

```tsx
<ProvidersClientWrapper assets={assets}>
  {children}
</ProvidersClientWrapper>
```

You can also configure it directly with `cordy.configure({ assets })`. The `assets` value follows the [`CordyAssetsConfig`](./environment.md#asset-registry) shape.

## `cordy.cons_verify()`

Checks the Cordy server session established by a successful wallet signature. It returns `{ success: true, authenticated: true, address, chain }` for an active session, or an unauthenticated result when no valid session exists:

```ts
const result = await cordy.cons_verify();
if (result.authenticated) console.log(result.chain, result.address);
```

This requires the server handler described below. For authorization, check the session on the server with `cordyServer.session(request)`; client state alone is not an authorization boundary.

You can call `cordy.cons_verify()` without importing `useConsSession()`. The hook is an optional React convenience for components that should load and reactively display session state. Neither method creates a session: a wallet must first complete sign-in through `ConnectWalletBT` and the server handler.

## `cordy.cons_disconnect()`

Posts to the configured Cordy session endpoint to clear the HTTP-only session cookie, then disconnects active EVM connectors and clears the Minikit Stellar wallet selection.

```ts
const result = await cordy.cons_disconnect();
```

The result has `success`, `walletDisconnected`, and an optional `error`. A server endpoint must be mounted for this operation.

## Server authentication

Set `cons_session={true}` on `ConnectWalletBT` to require sign-in before navigation. Cordy requests a one-time challenge and prompts the connected wallet to sign it: EVM wallets sign a SIWE (EIP-4361) message; Stellar wallets sign the server-created SEP-10 challenge transaction. The SDK sends the signed response to your server handler. On verification, the handler issues a 24-hour HTTP-only session cookie and returns the address and chain. Rejected or invalid signatures do not navigate.

### 1. Create the server instance

Pass secrets from your app's server environment. The SDK itself does not read environment variables. Keep this module server-only and never import it into a client component.

```ts
// src/lib/cordy-server.ts
import "server-only";
import { createCordyServer } from "@cordystackx/cordy_minikit/server";

export const cordyServer = createCordyServer({
  signingSecret: process.env.SIGNING_SECRET,
  jwtKey: process.env.JWT_SECRET,
  // Optional host allowlist:
  // allowedDomains: ["app.example.com"],
});
```

`SIGNING_SECRET` is the Stellar server signing key used to build SEP-10 challenges. `JWT_SECRET` is a random secret of at least 32 bytes used to sign short-lived challenge tokens and session cookies. Both are server-only; do not use `NEXT_PUBLIC_` names or pass them to `ProvidersClientWrapper`. EVM-only applications do not need a Stellar signing key.

### 2. Mount one dynamic route

For Next.js App Router, create a single route file:

```ts
// app/services/cons/[action]/route.ts
import { cordyServer } from "@/lib/cordy-server";

export const { GET, POST } = cordyServer.handler();
```

The folder path before `[action]` sets the URL prefix. This example serves `POST /services/cons/challenge`, `POST /services/cons/verify`, `POST /services/cons/disconnect`, and `GET /services/cons/session`. Unknown actions return 404; unsupported methods return 405.

The SDK uses `/services/cons` by default, so you do not need an extra prop when you keep the example path. If you move the route to `app/api/cons/[action]/route.ts`, its URL prefix becomes `/api/cons`; set the same value on the provider:

```tsx
<ProvidersClientWrapper assets={assets} consPath="/api/cons">
  {children}
</ProvidersClientWrapper>
```

The route location and `consPath` must match. The SDK will then call `/api/cons/challenge`, `/api/cons/verify`, `/api/cons/disconnect`, and `/api/cons/session`.

| Route file | URL prefix | Provider setting |
| --- | --- | --- |
| `app/services/cons/[action]/route.ts` | `/services/cons` | Default; no `consPath` needed. |
| `app/api/cons/[action]/route.ts` | `/api/cons` | `consPath="/api/cons"`. |

The handler file contents are identical in both locations:

```ts
import { cordyServer } from "@/lib/cordy-server";

export const { GET, POST } = cordyServer.handler();
```

### 3. Enable sign-in and read the session

The provider remains client-safe and only needs the public asset configuration:

```tsx
<ProvidersClientWrapper assets={assets}>
  {children}
</ProvidersClientWrapper>
```

```tsx
<ConnectWalletBT cons_session={true} navigate="/dashboard" />
```

Use `useConsSession()` for client UI and `cordyServer.session(request)` in protected server routes:

```tsx
const { loading, authenticated, address, chain } = useConsSession();
```

The hook is for displaying session state. Always check `cordyServer.session(request)` on the server before returning protected data. `cordyServer` also exposes `challenge(request)`, `verify(request)`, and `disconnect(request)` for custom routing; each returns a `{ success, ... }` result without throwing raw errors.

## `cordy.balance(options?)`

Reads the active wallet's full-precision balance:

```ts
const result = await cordy.balance();
const usdt = await cordy.balance({ asset: "USDT" });
```

The result is `{ success, network?, balance?, asset?, error? }`. EVM native assets use `provider.getBalance`; ERC-20 assets use `balanceOf`; Stellar assets use Horizon and the configured network.

Examples:

```ts
const result = await cordy.balance({ asset: "BOT" });

if (!result.success) {
  console.error(result.error);
} else {
  console.log(`${result.balance} ${result.asset} on ${result.network}`);
}
```

The returned balance is a full-precision decimal string. Format it for display; do not convert large token balances through JavaScript `Number` when precision matters.

Native EVM symbols come from `networks[].nativeCurrency`. ERC-20 symbols must
be present under the connected chain's `evm["<chainId>"]` entry. If the
connected wallet is on a chain absent from `networks`, the operation returns
an explicit unsupported-network error.

## `cordy.transfer(amount, recipient, options?)`

Transfers a configured ERC-20 or Stellar asset through the active wallet:

```ts
const result = await cordy.transfer("25", "0xRecipient", { asset: "USDT" });
```

For Stellar, use a `G...` recipient and an optional memo:

```ts
const result = await cordy.transfer("3.5", "GRecipient", {
  asset: "XLM",
  memo: "payment",
});
```

Transfers return `{ success, asset?, network?, transactionHash?, error? }` and require wallet approval. Native EVM assets such as ETH and BOT are currently supported by `cordy.balance()`; native EVM transfer support will be documented when it is released.

The recipient must match the active network:

- EVM: a valid `0x...` address.
- Stellar: a valid `G...` public address.

Amounts must be positive decimal values. The configured ERC-20 decimals determine token precision. Stellar amounts support up to seven decimal places, and Stellar text memos are limited to 28 UTF-8 bytes.

## `cordy.swap(amount, from, to, tolerancePercent?, options?)`

Swaps two assets from the configured registry using the connected wallet:

```ts
const result = await cordy.swap("10", "USDT", "BOT"); // EVM example
const saferResult = await cordy.swap("10", "USDT", "BOT", 1); // 1% tolerance
const selectedPools = await cordy.swap("10", "USDT", "BOT", 0.5, {
  version: "v3",
  feeTiers: [500, 3000],
}); // 0.5% slippage; quote only V3 pools with 0.05% or 0.30% fees
const stellarResult = await cordy.swap("10", "USDC", "XLM"); // Stellar example
```

The optional fourth argument is the slippage tolerance percentage. `1` means **1% tolerance**, so the minimum output is 99% of the current quote. If omitted, the default is 1%. Values must be from 0% up to, but not including, 100%.

Both assets must exist in the configured list for the wallet's current network. A missing asset returns `{ success: false, error }`. The result includes the input, estimated output, network, and transaction hash.

For EVM, configure a V2-compatible `swapRouterAddress`, a V3-compatible `swapV3` router and QuoterV2, or both. With both configured, the default `auto` mode compares available quotes and uses the best output. To select a version explicitly, pass a fifth argument: `cordy.swap("10", "USDT", "BOT", 1, { version: "v3" })`. To limit V3 quote search for one call, pass `feeTiers`, such as `{ version: "v3", feeTiers: [500, 3000] }`. Per-call tiers override the network's configured `swapV3.feeTiers`; omit them to use the configured tiers (or defaults `[500, 3000, 10000]`). With `version: "auto"`, V2 is still compared against the selected V3 tiers. These values select which pools to quote; they do not set slippage or create pools. Common values are `500` = 0.05%, `3000` = 0.30%, and `10000` = 1.00% pool fee. A tier must be enabled and have a pool for the token pair on that DEX. The fourth argument remains the slippage tolerance percentage. Add compatible router and quote contracts for each chain; support is configuration-driven and does not discover routers or guarantee liquidity on every network. If either asset is the chain's native currency, configure `wrappedNativeTokenAddress`. The optional fourth argument controls slippage tolerance and defaults to 1%. Stellar swaps use Horizon strict-send paths and set a 1% minimum-output tolerance. Stellar asset swaps need a valid available order-book path; the example uses `XLM`, not `XML`.

## `cordy.bridge(amount, from, to, recipient, options?)`

Bridges assets using one route from `assets.bridge.routes`. `from` and `to`
select the route's `"internal"` and `"external"` sides. The side's
`networkType` chooses EVM, Stellar, or a configured CCTP path. Pass
`{ routeId }` when more than one route is configured.

```ts
const result = await cordy.bridge(
  "10.5",
  "internal",
  "external",
  "0xEvmRecipient",
  { routeId: "my-evm-route" },
);

if (!result.success) console.error(result.error);
else console.log(result.status, result.transactionHash);
```

Use an EVM `0x...` recipient for EVM destinations and a Stellar `G...`
recipient for a Stellar destination. Configure both sides and the relevant
networks/assets under the same `assets.json` passed to
`ProvidersClientWrapper`; see [Bridge route setup](./environment.md#bridge-routes)
for complete EVM and Stellar/CCTP configuration examples.

### EVM validator routes

For EVM → EVM routes (`protocol: "custom"` or omitted), each side needs
`networkType: "evm"`, `chainId`, `networkName`, `bridgeAddress`,
`tokenAddress`, and matching `assetSymbol`. The route needs a 32-byte
validator-registered `resourceId`; each chain must also be configured under
`networks`. The wallet must be on the source chain and have the configured
asset and gas. Cordy approves the token if needed and submits the source
contract deposit. The bridge's validators/relayer handle destination delivery
asynchronously.

### Stellar validator routes

A custom Stellar → Stellar route pays the source asset to the configured
`bridgeAddress`. Set `networkType: "stellar"` on both sides, use a
validator-registered `resourceId`, and configure the source Stellar network,
asset, and trustline. Destination delivery is handled by the external service
that watches the source payment; Cordy does not relay or confirm it. An
optional `stellarMemo` is attached to the source payment for route
identification.

### Stellar and EVM through CCTP

For the Circle Stellar Testnet ↔ Ethereum Sepolia USDC route, set
`protocol: "cctp"` and configure Circle domain IDs and the deployed token,
TokenMessenger/TokenMessengerMinter, MessageTransmitter, and Stellar
CctpForwarder addresses. Stellar CCTP needs `stellarNetwork.sorobanRpcUrl` in
addition to Horizon and the matching network passphrase; configure the USDC
credit asset and issuer in `stellar`. Add the EVM chain/token to `networks`
and `evm` too. See the setup guide for the full JSON example and field-by-field
notes.

Direction changes which wallets and completion steps are needed:

- **Stellar → EVM:** Cordy requires a connected Stellar wallet with the USDC
  trustline and an EVM wallet on the destination chain. It signs Stellar
  approval/burn calls, waits for Circle attestation, and submits the EVM mint.
- **EVM → Stellar:** Cordy submits the EVM CCTP burn and returns with
  `status: "pending"`. The current SDK call does not submit the Stellar
  destination mint/forward. Confirm that the destination CCTP forwarder flow
  is operational and verify the Stellar balance separately; the burn hash by
  itself does not mean delivery completed.

#### UI: connect the EVM wallet for a Stellar → EVM bridge

The user starts with a connected Stellar wallet (Freighter). If there is no
EVM wallet connected for the destination, Cordy pauses the request and opens
`BridgeEvmWalletModal`. After the user connects an EVM wallet, Cordy switches
it to the configured destination chain and resumes the same request; the user
does not need to press the bridge button a second time. Mount the modal once in
the client component that owns the bridge action:

```tsx
"use client";

import { BridgeEvmWalletModal, cordy } from "@cordystackx/cordy_minikit";

export function StellarToEvmBridge({ amount, evmRecipient }: {
  amount: string;
  evmRecipient: string;
}) {
  async function startBridge() {
    const result = await cordy.bridge(
      amount,
      "internal", // Stellar side in this route
      "external", // Ethereum Sepolia side
      evmRecipient,
      { routeId: "stellar-testnet-sepolia-usdc" },
    );
    if (!result.success) console.error(result.error);
    else console.log(result.status, result.transactionHash);
  }

  return (
    <>
      <button type="button" onClick={() => void startBridge()}>
        Bridge USDC to Ethereum
      </button>
      <BridgeEvmWalletModal />
    </>
  );
}
```

For this direction, the Stellar wallet signs the source approval/burn and the
EVM wallet is needed to receive the attested destination mint. If the EVM
wallet is already connected, the modal stays closed. If the user closes or
rejects it, the bridge request is cancelled and no Stellar burn is submitted.
For EVM → Stellar, the EVM wallet is the source wallet; the modal is only
needed if that source EVM wallet is not connected. Mounting the modal once is
still sufficient for both directions.

A successful response confirms only the work indicated by that route and
`status`; it is not a general guarantee that destination funds are available.
For custom routes, destination delivery depends on the bridge validators. For
CCTP, use the direction-specific behavior above. Check the destination balance
or the relevant bridge/Circle status before treating the transfer as complete.
Amounts must be positive; EVM bridge amounts use the token's on-chain decimals
and Stellar payments allow up to seven decimal places. The demo's BOT Chain
Testnet source requires **more than 10 USDT**, so exactly 10 fails and 10.5
passes. Testnet assets have no real-world value.
### Deprecated compatibility APIs

These legacy helpers remain available for compatibility and are deprecated in favor of the unified `cordy.*` API:

- `CordyStackTrans()` and `CordyStackTransStellar()` → `cordy.transfer()`
- `getTokenBalance()` → `cordy.balance()`

Use `cordy.cons_verify()` or `useConsSession()` to read authentication state. For transfers and balances, prefer the typed `cordy.transfer()` and `cordy.balance()` results.
