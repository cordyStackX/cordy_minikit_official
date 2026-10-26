# Cordy Minikit 3.0.0 Documentation

Cordy Minikit 3.0.0 provides wallet access, session verification, asset transfers, and balance reads for EVM and Stellar/Soroban applications.

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
| `cordy.jwt_verify()` | Current | Verify the application's HttpOnly session through its endpoint. |
| `cordy.jwt_disconnect()` | Current | Log out through the application endpoint and disconnect Minikit wallet state. |
| `cordy.transfer()` | Current | Transfer a configured EVM or Stellar asset. |
| `cordy.balance()` | Current | Read the active wallet's native or configured asset balance. |
| `cordy.swap()` | Current | Swap configured EVM or Stellar assets. |
| `cordy.bridge()` | Experimental | Test USDT between BOT Chain Testnet and Ethereum Sepolia. |

## Current API

- `cordy.swap()` — swaps configured EVM and Stellar assets.
- `cordy.bridge()` — **experimental** test USDT bridging between BOT Chain Testnet and Ethereum Sepolia only.

## Documentation

- [Environment configuration](./environment.md)
- [3.0.0 migration guide](./migration-3.0.0.md)
- [Client API reference](./api.md)
- [Provider and wallet UI setup](./setup.md)
- [Server session endpoint examples](./server-endpoints.md)

## Compatibility

`jwt_confirm()`, `CordyStackTrans()`, `CordyStackTransStellar()`, and `getTokenBalance()` are deprecated in 3.0.0 but remain available for compatibility. Use `cordy.jwt_verify()`, `cordy.transfer()`, and `cordy.balance()` in new code.
