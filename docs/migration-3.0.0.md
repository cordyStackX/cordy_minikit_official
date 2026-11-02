# Migrating to 3.0.0

## What changed

3.0.0 adds the unified `cordy.*` client surface, provider-supplied JSON configuration, native EVM balance reads, and explicit Stellar network validation. It does not silently select a testnet when configuration is missing.

`cordy.swap()` accepts an optional fourth argument for slippage tolerance percentage. `1` means 1%; omission keeps the 1% default.

Before debugging an API result, confirm:

1. The consuming app's JSON config includes the selected network and asset.
2. The JSON config is passed to `ProvidersClientWrapper`.
3. The wallet is connected to the same chain ID as the configured RPC.
4. The asset symbol resolves to an asset entry for that chain.

## API naming

Use the 3.0.0 client surface:

```ts
const wallet = await cordy.cons_verify();
await cordy.cons_disconnect();
await cordy.transfer("1", recipient);
const balance = await cordy.balance();
```

Replace:

```ts
await cordy.cons_confirm();
```

with:

```ts
await cordy.cons_verify();
```

`cons_confirm()` was deprecated in 3.0.0 and removed in 3.0.2; use `cordy.cons_verify()`. `CordyStackTrans()`, `CordyStackTransStellar()`, and `getTokenBalance()` remain deprecated compatibility helpers. Replace them with `cordy.transfer()` and `cordy.balance()`. The new balance and transfer methods return explicit success/error results.

`cordy.cons_verify()` checks local wallet connection state only; it does not create or validate an authenticated server session. `cordy.cons_disconnect()` disconnects the wallet without an application endpoint.

## Configuration changes

WalletConnect, EVM networks/assets, and Stellar Horizon/network/assets are now provided through the JSON `assets` prop on `ProvidersClientWrapper`. See [environment configuration](./environment.md) for the schema. Remove the corresponding public `NEXT_PUBLIC_*` variables; the SDK no longer reads them. Missing network configuration prevents wallet connection and returns an explicit configuration error instead of using an unintended network.

## Network matching

The configured EVM RPC and connected wallet must use the same chain ID. If the application is configured for BOT Chain `677`, the wallet must also be on `677`. The RPC URL cannot change the wallet's active network.

## Experimental bridge test route

`cordy.bridge()` was experimental in 3.0.0 and was provided for testnet evaluation only. It supported test USDT between BOT Chain Testnet and Ethereum Sepolia. See [the current bridge API reference](./api.md#cordybridgeamount-from-to-recipient-options).

## EVM asset registry update

EVM assets are now grouped by chain ID:

```json
{
  "evm": {
    "968": [
      { "symbol": "USDT", "contractAddress": "0x..." }
    ]
  }
}
```

Remove `chainId` from individual EVM asset entries. Native currencies belong
in `networks[].nativeCurrency`, so remove redundant native entries from
`evm`. The SDK rejects asset operations on EVM chains that are not present in
`networks`.
