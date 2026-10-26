# Client API reference

Import the client API:

```ts
import { cordy } from "@cordystackx/cordy_minikit";
```

All methods return promises. Check `success` before using `balance`, `asset`, or `transactionHash`.

## `cordy.configure({ assets })`

Configure the caller-owned EVM and Stellar asset registry before calling balance, transfer, or swap methods. Most apps should pass the registry to `ProvidersClientWrapper`, which configures Cordy for the app:

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

## `cordy.swap(amount, from, to, tolerancePercent?)`

Swaps two assets from the configured registry using the connected wallet:

```ts
const result = await cordy.swap("10", "USDT", "BOT"); // EVM example
const saferResult = await cordy.swap("10", "USDT", "BOT", 1); // 1% tolerance
const stellarResult = await cordy.swap("10", "USDC", "XLM"); // Stellar example
```

The optional fourth argument is the slippage tolerance percentage. `1` means **1% tolerance**, so the minimum output is 99% of the current quote. If omitted, the default is 1%. Values must be from 0% up to, but not including, 100%.

Both assets must exist in the configured list for the wallet's current network. A missing asset returns `{ success: false, error }`. The result includes the input, estimated output, network, and transaction hash.

For EVM, the corresponding `networks` JSON entry must provide a Uniswap V2-compatible `swapRouterAddress`. If either asset is the chain's native currency, configure `wrappedNativeTokenAddress` as well. The router quote uses 1% slippage tolerance and prompts for token approval when needed. Stellar swaps use Horizon strict-send paths and set a 1% minimum-output tolerance. Stellar asset swaps need a valid available order-book path; the example uses `XLM`, not `XML`.

## Deprecated compatibility APIs

These legacy helpers remain available in 3.0.0 for compatibility and are deprecated in favor of the unified `cordy.*` API:

- `CordyStackTrans()` and `CordyStackTransStellar()` → `cordy.transfer()`
- `getTokenBalance()` → `cordy.balance()`

Use `cordy.cons_verify()` to check browser wallet connection state. For transfers and balances, prefer the typed `cordy.transfer()` and `cordy.balance()` results.

## `cordy.bridge(amount, from, to, recipient)` — Experimental

`cordy.bridge()` is experimental in the current 3.0.0 release. It is provided for testnet evaluation and is not production-ready. The initial route supports test USDT between BOT Chain Testnet (`internal`) and Ethereum Sepolia (`external`) only:

```ts
const result = await cordy.bridge("12", "internal", "external", "0xRecipient");
// Reverse direction: connect the source wallet to Sepolia first.
const reverse = await cordy.bridge("5", "external", "internal", "0xRecipient");
```

The wallet must be connected to the selected source network. This call can prompt for a USDT approval followed by a bridge deposit. `success: true` means the source deposit was confirmed; delivery to the destination is asynchronous and handled by the bridge validators. The result includes `transactionHash` and, when an approval was needed, `approvalTransactionHash`. BOT Chain Testnet bridge-out requires more than 10 USDT. Testnet tokens have no real-world value.

For this test route, add BOT Chain Testnet (chain ID `968`) and its RPC to the app's `networks` array in the JSON passed to `ProvidersClientWrapper`. The bridge route and test USDT contracts are currently hardcoded in the SDK. Sepolia is included in the Minikit's Wagmi chain list so wallets can switch to it. The SDK currently does not bridge Stellar, mainnet assets, or other networks.
