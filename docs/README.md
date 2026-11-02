# Cordy Minikit 3.0.10 Documentation

Cordy Minikit provides wallet access, local wallet connection checks, asset transfers, balance reads, configurable EVM V2/V3 swaps, and configured EVM/Stellar bridge flows.

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
| `cordy.swap()` | Current | Swap configured EVM or Stellar assets; EVM supports V2/V3 selection, per-call V3 fee tiers, and automatic quote selection. |
| `cordy.bridge()` | Current | Choose a configured EVM or CCTP route and direction; destination delivery is asynchronous unless the configured CCTP flow completes minting. |

## Current API

- `cordy.swap()` — swaps configured EVM and Stellar assets; EVM can use V2, V3, or automatic quote selection for configured routers. Pass `feeTiers` in the options to choose which V3 pools are quoted for one call.
- `cordy.bridge()` — choose a configured EVM route with `routeId`, then choose its direction. Destination delivery is asynchronous.

EVM assets are grouped by numeric chain ID under `assets.evm`. Native EVM
currencies are defined only by `assets.networks[].nativeCurrency`. The SDK
allows wallet connection on unsupported chains but rejects EVM asset operations
on chains that are absent from `assets.networks`.

## Documentation

- [Environment configuration](./environment.md)
- [3.0.0 migration guide](./migration-3.0.0.md)
- [Client API reference](./api.md)
- [Provider and wallet UI setup](./setup.md)

## Compatibility

`jwt_confirm()` was removed in 3.0.2; use `cordy.cons_verify()`. `CordyStackTrans()`, `CordyStackTransStellar()`, and `getTokenBalance()` remain deprecated compatibility helpers. Use `cordy.transfer()` and `cordy.balance()` in new code.
