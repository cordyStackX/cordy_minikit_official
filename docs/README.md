# Cordy Minikit 3.0.5 Documentation

Cordy Minikit 3.0.5 provides wallet access, local wallet connection checks, asset transfers, and balance reads for EVM and Stellar/Soroban applications.

## Start here

1. Install the package and configure the environment in [Environment configuration](./environment.md).
2. Add `ProvidersClientWrapper` in your application's client providers.
3. Add the wallet button to a client component.
4. Use the current `cordy.*` methods from the [Client API reference](./api.md).
5. If upgrading an older integration, follow the [3.0.0 migration guide](./migration-3.0.0.md).

The package does not create wallet accounts, switch a user's network, or create your application's login session. Your application owns authentication, session cookies, recipient validation, and server-side authorization.

## Current public API

| API | Status | Purpose |
| --- | --- | --- |
| `cordy.configure()` | Current | Configure the application-owned asset registry. |
| `cordy.cons_verify()` | Current | Check local EVM or Stellar wallet connection state (200 connected, 401 disconnected). |
| `cordy.cons_disconnect()` | Current | Disconnect connected EVM and Stellar wallets locally; no endpoint required. |
| `cordy.transfer()` | Current | Transfer a configured EVM or Stellar asset. |
| `cordy.balance()` | Current | Read the active wallet's native or configured asset balance. |
| `cordy.swap()` | Current | Swap configured EVM or Stellar assets with optional percentage tolerance; defaults to 1%. |
| `cordy.bridge()` | Experimental | Test USDT between BOT Chain Testnet and Ethereum Sepolia. |

## Current API

- `cordy.swap()` — swaps configured EVM and Stellar assets with an optional percentage tolerance; `1` means 1%, and omission defaults to 1%.
- `cordy.bridge()` — **experimental** test USDT bridging between BOT Chain Testnet and Ethereum Sepolia only.

## Documentation

- [Environment configuration](./environment.md)
- [3.0.0 migration guide](./migration-3.0.0.md)
- [Client API reference](./api.md)
- [Provider and wallet UI setup](./setup.md)

## Compatibility

`jwt_confirm()` was removed in 3.0.2; use `cordy.cons_verify()`. `CordyStackTrans()`, `CordyStackTransStellar()`, and `getTokenBalance()` remain deprecated compatibility helpers. Use `cordy.transfer()` and `cordy.balance()` in new code.