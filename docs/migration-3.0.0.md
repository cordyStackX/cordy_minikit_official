# Migrating to 3.0.0

## What changed

3.0.0 adds the unified `cordy.*` client surface, strict consumer-owned environment configuration, native EVM balance reads, and explicit Stellar network validation. It does not silently select a testnet when configuration is missing.

Before debugging an API result, confirm:

1. The consuming app's `.env.local` contains the required values.
2. The development server was restarted after editing `.env.local`.
3. The wallet is connected to the same chain ID as the configured RPC.
4. The asset symbol resolves to an asset entry for that chain.

## API naming

Use the 3.0.0 client surface:

```ts
const session = await cordy.jwt_verify();
await cordy.jwt_disconnect();
await cordy.transfer("1", recipient);
const balance = await cordy.balance();
```

Replace:

```ts
await cordy.jwt_confirm();
```

with:

```ts
await cordy.jwt_verify();
```

`jwt_confirm()` still works as a deprecated alias in 3.0.0. Legacy controller helpers such as `CordyStackTrans` and `CordyStackTransStellar` remain exported for compatibility, but new integrations should use `cordy.transfer()`.

The old `getTokenBalance()` controller is also a compatibility helper. It returns `{ balance: "0", symbol: "" }` after logging a read failure, so new code should prefer `cordy.balance()` to receive an explicit `{ success, error }` result.

## Environment changes

The consuming application must provide the new EVM variables when using a custom EVM network:

```env
NEXT_PUBLIC_RPC_ENDPOINT=https://your-rpc.example
NEXT_PUBLIC_CHAIN_ID=677
NEXT_PUBLIC_CHAIN_NAME=Your Network
NEXT_PUBLIC_BLOCK_EXPLORER_URL=https://explorer.example
NEXT_PUBLIC_TOKENADDRESS=0xYourDefaultErc20Contract
```

The chain name and explorer URL are optional metadata; RPC endpoint, chain ID, and default token address are required for EVM connection and default token reads.

Stellar no longer silently falls back to testnet. Provide:

```env
NEXT_PUBLIC_STELLAR_HORIZON=https://horizon-testnet.stellar.org
NEXT_PUBLIC_STELLAR_CONTRACT_ID=CCXI...
NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
```

Missing configuration prevents wallet connection and returns an explicit configuration error instead of using an unintended network.

## Network matching

The configured EVM RPC and connected wallet must use the same chain ID. If the application is configured for BOT Chain `677`, the wallet must also be on `677`. The RPC URL cannot change the wallet's active network.

## Experimental bridge test route

`cordy.bridge()` is experimental in 3.0.0 and is provided for testnet evaluation only. It supports test USDT between BOT Chain Testnet and Ethereum Sepolia. It is not production-ready and does not support production networks or Stellar. See [the bridge API reference](./api.md#cordybridgeamount-from-to-recipient).
