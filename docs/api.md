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

Choose a route from `assets.bridge.routes`, then choose its direction. `from` and `to` are `"internal"` or `"external"`; these labels map to chain details in that route.

```ts
// Demo route: BOT Chain Testnet -> Ethereum Sepolia.
const result = await cordy.bridge(
  "10.5",
  "internal",
  "external",
  "0xRecipient",
  { routeId: "bot-testnet-sepolia-usdt" },
);

// Another configured route: BNB Smart Chain Testnet -> BOT Chain Testnet.
const reverse = await cordy.bridge(
  "5",
  "external",
  "internal",
  "0xRecipient",
  { routeId: "bot-testnet-bsc-testnet-usdt" },
);
```

`routeId` is required when more than one route is configured. If there is only one route, it can be omitted. The wallet must be connected to the source chain, have enough of that route's token, and have gas for the source transaction. The recipient address must be valid for the destination EVM chain.

### What the call does

1. Cordy checks the selected route and source network.
2. If needed, it asks the wallet to approve the source token for the source bridge contract.
3. It calls the source contract's `deposit(destinationChainId, resourceId, recipient, amount)` and waits for that transaction to confirm.
4. Bridge validators detect the deposit and deliver the asset on the destination chain. This happens asynchronously after the Cordy call returns.

If no EVM wallet is connected, the SDK-owned `BridgeEvmWalletModal` opens
automatically. After connection, the SDK revalidates the request, prepares the
configured route chain, and resumes the same call without a second click.
Closing or rejecting the modal clears the request and does not submit a source
deposit.

The call does not directly transfer tokens between chains. `success: true` means the **source deposit** confirmed. `status: "submitted"` means destination delivery is pending; it does not confirm the recipient has received funds. `transactionHash` is the source deposit hash. `approvalTransactionHash` appears only if an approval transaction was needed. Check the destination balance or the bridge operator's status service to confirm delivery. Cordy does not poll for destination completion.

The configured Stellar Testnet ↔ Ethereum Sepolia USDC route uses Circle CCTP:
the source USDC is burned, Circle attestation is awaited, and destination USDC
is minted through the destination MessageTransmitter. This differs from the
custom EVM bridge routes, which require an external validator or relayer for
destination delivery.

In the demo, the BOT Chain Testnet source requires **more than 10 USDT**, so exactly 10 fails and 10.5 passes. The Sepolia and BNB Testnet sources have no configured minimum. These are testnet assets with no real-world value.

### Deprecated compatibility APIs

These legacy helpers remain available for compatibility and are deprecated in favor of the unified `cordy.*` API:

- `CordyStackTrans()` and `CordyStackTransStellar()` → `cordy.transfer()`
- `getTokenBalance()` → `cordy.balance()`

Use `cordy.cons_verify()` or `useConsSession()` to read authentication state. For transfers and balances, prefer the typed `cordy.transfer()` and `cordy.balance()` results.
