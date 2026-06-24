---
© 2025 Cordy StackX (@cordystackx)  
Licensed under the MIT License.  
Unauthorized removal of this notice violates the license terms.
---

# 🧩 Cordy MiniKit — Web3 Toolkit by CordyStackX

[![npm version](https://img.shields.io/npm/v/@cordystackx/cordy_minikit.svg)](https://www.npmjs.com/package/@cordystackx/cordy_minikit)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Socket Badge](https://badge.socket.dev/npm/package/@cordystackx/cordy_minikit/1.4.8)](https://badge.socket.dev/npm/package/@cordystackx/cordy_minikit/1.4.8)

A lightweight, production-ready Web3 toolkit for building wallet UIs, controllers, and provider wrappers — designed for modern frameworks like **Next.js** and **Vite**.  
Built with **Wagmi**, **Viem**, **Ethers**, and **TypeScript**.

**📦 [NPM Package](https://www.npmjs.com/package/@cordystackx/cordy_minikit)** | **📂 [GitHub Repository](https://github.com/cordyStackX/cordy_minikit_official)**

---

## 🖼️ Demo

| Demo 1 | Demo 2 | Demo 3 |
|---|---|---|
| ![Demo 1](https://raw.githubusercontent.com/cordyStackX/cordy_minikit_official/refs/heads/main/assets/demo1.png) | ![Demo 2](https://raw.githubusercontent.com/cordyStackX/cordy_minikit_official/refs/heads/main/assets/demo2.png) | ![Demo 3](https://raw.githubusercontent.com/cordyStackX/cordy_minikit_official/refs/heads/main/assets/demo3.png) |

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

## 📢 New: Non-EVM Wallet Support                                                                                  
                                                                                                                     
  Cordy MiniKit now supports **Non-EVM wallets**, starting with **Stellar / Soroban** integration.                   
                                                                                                                     
  You can now connect Stellar wallets through **Freighter**, read Stellar account balances, detect wallet context,   
and send native Stellar payments using the built-in `CordyStackTransStellar` helper.                                 
                                                                                                                     
  Supported wallet contexts now include:                                                                             
                                                                                                                     
  - `EVM` — Wagmi / EVM wallet connected                                                                             
  - `Non-EVM` — Stellar / Non-EVM wallet connected                                                                   
  - `MULTI` — Both EVM and Non-EVM wallets connected                                                                 
  - `NONE` — No wallet connected                                                                                     
                                                                                                                     
  This makes Cordy MiniKit ready for multi-chain apps that need both EVM and Stellar support.                        
                                                                                                              
                                                                                                                     
Also update your Features section with these bullets:                                                                
                                                                                                                                                                                                                                  
  - 🌌 **Non-EVM Wallet Support** — Stellar / Soroban wallet support through Freighter                               
  - ⭐ **Stellar Balance & Transfers** — Read XLM balances and send native Stellar payments                          
  - 🧠 **Wallet Context Detection** — Detect `EVM`, `Non_EVM`, `MULTI`, or `NONE`                                                                                                                                                    
                                                                                                                     
And add this to API Reference → Hooks:                                                                               
                                                                                                                                                                                                                                  
  #### `useWalletStatus()`                                                                                           
                                                                                                                     
  ```tsx                                                                                                             
  const {                                                                                                            
    context,                                                                                                         
    evm,                                                                                                             
    stellar,                                                                                                         
    refreshBalances,                                                                                                 
    disconnectEVM,                                                                                                   
    disconnectStellar,                                                                                               
    disconnectAll,                                                                                                   
  } = useWalletStatus();                                                                                             
  ```                                                                                                         
                                                                                                                     
Returns wallet status for both EVM and Non-EVM wallets.                                                              
                                                                                                                     
```ts                                                                                                                
  context: "EVM" | "Non-EVM" | "MULTI" | "NONE"                                                                      
```                                                                                                                  
                                                                                                                     
Useful for detecting whether the connected wallet is Wagmi/EVM, Stellar/Non-EVM, both, or none.                                                                                                           

## 🛠️ Quick Start

### 1. Environment Setup

Create a `.env.local` file in your project root:

```bash
# Wagmi EVM
NEXT_PUBLIC_RPC_ENDPOINT=https://your-rpc-endpoint.com
NEXT_PUBLIC_TOKENADDRESS=0x...
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# Stellar / Soroban Non-EVM
NEXT_PUBLIC_STELLAR_HORIZON=https://horizon-testnet.stellar.org
NEXT_PUBLIC_STELLAR_CONTRACT_ID=CCXI.....
NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015 //Optional
```

For Stellar, `NEXT_PUBLIC_STELLAR_CONTRACT_ID` is the Soroban equivalent of an EVM token address. Use `NEXT_PUBLIC_STELLAR_HORIZON` for native account balance lookups through Horizon.

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

The `CordyStackTrans` function handles ERC20 transfers:

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
Conditions enforced by the helper:                                                                                 
                                                                                                                     
  - Runs only in the browser                                                                                         
  - Requires an active EVM wallet connection                                                                         
  - Requires a valid recipient EVM address                                                                           
  - Requires `amount > 0`                                                                                            
  - Requires the configured token contract address from `NEXT_PUBLIC_TOKENADDRESS`                                   
  - Requires the active wallet/network to support the configured token contract                                      
  - Requires the user to approve/sign the transaction in their wallet                                                
  - Returns `true` when the transaction is submitted successfully                                                    
  - Returns `false` when the transaction is rejected, invalid, or fails                                              
                                                                                                             
                                                                                                                     
Optional extra note if your helper supports native transfers too:                                                    
                                                                                                                     
```md                                                                                                                
  > Note: `CordyStackTrans` is intended for ERC20 token transfers. For native Stellar/XLM payments, use              
`CordyStackTransStellar`.
```

### 3.1 Stellar Transfer Helper

Use `CordyStackTransStellar` for native Stellar payments through Freighter.

```tsx
import { CordyStackTransStellar } from "@cordystackx/cordy_minikit";

async function sendXLM() {
  const success = await CordyStackTransStellar("G...", 10, {
    memo: "Sample payment",
  });

  if (success) {
    console.log("Stellar transfer successful!");
  }
}
```

Conditions enforced by the helper:
- Runs only in the browser
- Requires Freighter access
- Requires a valid destination address
- Requires `amount > 0`
- Requires the active Freighter network to match `NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE` when that env var is set

---

### 4. Custom Chain Support

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
                                                                                                           
### 5. Disconnect Wallets                                                                                      
                                                                                                                    
Custom hook for disconnecting EVM, Stellar, or all connected wallets.                                              
                                                                                                                    
```tsx                                                                                                             
import { useDisconnectWallets } from "@cordystackx/cordy_minikit";                                                 
                                                                                                                    
export default function WalletControls() {                                                                         
  const {                                                                                                          
    disconnectEVM,                                                                                                 
    disconnectStellar,                                                                                             
    disconnectAll,                                                                                                 
  } = useDisconnectWallets();                                                                                      
                                                                                                                    
  return (                                                                                                         
    <div>                                                                                                          
      <button onClick={disconnectEVM}>                                                                             
        Disconnect EVM                                                                                             
      </button>                                                                                                    
                                                                                                                    
      <button onClick={disconnectStellar}>                                                                         
        Disconnect Stellar                                                                                         
      </button>                                                                                                    
                                                                                                                    
      <button onClick={disconnectAll}>                                                                             
        Disconnect All                                                                                             
      </button>                                                                                                    
    </div>                                                                                                         
  );                                                                                                               
}                                                                                                                  
```                                                                                                                  
                                                                                                                    
Returns:                                                                                                             
                                                                                                                    
```ts                                                                                                                
{                                                                                                                  
  disconnectEVM: () => Promise<boolean>;                                                                           
  disconnectStellar: () => Promise<boolean>;                                                                       
  disconnectAll: () => Promise<boolean>;                                                                           
}                                                                                                                  
```                                                                                                                  
                                                                                                                    
┌─────────────────────┬────────────────────────────────────────────────────┐                                         
│ Function            │ Description                                        │                                         
├─────────────────────┼────────────────────────────────────────────────────┤                                         
│ disconnectEVM()     │ Disconnects the active Wagmi/EVM wallet            │                                         
├─────────────────────┼────────────────────────────────────────────────────┤                                         
│ disconnectStellar() │ Clears the active Stellar/Freighter wallet session │                                         
├─────────────────────┼────────────────────────────────────────────────────┤                                         
│ disconnectAll()     │ Disconnects both EVM and Stellar wallet sessions   │                                         
└─────────────────────┴────────────────────────────────────────────────────┘                                         
                                                                                                                    
Each function returns:                                                                                               
                                                                                                                    
```ts                                                                                                                
Promise<boolean>                                                                                                   
```                                                                                                                  
                                                                                                                    
- true — disconnect succeeded                                                                                        
- false — disconnect failed                                                                                          
                                                                                                                    
Example with success handling:                                                                                       
                                                                                                                    
```tsx                                                                                                               
const { disconnectAll } = useDisconnectWallets();                                                                  
                                                                                                                    
async function handleDisconnect() {                                                                                
  const success = await disconnectAll();                                                                           
                                                                                                                    
  if (success) {                                                                                                   
    console.log("Wallets disconnected");                                                                           
  } else {                                                                                                         
    console.log("Failed to disconnect wallets");                                                                   
  }                                                                                                                
}                                                                                                                  
```                                                                                                                  
                                                                                                                    
│ Note: useDisconnectWallets() is a React hook. Call it only at the top level of a client component or another hook. 
│ Do not call it inside onClick, loops, conditions, or normal functions.  

### 6. WalletStatus                                                                                           
                                                                                                                     
  Custom hook for reading wallet status, balances, wallet context, refresh helpers, and disconnect functions for both
EVM and Non-EVM wallets.                                                                                             
                                                                                                                     
  ```tsx                                                                                                             
  import { useWalletStatus } from "@cordystackx/cordy_minikit";                                                      
                                                                                                                     
  export default function WalletInfo() {                                                                             
    const {                                                                                                          
      context,                                                                                                       
      evm,                                                                                                           
      stellar,                                                                                                       
      refreshBalances,                                                                                               
      refreshEvmBalance,                                                                                             
      refreshStellarBalance,                                                                                         
      disconnectEVM,                                                                                                 
      disconnectStellar,                                                                                             
      disconnectAll,                                                                                                 
    } = useWalletStatus();                                                                                           
                                                                                                                     
    return (                                                                                                         
      <div>                                                                                                          
        <p>Wallet Context: {context}</p>                                                                             
                                                                                                                     
        {context === "EVM" && (                                                                                      
          <p>EVM Address: {evm.address}</p>                                                                          
        )}                                                                                                           
                                                                                                                     
        {context === "Non_EVM" && (                                                                                  
          <p>Stellar Address: {stellar.address}</p>                                                                  
        )}                                                                                                           
                                                                                                                     
        {context === "MULTI" && (                                                                                    
          <>                                                                                                         
            <p>EVM Address: {evm.address}</p>                                                                        
            <p>Stellar Address: {stellar.address}</p>                                                                
          </>                                                                                                        
        )}                                                                                                           
                                                                                                                     
        <button onClick={refreshBalances}>                                                                           
          Refresh Balances                                                                                           
        </button>                                                                                                    
                                                                                                                     
        <button onClick={disconnectAll}>                                                                             
          Disconnect All                                                                                             
        </button>                                                                                                    
      </div>                                                                                                         
    );                                                                                                               
  }                                                                                                                  
```                                                                                                                  
                                                                                                                     
Returns:                                                                                                             
                                                                                                                     
```ts                                                                                                                
  {                                                                                                                  
    context: "EVM" | "Non_EVM" | "MULTI" | "NONE";                                                                   
                                                                                                                     
    evm: {                                                                                                           
      isConnected: boolean;                                                                                          
      address?: string;                                                                                              
      chain?: unknown;                                                                                               
      balance: string;                                                                                               
      symbol: string;                                                                                                
      error?: string;                                                                                                
    };                                                                                                               
                                                                                                                     
    stellar: {                                                                                                       
      isConnected: boolean;                                                                                          
      address?: string;                                                                                              
      network?: string;                                                                                              
      balance?: string;                                                                                              
      error?: string;                                                                                                
    };                                                                                                               
                                                                                                                     
    refreshEvmBalance: () => Promise<boolean>;                                                                       
    refreshStellarBalance: (accountId?: string) => Promise<boolean>;                                                 
    refreshBalances: () => Promise<boolean>;                                                                         
                                                                                                                     
    disconnectEVM: () => Promise<boolean>;                                                                           
    disconnectStellar: () => Promise<boolean>;                                                                       
    disconnectAll: () => Promise<boolean>;                                                                           
  }                                                                                                                  
```                                                                                                                  
                                                                                                                     
Wallet context values:                                                                                               
                                                                                                                     
┌─────────┬────────────────────────────────────────┐                                                                 
│ Context │ Description                            │                                                                 
├─────────┼────────────────────────────────────────┤                                                                 
│ EVM     │ Wagmi / EVM wallet connected           │                                                                 
├─────────┼────────────────────────────────────────┤                                                                 
│ Non-EVM │ Stellar / Freighter wallet connected   │                                                                 
├─────────┼────────────────────────────────────────┤                                                                 
│ MULTI   │ Both EVM and Stellar wallets connected │                                                                 
├─────────┼────────────────────────────────────────┤                                                                 
│ NONE    │ No wallet connected                    │                                                                 
└─────────┴────────────────────────────────────────┘                                                                 
                                                                                                                     
Example: close wallet modal after successful connection:                                                             
                                                                                                                     
```tsx                                                                                                               
  "use client";                                                                                                      
                                                                                                                     
  import { useEffect } from "react";                                                                                 
  import {                                                                                                           
    useWalletStatus,                                                                                                 
    useWalletModal,                                                                                                  
  } from "@cordystackx/cordy_minikit";                                                                               
                                                                                                                     
  export default function AutoCloseWalletModal() {                                                                   
    const { context } = useWalletStatus();                                                                           
    const { closeModal } = useWalletModal();                                                                         
                                                                                                                     
    useEffect(() => {                                                                                                
      if (context !== "NONE") {                                                                                      
        closeModal();                                                                                                
      }                                                                                                              
    }, [context, closeModal]);                                                                                       
                                                                                                                     
    return null;                                                                                                     
  }                                                                                                                  
```                                                                                                                  
                                                                                                                     
│ Note: useWalletStatus() is a React hook. Call it only at the top level of a client component or another hook.      

### 7. Wallet Connection Components                                                                                   
                                                                                                                     
#### `WalletButton`                                                                                                
                                                                                                                    
Low-level EVM wallet connector button list powered by Wagmi.                                                       
                                                                                                                    
`WalletButton` renders all configured Wagmi connectors and handles EVM wallet connection state internally.         
                                                                                                                    
```tsx                                                                                                             
import { WalletButton } from "@cordystackx/cordy_minikit";                                                         
                                                                                                                    
export default function EVMConnect() {                                                                             
  return (                                                                                                         
    <WalletButton                                                                                                  
      onStatusChange={({ isPending, error }) => {                                                                  
        console.log("Connecting:", isPending);                                                                     
        console.log("Error:", error);                                                                              
      }}                                                                                                           
    />                                                                                                             
  );                                                                                                               
}                                                                                                                  
```                                                                                                                  
                                                                                                                    
Props:                                                                                                               
                                                                                                                    
```ts                                                                                                                
{                                                                                                                  
  onStatusChange?: (status: {                                                                                      
    isPending: boolean;                                                                                            
    error?: string;                                                                                                
  }) => void;                                                                                                      
}                                                                                                                  
```                                                                                                                  
                                                                                                                    
Behavior:                                                                                                            
                                                                                                                    
- Lists available Wagmi connectors                                                                                   
- Detects whether injected wallets are installed                                                                     
- Supports WalletConnect and Trust Wallet display handling                                                           
- Shows Connecting... while connection is pending                                                                    
- Stores the active wallet session as evm                                                                            
- Reports pending/error state through onStatusChange                                                                 
                                                                                                                    
│ Note: WalletButton is usually used internally by UI_Comp, but it can also be imported directly for custom wallet   
│ UIs.                                                                                                               
                                                                                                                    
────────────────────────────────────────────────────────────────────────────────                                     
                                                                                                                    
#### StellarWalletButton                                                                                             
                                                                                                                    
Low-level Stellar / Freighter wallet connector button.                                                               
                                                                                                                    
StellarWalletButton connects to Freighter, returns the Stellar public key, and reports the active Stellar network.   
                                                                                                                    
```tsx                                                                                                               
import { StellarWalletButton } from "@cordystackx/cordy_minikit";                                                  
                                                                                                                    
export default function StellarConnect() {                                                                         
  return (                                                                                                         
    <StellarWalletButton                                                                                           
      onConnect={(address) => {                                                                                    
        console.log("Connected Stellar address:", address);                                                        
      }}                                                                                                           
      onStatusChange={({ isPending, error, address, network }) => {                                                
        console.log("Connecting:", isPending);                                                                     
        console.log("Error:", error);                                                                              
        console.log("Address:", address);                                                                          
        console.log("Network:", network);                                                                          
      }}                                                                                                           
    />                                                                                                             
  );                                                                                                               
}                                                                                                                  
```                                                                                                             
                                                                                                                    
Props:                                                                                                               
                                                                                                                    
```ts                                                                                                                
{                                                                                                                  
  onConnect?: (address: string) => void;                                                                           
                                                                                                                    
  onStatusChange?: (status: {                                                                                      
    isPending: boolean;                                                                                            
    error?: string;                                                                                                
    address?: string;                                                                                              
    network?: string;                                                                                              
  }) => void;                                                                                                      
}                                                                                                                  
```                                                                                                                  
                                                                                                                    
Behavior:                                                                                                            
                                                                                                                    
- Requests Freighter wallet access                                                                                   
- Returns the connected Stellar public key                                                                           
- Reads active Freighter network details                                                                             
- Shows connected address preview                                                                                    
- Reports pending/error/address/network through onStatusChange                                                       
                                                                                                                    
Conditions:                                                                                                          
                                                                                                                    
- Runs only in the browser                                                                                           
- Requires Freighter wallet extension/app access                                                                     
- Requires user approval in Freighter                                                                                
- For testnet apps, Freighter should be set to the matching testnet network                                                                                                                                                           
                                                                                                                    
Small improvement for `WalletButton`: after successful connect, you may want to notify parent explicitly:          
                                                                                                                    
```ts                                                                                                              
  onStatusChange?.({ isPending: false });                                                                            
```                                                                                                                  
                                                                                                                    
right after:                                                                                                         
                                                                                                                    
```ts                                                                                                                
  await connectAsync({ connector });                                                                                 
```                                                                                                                  
                                                                                                          
`Not required, but cleaner.`

---

## 🏗️ Architecture Overview

### Project Structure

```
cordy_minikit/
├── assets/          # Image Sources for logo
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
| `assets/` | Image Sources for logo |
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

#### `CordyStackTransStellar(address, amount, options?)`
```tsx
const success = await CordyStackTransStellar(recipientAddress: string, amount: number, options?: { memo?: string; source?: string });
```
- Returns: `Promise<boolean>` - Stellar transaction success status

#### `getConfig(customChains?)`
```tsx
const config = getConfig({ myChain: customChainDefinition });
```
- Returns: Wagmi configuration with custom chains

---

## 🎨 Customization

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
