# Client API reference

Import the client API:

```ts
import { cordy } from "@cordystackx/cordy_minikit";
```

All methods return promises. Check `success` before using `balance`, `asset`, or `transactionHash`.

## `cordy.configure({ assets })`

Configure the caller-owned EVM, bridge, and Stellar registry before calling balance, transfer, swap, or bridge methods. Most apps should pass the registry to `ProvidersClientWrapper`, which configures Cordy for the app:

```tsx
<ProvidersClientWrapper assets={assets}>
  {children}
</ProvidersClientWrapper>
```

You can also configure it directly with `cordy.configure({ assets })`. The `assets` value follows the [`CordyAssetsConfig`](./environment.md#asset-registry) shape.

## `cordy.cons_verify()`

Checks the current browser wallet connection without calling an application endpoint. It returns status `200` with the connected wallet details, or status `401` when no wallet is connected:

```ts
const result = await cordy.cons_verify();
if (result.status === 200) console.log(result.network, result.address);
```

This checks local connection state only; it does not authenticate wallet ownership to a server. Use a signature challenge and server verification when authorizing protected server actions.

## `cordy.cons_disconnect()`

Disconnects active EVM connectors and clears the Minikit Stellar wallet selection. It makes no endpoint request and needs no session environment variables.

```ts
const result = await cordy.cons_disconnect();
```

The result has `success`, `walletDisconnected`, and an optional `error`.

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

Use `cordy.cons_verify()` to check browser wallet connection state. For transfers and balances, prefer the typed `cordy.transfer()` and `cordy.balance()` results.
