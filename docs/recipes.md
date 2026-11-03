# Use Cordy in your app

This guide shows where to call each Cordy function in a real app. It assumes the provider and asset JSON are already set up as described in [Provider and wallet UI setup](./setup.md). Put wallet UI and SDK calls in client components under `ProvidersClientWrapper`.

For example, create `app/components/WalletActions.tsx` with `"use client"`, import `cordy` from the SDK, then render `<WalletActions />` from your page. The sections below show the user action and the matching SDK call. Each operation uses the wallet and chain the user has connected.

## 1. Connect and sign in

Use a plain button if you only need wallet access. Set `cons_session` and `navigate` when your app needs the wallet owner to authenticate before entering a page:

```tsx
"use client";
import { ConnectWalletBT } from "@cordystackx/cordy_minikit";

export function SignInButton() {
  return <ConnectWalletBT cons_session={true} navigate="/account" />;
}
```

This sign-in mode needs the server-only `createCordyServer()` setup and dynamic route in the [authentication guide](./api.md#server-authentication). EVM wallets sign a SIWE message; Stellar wallets sign a SEP-10 challenge. The SDK verifies the signature and creates a session before navigating. Connecting or signing does not submit a blockchain transaction.

## 2. Show the signed-in wallet

Use `useConsSession()` in a client component to show session state:

```tsx
"use client";
import { useConsSession } from "@cordystackx/cordy_minikit";

export function AccountIdentity() {
  const { loading, authenticated, address, chain } = useConsSession();

  if (loading) return <p>Checking session…</p>;
  if (!authenticated) return <p>Sign in to continue.</p>;
  return <p>Signed in with {chain}: {address}</p>;
}
```

This hook is for UI. Check `cordyServer.session(request)` in server handlers before returning private data.

## 3. Read a balance after a user action

The active wallet and current network select the registry. Call `cordy.balance()` when a user opens a balance view or presses refresh:

```tsx
"use client";
import { useState } from "react";
import { cordy } from "@cordystackx/cordy_minikit";

export function TokenBalance() {
  const [message, setMessage] = useState("Press refresh to read USDT.");

  async function refresh() {
    const result = await cordy.balance({ asset: "USDT" });
    setMessage(result.success
      ? `${result.balance} ${result.asset} on ${result.network}`
      : result.error ?? "Could not read balance.");
  }

  return <section><button onClick={refresh}>Refresh USDT</button><p>{message}</p></section>;
}
```

Omit `{ asset: "USDT" }` to read the default configured asset. Add every ERC-20 to the `evm` list for the correct chain; native currencies come from `networks[].nativeCurrency`.

## 4. Send a transfer

Collect the amount, recipient, and optional asset from your UI. Call `cordy.transfer()` from the submit handler and show the returned transaction hash or error:

```tsx
async function submitTransfer() {
  const result = await cordy.transfer(amount, recipient, { asset: "USDT" });

  if (!result.success) {
    setMessage(result.error ?? "Transfer failed.");
    return;
  }

  setMessage(`Submitted ${result.asset}: ${result.transactionHash}`);
}
```

For Stellar, pass a Stellar `G...` address and a configured Stellar asset. EVM wallets need an EVM address and a configured token on the connected chain. Wallet approval is required; the SDK does not send a transfer until the user approves it.

## 5. Swap two configured assets

Connect to a network with compatible router deployments and liquidity. Submit the user's selected symbols, slippage percentage, and routing preferences:

```tsx
async function submitSwap() {
  const result = await cordy.swap(amount, fromAsset, toAsset, 0.5, {
    version: "auto",
    feeTiers: [500, 3000, 10000],
  });

  if (!result.success) {
    setMessage(result.error ?? "Swap failed.");
    return;
  }

  setMessage(`Swap submitted: ${result.transactionHash}`);
}
```

The fourth argument is slippage tolerance: `0.5` means 0.5%. `feeTiers` selects which V3 pools to quote: 500 = 0.05% pool fee, 3000 = 0.30%, and 10000 = 1.00%. They are different controls. Use `{ version: "v2" }` or `{ version: "v3" }` to select one router family. `auto` compares configured V2/V3 quotes; it does not create pools or guarantee liquidity.

## 6. Bridge between configured networks

Select a route from `assets.bridge.routes` and pass the route ID, source side, destination side, and recipient. Use an amount above any configured source minimum:

```tsx
async function submitBridge() {
  try {
    const result = await cordy.bridge(
      amount,
      "internal",
      "external",
      recipient,
      { routeId: "bot-testnet-sepolia-usdt" },
    );
    setMessage(JSON.stringify(result));
  } catch (error) {
    setMessage(error instanceof Error ? error.message : "Bridge failed.");
  }
}
```

`internal` and `external` refer to the selected route's sides, not fixed chain names. Mount `<BridgeEvmWalletModal />` once under the provider if your app should let the SDK connect an EVM wallet and prepare the source network automatically. EVM `success` means the source deposit confirmed; validator delivery happens asynchronously. Stellar CCTP burns the source USDC, waits for attestation, and mints on the destination. Check the destination chain to confirm receipt.

## 7. Log out

Call `cordy.cons_disconnect()` from your logout action. It clears the server session and disconnects connected wallets:

```tsx
async function logOut() {
  const result = await cordy.cons_disconnect();
  if (!result.success) {
    setMessage(result.error ?? "Could not log out.");
    return;
  }
  router.replace("/");
}
```

The demo uses these same calls in its [dashboard](../demo/src/app/dashboard/page.tsx). Its exact networks, assets, bridge route IDs, defaults, and test setup are documented in the [demo configuration guide](./environment.md) and represented in `demo/src/config/assets.json`.

## Put the actions together

This compact client component demonstrates the same flow as a small app page. It expects the wallet provider to be mounted and the user to have connected a wallet. Adapt the fields, supported symbols, and route ID to your `assets.json`:

```tsx
"use client";

import { useState } from "react";
import { BridgeEvmWalletModal, cordy } from "@cordystackx/cordy_minikit";

export function WalletActions() {
  const [amount, setAmount] = useState("1");
  const [recipient, setRecipient] = useState("");
  const [asset, setAsset] = useState("USDT");
  const [fromAsset, setFromAsset] = useState("USDT");
  const [toAsset, setToAsset] = useState("BOT");
  const [bridgeAmount, setBridgeAmount] = useState("10.5");
  const [bridgeRecipient, setBridgeRecipient] = useState("");
  const [result, setResult] = useState<unknown>(null);

  async function run(action: () => Promise<unknown>) {
    try {
      setResult(await action());
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Operation failed.",
      });
    }
  }

  return (
    <main>
      <label>
        Amount
        <input value={amount} onChange={(event) => setAmount(event.target.value)} />
      </label>
      <label>
        Recipient
        <input value={recipient} onChange={(event) => setRecipient(event.target.value)} />
      </label>
      <label>
        Asset
        <input value={asset} onChange={(event) => setAsset(event.target.value)} />
      </label>
      <label>
        Swap from
        <input value={fromAsset} onChange={(event) => setFromAsset(event.target.value)} />
      </label>
      <label>
        Swap to
        <input value={toAsset} onChange={(event) => setToAsset(event.target.value)} />
      </label>
      <label>
        Bridge amount
        <input value={bridgeAmount} onChange={(event) => setBridgeAmount(event.target.value)} />
      </label>
      <label>
        Bridge recipient
        <input value={bridgeRecipient} onChange={(event) => setBridgeRecipient(event.target.value)} />
      </label>

      <button onClick={() => void run(() => cordy.balance({ asset }))}>
        Read balance
      </button>
      <button onClick={() => void run(() => cordy.transfer(amount, recipient, { asset }))}>
        Send transfer
      </button>
      <button onClick={() => void run(() => cordy.swap(amount, fromAsset, toAsset, 0.5, {
        version: "auto",
        feeTiers: [500, 3000, 10000],
      }))}>
        Swap {fromAsset} to {toAsset}
      </button>
      <button onClick={() => void run(() => cordy.bridge(
        bridgeAmount,
        "internal",
        "external",
        bridgeRecipient,
        { routeId: "bot-testnet-sepolia-usdt" },
      ))}>
        Bridge to Sepolia
      </button>

      <pre>{JSON.stringify(result, null, 2)}</pre>
      <BridgeEvmWalletModal />
    </main>
  );
}
```

The example keeps the result visible so you can inspect the returned `success`, `error`, network, asset, and transaction fields. In a production interface, validate inputs, disable buttons while a request is pending, and show a transaction link using the explorer URL configured for the operation's network.
