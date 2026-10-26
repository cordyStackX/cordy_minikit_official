# Client API reference

Import the client API:

```ts
import { cordy } from "@cordystackx/cordy_minikit";
```

All methods return promises. Check `success` before using `balance`, `asset`, or `transactionHash`.

## `cordy.jwt_verify(options?)`

Checks the application session endpoint using credentials and returns the endpoint's JSON plus `authenticated: true` for a successful response. HTTP 401/403 returns `{ authenticated: false }`.

```ts
const session = await cordy.jwt_verify({ endpoint: "/api/session" });
```

The endpoint should validate the application's HttpOnly session cookie. This function does not decode or trust a JWT in browser storage.

## `cordy.jwt_disconnect(options?)`

Calls the application's logout endpoint, disconnects active EVM connectors, and clears the Minikit Stellar wallet selection.

```ts
const result = await cordy.jwt_disconnect({ endpoint: "/api/logout" });
```

The result has `success`, `walletDisconnected`, and optional `status`/`error` fields. The server endpoint should revoke or clear the session cookie.

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

## `cordy.swap(amount, from, to)`

Swaps two assets from the configured registry using the connected wallet:

```ts
const result = await cordy.swap("10", "USDT", "BOT"); // EVM example
const stellarResult = await cordy.swap("10", "USDC", "XLM"); // Stellar example
```

Both assets must exist in the configured list for the wallet's current network. A missing asset returns `{ success: false, error }`. The result includes the input, estimated output, network, and transaction hash.

For EVM, the corresponding `networks` JSON entry must provide a Uniswap V2-compatible `swapRouterAddress`. If either asset is the chain's native currency, configure `wrappedNativeTokenAddress` as well. The router quote uses 1% slippage tolerance and prompts for token approval when needed. Stellar swaps use Horizon strict-send paths and set a 1% minimum-output tolerance. Stellar asset swaps need a valid available order-book path; the example uses `XLM`, not `XML`.

## Deprecated compatibility API

`jwt_confirm()` is deprecated in 3.0.0. It remains an alias of `jwt_verify()` for compatibility:

```ts
const session = await cordy.jwt_confirm({ endpoint: "/api/session" });
```

Use `cordy.jwt_verify()` in new code.

## `cordy.bridge(amount, from, to, recipient)` — Experimental

`cordy.bridge()` is experimental in the current 3.0.0 release. It is provided for testnet evaluation and is not production-ready. The initial route supports test USDT between BOT Chain Testnet (`internal`) and Ethereum Sepolia (`external`) only:

```ts
const result = await cordy.bridge("12", "internal", "external", "0xRecipient");
// Reverse direction: connect the source wallet to Sepolia first.
const reverse = await cordy.bridge("5", "external", "internal", "0xRecipient");
```

The wallet must be connected to the selected source network. This call can prompt for a USDT approval followed by a bridge deposit. `success: true` means the source deposit was confirmed; delivery to the destination is asynchronous and handled by the bridge validators. The result includes `transactionHash` and, when an approval was needed, `approvalTransactionHash`. BOT Chain Testnet bridge-out requires more than 10 USDT. Testnet tokens have no real-world value.

For this test route, set the app's `NEXT_PUBLIC_CHAIN_ID=968`, BOT Chain Testnet RPC, and test USDT token address. Sepolia is included in the Minikit's Wagmi chain list so wallets can switch to it. The SDK currently hardcodes the published testnet bridge route and does not bridge Stellar, mainnet assets, or other networks.
