# Cordy Minikit 3.0.0 Documentation

Cordy Minikit 3.0.0 provides wallet access, session verification, asset transfers, and balance reads for EVM and Stellar/Soroban applications.

## Start here

1. Install the package and configure the environment in [Environment configuration](./environment.md).
2. Add `ProvidersClientWrapper` in your application's client providers.
3. Add the wallet button to a client component.
4. Use the four current `cordy.*` methods from [Client API reference](./api.md).
5. If upgrading an older integration, follow the [3.0.0 migration guide](./migration-3.0.0.md).

The package does not create wallet accounts, switch a user's network, or create your application's login session. Your application owns authentication, session cookies, recipient validation, and server-side authorization.

## Current public API

| API | Status | Purpose |
| --- | --- | --- |
| `cordy.jwt_verify()` | Current | Verify the application's HttpOnly session through its endpoint. |
| `cordy.jwt_disconnect()` | Current | Log out through the application endpoint and disconnect Minikit wallet state. |
| `cordy.transfer()` | Current | Transfer a configured EVM or Stellar asset. |
| `cordy.balance()` | Current | Read the active wallet's native or configured asset balance. |

## Planned API

The following APIs are reserved for a future release. They are documented as planned only and must not be called in 3.0.0:

- `cordy.swap()` — planned token swapping support.
- `cordy.bridge()` — planned cross-network bridging support.

## Documentation

- [Environment configuration](./environment.md)
- [3.0.0 migration guide](./migration-3.0.0.md)
- [Client API reference](./api.md)
- [Provider and wallet UI setup](./setup.md)
- [Server session endpoint examples](./server-endpoints.md)

## Compatibility

`jwt_confirm()` remains available as a deprecated alias for `jwt_verify()` in 3.0.0. New applications should use `cordy.jwt_verify()` and existing applications should migrate when convenient.
