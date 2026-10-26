
<div align="center">
  <img src="https://raw.githubusercontent.com/cordyStackX/cordy_minikit_official/21cb17b5569b79b29545da80da33d82625e26c7b/assets/cordy-logo.svg" alt="Cordy Minikit logo" width="160" />
  <h1>Cordy Minikit</h1>
  <p>Typed Web3 toolkit for EVM and Stellar/Soroban wallet connections, balances, transfers, and session helpers.</p>
</div>

<p align="center">
  <a href="https://badge.socket.dev/npm/package/@cordystackx/cordy_minikit/3.0.0">
    <img src="https://badge.socket.dev/npm/package/@cordystackx/cordy_minikit/3.0.0" alt="Socket Badge" />
  </a>
</p>

<div align="center">
  <img src="https://raw.githubusercontent.com/cordyStackX/cordy_minikit_official/refs/heads/main/assets/demo1.png" alt="Cordy Minikit wallet connection interface" width="31%" />
  <img src="https://raw.githubusercontent.com/cordyStackX/cordy_minikit_official/refs/heads/main/assets/demo2.png" alt="Cordy Minikit EVM wallet interface" width="31%" />
  <img src="https://raw.githubusercontent.com/cordyStackX/cordy_minikit_official/refs/heads/main/assets/demo3.png" alt="Cordy Minikit Stellar wallet interface" width="31%" />
</div>

<p align="center">
  <a href="https://www.npmjs.com/package/@cordystackx/cordy_minikit">NPM</a>
  ·
  <a href="https://github.com/cordyStackX/cordy_minikit_official">GitHub</a>
  ·
  <a href="https://github.com/cordyStackX/cordy_minikit_official/blob/main/docs/README.md">Documentation</a>
</p>

---
© 2025 Cordy StackX (@cordystackx) · Licensed under the MIT License.
---

## Install

```bash
npm install @cordystackx/cordy_minikit
# or
pnpm add @cordystackx/cordy_minikit
```

## 3.0.0 documentation

Read the complete documentation in the [`docs/` folder](./docs/README.md):

- [Documentation index](https://github.com/cordyStackX/cordy_minikit_official/blob/main/docs/README.md)
- [Environment configuration](https://github.com/cordyStackX/cordy_minikit_official/blob/main/docs/environment.md)
- [3.0.0 API reference](https://github.com/cordyStackX/cordy_minikit_official/blob/main/docs/api.md)
- [3.0.0 migration guide](https://github.com/cordyStackX/cordy_minikit_official/blob/main/docs/migration-3.0.0.md)
- [Provider and wallet UI setup](https://github.com/cordyStackX/cordy_minikit_official/blob/main/docs/setup.md)
- [Server session endpoint examples](https://github.com/cordyStackX/cordy_minikit_official/blob/main/docs/server-endpoints.md)

## Current API

```ts
import { cordy } from "@cordystackx/cordy_minikit";

const session = await cordy.jwt_verify();
const balance = await cordy.balance();
const transfer = await cordy.transfer("1", recipient);
await cordy.jwt_disconnect();
```

The current 3.0.0 API is:

- `cordy.configure({ assets })`
- `cordy.jwt_verify()`
- `cordy.jwt_disconnect()`
- `cordy.transfer()`
- `cordy.balance()`
- `cordy.swap(amount, from, to)`

Use `cordy.jwt_verify()` to check the app's session. Legacy controller helpers remain available for compatibility, but new integrations should use the `cordy.*` API.

## Experimental API

`cordy.bridge()` is experimental in 3.0.0 and currently supports test USDT between BOT Chain Testnet and Ethereum Sepolia only. See the [bridge API example](./docs/api.md#cordybridgeamount-from-to-recipient).

`cordy.swap(amount, from, to, tolerancePercent?)` is available for configured EVM and Stellar assets. EVM networks need a Uniswap V2-compatible `swapRouterAddress`; native EVM swaps also need `wrappedNativeTokenAddress`. Stellar swaps use Horizon strict-send path payments and require a live liquidity path. The optional fourth argument is a percentage: `1` means 1% tolerance, and omission defaults to 1%.

## Links

- [NPM package](https://www.npmjs.com/package/@cordystackx/cordy_minikit)
- [GitHub repository](https://github.com/cordyStackX/cordy_minikit_official)
- [Changelog](https://github.com/cordyStackX/cordy_minikit_official/blob/main/CHANGELOG.md)
- [Contributing guide](https://github.com/cordyStackX/cordy_minikit_official/blob/main/CONTRIBUTING.md)
- [Security policy](https://github.com/cordyStackX/cordy_minikit_official/blob/main/SECURITY.md)
