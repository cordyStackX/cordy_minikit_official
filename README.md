---
© 2025 Cordy StackX (@cordystackx)  
Licensed under the MIT License.  
Unauthorized removal of this notice violates the license terms.
---

# 🧩 Cordy MiniKit — Web3 Toolkit by CordyStackX

[![npm version](https://img.shields.io/npm/v/@cordystackx/cordy_minikit.svg)](https://www.npmjs.com/package/@cordystackx/cordy_minikit)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A lightweight, production-ready Web3 toolkit for building wallet UIs, controllers, and provider wrappers — designed for modern frameworks like **Next.js** and **Vite**.  
Built with **Wagmi**, **Viem**, **Ethers**, and **TypeScript**.

**📦 [NPM Package](https://www.npmjs.com/package/@cordystackx/cordy_minikit)** | **📂 [GitHub Repository](https://github.com/cordyStackX/cordy_minikit_official)**

---

## 🚀 Features

- 🔗 **Wallet Connect/Disconnect** — Simple hooks and buttons for EVM-based wallets
- 🧰 **Prebuilt UI Components** — Ready-to-use `ConnectWalletBT`, `UI_Comp`, and more
- ⚙️ **Smart Controllers** — Manage wallet actions, balances, and transactions effortlessly
- 💸 **Transaction Helpers** — Built-in ERC20 and native token transfer functions
- 🎨 **Themeable CSS** — CSS Modules with variables for easy dark/light mode support
- 📦 **Tree-shakable & Typed** — Optimized bundle size with full TypeScript definitions
- 🧩 **Framework-Agnostic** — Works seamlessly with Next.js, Vite, and more
- 🌐 **Multi-Chain Support** — Custom chain configuration support

---

## 📦 Installation

```bash
npm install @cordystackx/cordy_minikit@latest
# or
pnpm add @cordystackx/cordy_minikit@latest
# or
yarn add @cordystackx/cordy_minikit@latest
```

---

## 🛠️ Quick Start

### 1. Environment Setup

Create a `.env.local` file in your project root:

```bash
NEXT_PUBLIC_RPC_ENDPOINT=https://your-rpc-endpoint.com
NEXT_PUBLIC_TOKENADDRESS=0x...
NEXT_PUBLIC_PLATFORM_ADDRESS=0x...
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

### 2. Provider Setup

Create a providers file at `/app/providers.tsx` or `/services/minikit/providers.tsx`:

```tsx
"use client";
import { ReactNode } from "react";
import { ProvidersClientWrapper } from "@cordystackx/cordy_minikit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ProvidersClientWrapper>
        {children}
      </ProvidersClientWrapper>
    </QueryClientProvider>
  );
}
```

> **Note:** Install `@tanstack/react-query` as a peer dependency:
> ```bash
> npm install @tanstack/react-query
> ```

### 3. Layout Integration

Import the providers and CSS in your `/app/layout.tsx`:

```tsx
import Providers from "@/app/providers";
import "@cordystackx/cordy_minikit/dist/css/UI_Comp/styles.module.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

---

## 📚 Usage Examples

### 1. Connect Wallet Button

The `ConnectWalletBT` component provides a plug-and-play wallet connection button.

```tsx
import { ConnectWalletBT } from "@cordystackx/cordy_minikit";

export default function Header() {
  return (
    <nav>
      <ConnectWalletBT className="your-custom-class" />
    </nav>
  );
}
```

**Features:**
- Automatically shows "Connect Wallet" when disconnected
- Displays wallet address when connected
- Fully customizable with `className` prop

---

### 2. Wallet Modal Hook

Use the `useWalletModal` hook to trigger the wallet modal programmatically:

```tsx
import { useWalletModal } from "@cordystackx/cordy_minikit";

function CustomButton() {
  const { openModal, closeModal } = useWalletModal();

  return (
    <button onClick={openModal}>
      Open Wallet
    </button>
  );
}
```

---

### 3. Transaction Handler

The `CordyStackTrans` function handles ERC20 and native token transfers:

```tsx
import { CordyStackTrans } from "@cordystackx/cordy_minikit";

async function handlePayment() {
  const recipientAddress = "0x...";
  const amount = 10; // Token amount

  const success = await CordyStackTrans(recipientAddress, amount);

  if (success) {
    console.log("Transaction successful!");
  } else {
    console.log("Transaction failed or rejected");
  }
}
```

---

### 4. Custom UI Component

The `UI_Comp` component displays wallet connection UI with balance information:

```tsx
import { UI_Comp } from "@cordystackx/cordy_minikit";

export default function WalletUI() {
  return <UI_Comp title="My Custom Wallet" />;
}
```

**Props:**
- `title` (optional): Custom title for the wallet modal (defaults to "Cordy Minikit")

---

### 5. Custom Chain Support

Configure custom chains for your dApp:

```tsx
import { getConfig, ProvidersClientWrapper } from "@cordystackx/cordy_minikit";
import { defineChain } from "viem";

// Define your custom chain
const myCustomChain = defineChain({
  id: 1114,
  name: "Core Blockchain Testnet",
  network: "core-testnet",
  nativeCurrency: { name: "tCORE", symbol: "tCORE", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.test.btcs.network"] },
    public: { http: ["https://rpc.test.btcs.network"] },
  },
  blockExplorers: {
    default: { name: "Core Scan", url: "https://scan.test.btcs.network" },
  },
});

// Get config with custom chain
const customConfig = getConfig({ myCustomChain });

// Use in provider
export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ProvidersClientWrapper config={customConfig}>
      {children}
    </ProvidersClientWrapper>
  );
}
```

---

## 🏗️ Architecture Overview

### Project Structure

```
cordy_minikit/
├── chains/          # Chain definitions (Sepolia, Base, etc.)
├── components/      # UI components (ConnectWalletBT, UI_Comp)
├── controllers/     # Transaction logic and wallet operations
├── config/          # ABIs and static configurations
├── css/             # CSS Modules and theming
├── dist/            # Compiled output (published to npm)
├── index.ts         # Main export entry point
└── package.json
```

### Key Files

| File/Folder | Description |
|-------------|-------------|
| `chains/` | Chain configuration and utilities (Sepolia, Base, Core, etc.) |
| `client__provider.tsx` | React provider wrapper for Wagmi/Viem |
| `components/` | Reusable UI components for wallet interactions |
| `controllers/` | Business logic for Web3 operations |
| `config/` | ERC20 ABI and configuration files |
| `css/` | Scoped CSS Modules with theming support |
| `dist/` | Compiled JavaScript + TypeScript declarations |

---

## 🔧 API Reference

### Components

#### `ConnectWalletBT`
```tsx
<ConnectWalletBT className?: string />
```
- Props: `className` (optional) - Custom CSS class

#### `UI_Comp`
```tsx
<UI_Comp title?: string />
```
- Props: `title` (optional) - Custom modal title (default: "Cordy Minikit")

### Hooks

#### `useWalletModal()`
```tsx
const { openModal, closeModal } = useWalletModal();
```
- Returns: `{ openModal: () => void, closeModal: () => void }`

### Functions

#### `CordyStackTrans(address, amount)`
```tsx
const success = await CordyStackTrans(recipientAddress: string, amount: number);
```
- Returns: `Promise<boolean>` - Transaction success status

#### `getConfig(customChains?)`
```tsx
const config = getConfig({ myChain: customChainDefinition });
```
- Returns: Wagmi configuration with custom chains

---

## 🎨 Customization

### CSS Variables

Override default styles using CSS variables:

```css
:root {
  --foreground_wagmi: #ffffff;
  --background_wagmi: #000000;
  /* Add more custom variables */
}
```

### Custom Styling

```tsx
<ConnectWalletBT className="my-custom-button" />
```

```css
.my-custom-button {
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: 600;
}
```

---

## 📋 Requirements

- **React**: ^18.3.1
- **Next.js**: ^14.2.33 (for Next.js projects)
- **@tanstack/react-query**: ^5.90.3
- **wagmi**: ^2.18.1
- **viem**: Latest version
- **ethers**: ^6.15.0

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🔗 Links

- **NPM Package**: https://www.npmjs.com/package/@cordystackx/cordy_minikit
- **GitHub Repository**: https://github.com/cordyStackX/cordy_minikit_official
- **Official Website**: https://cordy-stack-x.vercel.app/

---

## 💬 Support

For issues, questions, or feature requests:
- Open an issue on [GitHub](https://github.com/cordyStackX/cordy_minikit_official/issues)
- Visit our [website](https://cordy-stack-x.vercel.app/)

---

**Built with ❤️ by [CordyStackX](https://cordy-stack-x.vercel.app/)**

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

<ConnectWalletBT className="your-style"/>
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

3. WalletModal - useWalletModal
```ts
import { useWalletModal } from '@cordystackx/cordy_minikit';

function MyComponent() {
  const { openModal } = useWalletModal();

  return (
    <div onClick={openModal}>
      Click anywhere to connect
    </div>
  );
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