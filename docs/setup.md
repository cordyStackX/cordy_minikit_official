# Provider and wallet UI setup

## Install

```bash
pnpm add @cordystackx/cordy_minikit @tanstack/react-query
```

The package expects React 18 or newer and a client-side React environment for wallet UI.

## Add the provider wrapper

Create a client component such as `app/providers.tsx`:

```tsx
"use client";

import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  ProvidersClientWrapper,
  type CordyAssetsConfig,
} from "@cordystackx/cordy_minikit";
import assets from "./assets.json";

const queryClient = new QueryClient();
const configuredAssets = assets as CordyAssetsConfig;

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ProvidersClientWrapper assets={configuredAssets}>
        {children}
      </ProvidersClientWrapper>
    </QueryClientProvider>
  );
}
```

Wrap the application in `app/layout.tsx`:

```tsx
import Providers from "./providers";

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

`ProvidersClientWrapper` configures Wagmi, WalletConnect, EVM networks, Stellar endpoints, and the asset registry from this JSON. The wrapper must be above `ConnectWalletBT` and any component that calls `cordy.balance()` or `cordy.transfer()`. No `NEXT_PUBLIC_*` wallet or network variables are required.

The authentication route defaults to `/services/cons`. If you mount it elsewhere, set `consPath` to the same base path. For example, `app/api/cons/[action]/route.ts` requires `<ProvidersClientWrapper assets={configuredAssets} consPath="/api/cons">`. See the [route setup example](./api.md#2-mount-one-dynamic-route).

## Render the wallet button

```tsx
"use client";

import { ConnectWalletBT } from "@cordystackx/cordy_minikit";

export function WalletAccess() {
  return <ConnectWalletBT />;
}
```

For applications that need session-aware navigation:

```tsx
<ConnectWalletBT cons_session={true} navigate="/dashboard" />
```

When `cons_session` is enabled, Cordy signs in through its server authentication handler before navigating. Follow [Server authentication](./api.md#server-authentication) to create `cordyServer` and mount the single dynamic route. Keep `SIGNING_SECRET` and `JWT_SECRET` in the server environment; they do not belong in this client provider.

## Active wallet rules

The active wallet is selected by the last successful connection:

- EVM: MetaMask, Coinbase Wallet, or WalletConnect-compatible EVM wallets.
- Stellar: Freighter.

`cordy.balance()` and `cordy.transfer()` use the active wallet. Connect the intended wallet and network before calling them. The RPC URL cannot switch a user's wallet network.

## Asset file example

```json
{
  "walletConnectProjectId": "your-public-project-id",
  "networks": [
    {
      "chainId": 677,
      "name": "BOT Chain",
      "nativeCurrency": { "name": "BOT", "symbol": "BOT", "decimals": 18 },
      "rpcUrl": "https://rpc.example",
      "blockExplorerUrl": "https://scan.example",
      "swapRouterAddress": "0xRouterAddress",
      "wrappedNativeTokenAddress": "0xWrappedNativeAddress"
    }
  ],
  "stellarNetwork": {
    "horizonUrl": "https://horizon-testnet.stellar.org",
    "networkPassphrase": "Test SDF Network ; September 2015"
  },
  "evm": {
    "1": [
      {
        "symbol": "USDT",
        "contractAddress": "0xTokenContract",
        "decimals": 6,
        "rpcUrl": "https://rpc.example"
      }
    ]
  },
  "stellar": [
    { "symbol": "XLM", "type": "native" },
    {
      "symbol": "USDC",
      "type": "credit",
      "code": "USDC",
      "issuer": "G..."
    }
  ]
}
```

Group EVM assets under their numeric chain ID. Add another chain as another key, such as `"11155111": [...]`. Use the exact contract address for the target chain. A wallet balance in another network or another token contract is not interchangeable.

Native EVM currencies are defined by `networks[].nativeCurrency`; do not
repeat BOT, ETH, or another native currency in `evm`. Keep only ERC-20
contracts in the chain-keyed registry.

## Bridge wallet modal

Mount the SDK modal once in a client component:

```tsx
"use client";

import { BridgeEvmWalletModal, cordy } from "@cordystackx/cordy_minikit";

export function BridgeAccess({ recipient }: { recipient: string }) {
  async function startBridge() {
    const result = await cordy.bridge(
      "10.5",
      "internal",
      "external",
      recipient,
      { routeId: "bot-testnet-sepolia-usdt" },
    );
    console.log(result);
  }

  return (
    <>
      <button type="button" onClick={() => void startBridge()}>Bridge 10.5 USDT</button>
      <BridgeEvmWalletModal />
    </>
  );
}
```

When a bridge needs an EVM wallet and none is connected, `cordy.bridge()`
opens the modal, waits for connection, prepares the configured route network,
and continues without a second click. The exported `useBridgeEvmWallet()`
hook remains available for applications requiring custom behavior.

## Use the functions from your UI

Import `cordy` in a client component below `ProvidersClientWrapper`. Call a function in response to a user action, such as a button click or form submit, then show its success data or error. The [Use Cordy in your app guide](./recipes.md) provides complete examples for balance reads, transfers, swaps, bridges, session display, and logout.
