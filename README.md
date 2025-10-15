---
© 2025 Cordy StackX (@cordystackx)
Licensed under the MIT License.  
Unauthorized removal of this notice violates the license terms.
---


# 🧩 cordy_minikit — Web3 Mini Kit by cordyStackX

A lightweight Web3 toolkit for building wallet UIs, controllers, and provider wrappers — designed for modern frameworks like **Next.js** and **Vite**
Built with **Wagmi**, **Viem**, **Ethers** and **TypeScript** (compiled to JS for runtime).

---

## 🚀 Features

- 🔗 **Wallet Connect / Disconnect**  
  Simple connect button and hooks for EVM-based wallets.
- 🧰 **Prebuilt UI Components**  
  Reusable components like `ConnectWalletBT`, `UI_Comp`.
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



## Usage
1. Create env file
```bash
NEXT_PUBLIC_MAINNET_RPC=
NEXT_PUBLIC_BASE_RPC=
NEXT_PUBLIC_BASE_SEPOLIA_RPC=
NEXT_PUBLIC_TOKENADDRESS=
NEXT_PUBLIC_SYMBOL=
NEXT_PUBLIC_PLATFORM_ADDRESS=
```

2. Import the Providers inside the layout.ts
```bash
import { ProvidersClientWrapper } from "@cordystackx/cordy_minikit";
    
    <ProvidersClientWrapper>
        {children}
    </ProvidersClientWrapper>

```
3. Use of Connect Buttons
```bash
import { ConnectWalletBT } from "@cordystackx/cordy_minikit";
    
    <ConnectWalletBT/>

```
4. Use of Transactions
```bash
import { CordyStackTrans } from "@cordystackx/cordy_minikit";
    
    CordyStackTrans(address: string, cost: number | string);

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