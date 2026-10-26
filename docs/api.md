# Client API reference

Import the client API:

```ts
import { cordy } from "@cordystackx/cordy_minikit";
```

All four methods return promises. Check `success` before using `balance`, `asset`, or `transactionHash`.

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

## Deprecated compatibility API

`jwt_confirm()` is deprecated in 3.0.0. It remains an alias of `jwt_verify()` for compatibility:

```ts
const session = await cordy.jwt_confirm({ endpoint: "/api/session" });
```

Use `cordy.jwt_verify()` in new code.

## Planned APIs

`cordy.swap()` and `cordy.bridge()` are planned APIs for a future release. No callable implementation or stable options contract is included in 3.0.0.
