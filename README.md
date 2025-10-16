---
© 2025 Cordy StackX (@cordystackx)
Licensed under the MIT License.  
Unauthorized removal of this notice violates the license terms.
---

# Github Official Repo
```bash
https://github.com/cordyStackX/cordy_minikit_official.git
```

# 🧩 cordy_minikit — Web3 Mini Kit by cordyStackX

A lightweight Web3 toolkit for building wallet UIs, controllers, and provider wrappers — designed for modern frameworks like **Next.js** and **Vite**
Built with **Wagmi**, **Viem**, **Ethers** and **TypeScript** (compiled to JS for runtime).

---

## 🚀 Features

- 🔗 **Wallet Connect / Disconnect**  
  Simple connect button and hooks for EVM-based wallets.
- 🧰 **Prebuilt UI Components**  
  Reusable components like `ConnectWalletBT`, `CordyStackTrans`.
- ⚙️ **Controllers**  
  Manage wallet actions, balances, and transactions.
- 🎨 **CSS Modules + CSS Variables**  
  Easy theming support for dark/light mode.
- 📦 **Tree-shakable, Typed, and Lightweight**
- 🧩 **Framework-Agnostic**
  Works with Next.js or Vite.

---

## 🧭 SOA — System Overview & Architecture

> A concise overview of the library’s structure, purpose, and build/publish process.

### 1. Purpose

`@cordystackx/cordy_minikit` provides modular Web3 utilities and UI components for dApp builders.  
It’s designed to be embedded in frontend frameworks where you want instant Web3 wallet connectivity and a clean UI layer.

**Main Goals:**
- Simplify wallet integrations.
- Provide clean, framework-ready UI + controllers.
- Maintain portability for fullstack and extension apps.
- Keep theming customizable with CSS variables.

---

### 2. High-level Architecture

```bash
root
├── chains/ # chain definitions and helpers
├── client__provider.tsx # provider client wrapper (wagmi/viem context)
├── components/ # UI components (Connect_wallet_bt, UI_Comp)
├── controllers/ # imperative components & logic (wallet ops)
├── config/ # ABIs and static configuration
├── css/ # CSS Modules and styles
├── dist/ # compiled JS + .d.ts for publishing
├── index.ts # main export aggregator
└── package.json
```



# Get Started

## Setup

1. Install the NPM Packages 
```bash
npm i @cordystackx/cordy_minikit@latest
```

2. Create env file
```bash
NEXT_PUBLIC_RPC_ENDPOINT=
NEXT_PUBLIC_TOKENADDRESS=
NEXT_PUBLIC_PLATFORM_ADDRESS=
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
```

3. Create folder of /services/minikit/providers.ts

> Note: Make sure you install @tanstack/react-query for QueryClient and QueryClientProviders

```ts
"use client";
import { ReactNode } from "react";
import { ProvidersClientWrapper } from "@cordystackx/cordy_minikit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export default function Providers({ children }: { children: ReactNode }) {

    return(
        <QueryClientProvider client={queryClient}>
            <ProvidersClientWrapper>
                {children}
            </ProvidersClientWrapper>
        </QueryClientProvider>
    );

}
```

4. then import it both CSS Module into the /app/layout.tsx
```ts

import {
    Providers
} from "@/app/services/minikit/providers";
import '@cordystackx/cordy_minikit/dist/css/UI_Comp/styles.module.css';
import '@cordystackx/cordy_minikit/dist/css/Buttons/styles.module.css';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
          <Providers>
            {children}  
          </Providers>
      </body>
    </html>
  );
}
```

## Usage

1. Connect Buttons — ConnectWalletBT

The ConnectWalletBT component provides a plug-and-play wallet connection button for any Web3 application.
It automatically handles connecting, disconnecting, and managing wallet sessions using Wagmi and Viem under the hood.

```ts
import { 
    ConnectWalletBT
} from "@cordystackx/cordy_minikit";

<ConnectWalletBT />
```

2. Button Transactions - CordyStackTrans

The CordyStackTrans function provides a simple and reusable transaction handler for EVM-based networks.
It allows developers to trigger ERC20 or native token transfers directly from UI components with minimal setup.

```ts
import { CordyStackTrans } from "@cordystackx/cordy_minikit";

// Example Usage
CordyStackTrans(address: string, cost: number);

const trans = CordyStackTrans();

if (trans) {
  return true;  // Transaction successfull
} else {
  return false; // Transaction failed or rejected
}
```


**Runtime contract:**
- Imports resolve to `dist/index.js`
- `.d.ts` shipped for TS projects
- Pure ESM/JS compatible with Next.js and Vite

---

### 3. File Responsibilities

| Folder/File | Description |
|--------------|-------------|
| `chains/*` | Chain configuration and utilities (Sepolia, Base, etc.) |
| `client__provider.tsx` | React provider wrapper for Wagmi/Viem clients |
| `components/*` | Connect wallet, UI components |
| `controllers/*` | Logic-based hooks and components for Web3 ops |
| `config/*` | ABIs, static configs |
| `css/*` | Scoped CSS Modules and base theme |
| `dist/*` | Compiled JS & type declarations (published bundle) |

---

### 4. Build & Publish (npm)

#### ✅ Setup `package.json`
```json
{
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "clean": "rm -rf dist",
    "build": "tsc",
    "prepublishOnly": "pnpm run build"
  },
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org/"
  }
}
```