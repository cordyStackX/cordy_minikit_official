# Cordy Minikit 3.1.0 Documentation

Cordy Minikit provides EVM and Stellar wallet access, server-verified wallet sign-in, asset transfers, balance reads, configurable EVM V2/V3 swaps, and configured EVM/Stellar bridge flows.

## Start here

1. Install the package and configure public assets in [Environment configuration](./environment.md).
2. Add `ProvidersClientWrapper` in your application's client providers.
3. Add the wallet button to a client component.
4. To enable sign-in, add a server-only auth handler and configure it with `createCordyServer()`.
5. Use the current `cordy.*` methods and `useConsSession()` from the [API reference](./api.md).
6. If upgrading an older integration, follow the [3.0.0 migration guide](./migration-3.0.0.md).

For copyable client examples showing how to call each function from your app UI, follow the [Use Cordy in your app guide](./recipes.md).

The package does not create wallet accounts or guarantee liquidity or bridge delivery. When configured, its server entry verifies wallet ownership and manages an HTTP-only session cookie. Your application remains responsible for protecting server routes and authorizing access to application data.

## Current public API

| API | Status | Purpose |
| --- | --- | --- |
| `cordy.configure()` | Current | Configure the application-owned asset registry. |
| `cordy.cons_verify()` | Current | Check the Cordy server session established by wallet signature. |
| `useConsSession()` | Current | Read session loading and authentication state in React components. |
| `createCordyServer()` | Current | Create server-only challenge, verify, session, and disconnect functions. |
| `cordy.cons_disconnect()` | Current | Clear the server session and disconnect connected wallets. |
| `cordy.transfer()` | Current | Transfer a configured EVM or Stellar asset. |
| `cordy.balance()` | Current | Read the active wallet's native or configured asset balance. |
| `cordy.swap()` | Current | Swap configured EVM or Stellar assets; EVM supports V2/V3 selection, per-call V3 fee tiers, and automatic quote selection. |
| `cordy.bridge()` | Current | Choose a configured EVM or CCTP route and direction; destination delivery is asynchronous unless the configured CCTP flow completes minting. |

## Current API

- `cordy.swap()` — swaps configured EVM and Stellar assets; EVM can use V2, V3, or automatic quote selection for configured routers. Pass `feeTiers` in the options to choose which V3 pools are quoted for one call.
- `cordy.bridge()` — choose a configured EVM validator or Stellar CCTP route with `routeId`, then choose its direction. EVM validator delivery is asynchronous; CCTP completes through attestation and destination mint.

EVM assets are grouped by numeric chain ID under `assets.evm`. Native EVM
currencies are defined only by `assets.networks[].nativeCurrency`. The SDK
allows wallet connection on unsupported chains but rejects EVM asset operations
on chains that are absent from `assets.networks`.

## Documentation

- [Environment configuration](./environment.md)
- [3.0.0 migration guide](./migration-3.0.0.md)
- [Client API reference](./api.md)
- [Provider and wallet UI setup](./setup.md)
- [Use Cordy in your app](./recipes.md)

For server authentication, follow [Server authentication](./api.md#server-authentication). Configure `SIGNING_SECRET` and `JWT_SECRET` in your app's server environment; the SDK accepts their values explicitly and never reads `process.env`.

## Compatibility

`jwt_confirm()` was removed in 3.0.2; use `cordy.cons_verify()`. `CordyStackTrans()`, `CordyStackTransStellar()`, and `getTokenBalance()` remain deprecated compatibility helpers. Use `cordy.transfer()` and `cordy.balance()` in new code.
