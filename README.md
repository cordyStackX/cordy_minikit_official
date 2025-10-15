# MiniKit CordyStack NPM Packages 😎

MiniKit CordyStack is my tiny, power-packed dev setup. Perfect for coding, hacking, and stacking cool stuff.

## Features
- Lightweight & minimal
- Optimized for Arch Linux 🐧
- Web3 & Next.js ready 🚀
- Easy to customize

## Usage
1. Import the Providers inside the layout.ts
```bash
    import { ProvidersClientWrapper } from "@cordystackx/cordy_minikit";
        
        <ProvidersClientWrapper>
            {children}
        </ProvidersClientWrapper>

```
2. Use of Connect Buttons
```bash
    import { ConnectWalletBT } from "@cordystackx/cordy_minikit";
        
        <ConnectWalletBT/>

```
2. Use of Transactions
```bash
    import { CordyStackTrans } from "@cordystackx/cordy_minikit";
        
        CordyStackTrans(address: string, cost: number | string);

```