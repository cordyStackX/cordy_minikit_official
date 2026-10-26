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

`ProvidersClientWrapper` configures the active Wagmi config and the optional asset registry. The wrapper must be above `ConnectWalletBT` and any component that calls `cordy.balance()` or `cordy.transfer()`.

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
<ConnectWalletBT jwt_session={true} navigate="/dashboard" />
```

When `jwt_session` is enabled, your application must provide the session endpoint used by the login flow. The wallet button itself does not mint or verify a JWT.

## Active wallet rules

The active wallet is selected by the last successful connection:

- EVM: MetaMask, Coinbase Wallet, or WalletConnect-compatible EVM wallets.
- Stellar: Freighter.

`cordy.balance()` and `cordy.transfer()` use the active wallet. Connect the intended wallet and network before calling them. The RPC URL cannot switch a user's wallet network.

## Asset file example

```json
{
  "evm": [
    {
      "symbol": "USDT",
      "chainId": 677,
      "contractAddress": "0xTokenContract",
      "decimals": 6,
      "rpcUrl": "https://rpc.example"
    },
    {
      "symbol": "BOT",
      "type": "native",
      "chainId": 677,
      "decimals": 18
    }
  ],
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

Use the exact contract address for the target chain. A wallet balance in another network or another token contract is not interchangeable.
