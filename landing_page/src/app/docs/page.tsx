import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

const sections = [
  { id: "install", label: "Install" },
  { id: "getting-started", label: "Provider setup" },
  { id: "configuration", label: "Configure assets" },
  { id: "authentication", label: "Wallet sign-in" },
  { id: "wallet-checks", label: "Check session" },
  { id: "use-functions", label: "Use the functions" },
  { id: "balance", label: "Read balances" },
  { id: "transfer", label: "Transfer assets" },
  { id: "swap", label: "Swap assets" },
  { id: "disconnect", label: "Disconnect wallet" },
  { id: "bridge-api", label: "Bridge" },
  { id: "links", label: "Links" },
];

function ExternalIcon() {
  return <svg aria-hidden="true" viewBox="0 0 16 16" fill="none"><path d="M9 2h5v5M14 2 7 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 9v4a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}

function CodeBlock({ language, children }: { language: "bash" | "tsx" | "json" | "ts"; children: string }) {
  const tokenPattern = /(\/\/[^\n]*|"(?:\\.|[^"\\])*"(?=\s*:)|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:import|from|export|default|const|let|var|async|await|function|return|if|else|new|type|as)\b|\b(?:true|false|null)\b|\b\d+(?:\.\d+)?\b|[A-Za-z_$][\w$]*(?=\s*\())/g;
  const parts: ReactNode[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenPattern.exec(children)) !== null) {
    const token = match[0];
    const index = match.index ?? 0;
    if (index > cursor) parts.push(children.slice(cursor, index));

    let tokenClass = "code-function";
    if (token.startsWith("//")) tokenClass = "code-comment";
    else if (/^(?:"|')/.test(token)) {
      tokenClass = token.startsWith('"') && /^\s*:/.test(children.slice(index + token.length))
        ? "code-key"
        : "code-string";
    } else if (/^(?:import|from|export|default|const|let|var|async|await|function|return|if|else|new|type|as)$/.test(token)) {
      tokenClass = "code-keyword";
    } else if (/^(?:true|false|null)$/.test(token)) tokenClass = "code-literal";
    else if (/^\d/.test(token)) tokenClass = "code-number";

    parts.push(<span className={tokenClass} key={`${index}-${token}`}>{token}</span>);
    cursor = index + token.length;
  }

  if (cursor < children.length) parts.push(children.slice(cursor));

  return <pre className={`docs-code language-${language}`}><code>{parts}</code></pre>;
}

export default function DocsHome() {
  return (
    <div className="documentation-layout">
      <header className="documentation-header">
        <Link className="documentation-brand" href="/" aria-label="Cordy Minikit home">
          <Image src="/cordy-logo.svg" alt="" width={33} height={33} priority />
          <span>Documentation</span>
        </Link>
        <div className="documentation-header-actions">
          <a href="https://github.com/cordyStackX/cordy_minikit_official" target="_blank" rel="noreferrer" aria-label="Open GitHub repository"><ExternalIcon /></a>
          <span className="docs-theme-mark" aria-label="Dark theme">◐</span>
        </div>
      </header>

      <div className="documentation-body">
        <aside className="documentation-sidebar" aria-label="Documentation navigation">
          <div className="sidebar-project">CORDY MINIKIT<br /><span>DEVELOPER DOCUMENTATION</span></div>
          <a className="sidebar-group" href="#getting-started">Introduction <span>⌄</span></a>
          <a className="sidebar-item active" href="#getting-started">Quick Guide</a>
          <div className="sidebar-label">DEVELOPERS</div>
          <a className="sidebar-item" href="#install">Installation</a>
          <a className="sidebar-item" href="#configuration">Configure assets</a>
          <a className="sidebar-item" href="#authentication">Wallet sign-in</a>
          <a className="sidebar-item" href="#wallet-checks">Check session</a>
          <a className="sidebar-item" href="#use-functions">Use the functions</a>
          <a className="sidebar-item" href="#balance">Read balances</a>
          <a className="sidebar-item" href="#transfer">Transfer assets</a>
          <a className="sidebar-item" href="#swap">Swap assets</a>
          <a className="sidebar-item" href="#disconnect">Disconnect wallet</a>
          <a className="sidebar-item" href="#bridge-api">Bridge</a>
          <div className="sidebar-bottom">
            <span className="version-dot" /> Cordy Minikit <span>v3.1.0</span>
          </div>
        </aside>

        <main className="documentation-article">
          <div className="article-eyebrow">CORDY MINIKIT <span>›</span> DEVELOPERS <span>›</span> QUICK GUIDE</div>
          <h1>Getting Started</h1>
          <p className="article-lead">Build wallet experiences for EVM and Stellar with one typed SDK. Connect wallets, verify sign-in on your server, and work with configured assets across balances, transfers, swaps, and bridges.</p>

          <section id="install" className="article-section">
            <h2>Install</h2>
            <h3>pnpm</h3>
            <CodeBlock language="bash">{"$ pnpm add @cordystackx/cordy_minikit @tanstack/react-query"}</CodeBlock>
            <h3>npm</h3>
            <CodeBlock language="bash">{"$ npm install @cordystackx/cordy_minikit @tanstack/react-query"}</CodeBlock>
          </section>

          <section id="getting-started" className="article-section">
            <h2>Getting started</h2>
            <p>Install the package, then add <code>ProvidersClientWrapper</code> to your client provider tree. Pass the public network and asset settings from your JSON configuration through its <code>assets</code> prop.</p>
            <h3>1. Create the client provider</h3>
            <p>In a Next.js app, create <code>app/providers.tsx</code>:</p>
            <CodeBlock language="tsx">{`"use client";

import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  ProvidersClientWrapper,
  type CordyAssetsConfig,
} from "@cordystackx/cordy_minikit";
import assetsJson from "./assets.json";

const queryClient = new QueryClient();
const assets = assetsJson as CordyAssetsConfig;

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ProvidersClientWrapper assets={assets}>
        {children}
      </ProvidersClientWrapper>
    </QueryClientProvider>
  );
}`}</CodeBlock>
            <h3>2. Wrap the application</h3>
            <p>Wrap the application with that provider from <code>app/layout.tsx</code>:</p>
            <CodeBlock language="tsx">{`import type { ReactNode } from "react";
import Providers from "./providers";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body><Providers>{children}</Providers></body>
    </html>
  );
}`}</CodeBlock>
            <h3>3. Render the wallet button</h3>
            <p>The wrapper sets up wallet and network clients for its children. Render <code>ConnectWalletBT</code> and use the <code>cordy.*</code> methods below it. Cordy supports EVM wallets and Stellar through Freighter.</p>
            <CodeBlock language="tsx">{`"use client";

import { ConnectWalletBT } from "@cordystackx/cordy_minikit";

export function WalletAccess() {
  return <ConnectWalletBT className="" cons_session={true} navigate={"/dashboard"} />;
}`}</CodeBlock>
          </section>

          <section id="configuration" className="article-section">
            <h2>Configure assets</h2>
            <p>Define supported networks and assets in your application’s JSON configuration and pass it to the provider wrapper above. The wrapper configures Cordy automatically.</p>
            <p>This filtered example follows the demo’s <code>assets.json</code> structure. Replace the sample IDs and addresses with values for your own app:</p>
            <CodeBlock language="json">{`{
  "walletConnectProjectId": "your-public-project-id",
  "networks": [
    {
      "chainId": 1,
      "name": "Ethereum Mainnet",
      "nativeCurrency": { "name": "Ether", "symbol": "ETH", "decimals": 18 },
      "rpcUrl": "https://ethereum.publicnode.com",
      "blockExplorerUrl": "https://etherscan.io",
      "swapRouterAddress": "0xRouterAddress",
      "swapV3": {
        "routerAddress": "0xV3SwapRouter",
        "quoterAddress": "0xQuoterV2",
        "feeTiers": [500, 3000, 10000],
        "routerType": "swapRouter"
      },
      "wrappedNativeTokenAddress": "0xWrappedNativeAddress"
    }
  ],
  "evm": {
    "1": [
      { "symbol": "USDC", "contractAddress": "0xTokenContract", "decimals": 6 }
    ]
  },
  "stellarNetwork": {
    "horizonUrl": "https://horizon-testnet.stellar.org",
    "contractId": "CCXI...",
    "networkPassphrase": "Test SDF Network ; September 2015"
  },
  "stellar": [
    { "symbol": "XLM", "type": "native" },
    { "symbol": "USDC", "type": "credit", "code": "USDC", "issuer": "G..." }
  ],
  "bridge": {
  "routes": [
    {
      "id": "bot-testnet-sepolia-usdt",
      "name": "BOT Chain Testnet ↔ Ethereum Sepolia · USDT",
      "resourceId": "<RESOURCE_ID>",
      "internal": {
        "chainId": 968,
        "networkName": "BOT Chain Testnet",
        "bridgeAddress": "<BRIDGE_ADDRESS>",
        "tokenAddress": "<TOKEN_ADDRESS>",
        "assetSymbol": "USDT",
        "minimumAmountExclusive": "10"
      },
      "external": {
        "chainId": 11155111,
        "networkName": "Ethereum Sepolia",
        "bridgeAddress": "<BRIDGE_ADDRESS>",
        "tokenAddress": "<TOKEN_ADDRESS>",
        "assetSymbol": "USDT"
      }
    },
    {
      "id": "bot-testnet-bsc-testnet-usdt",
      "name": "BOT Chain Testnet ↔ BNB Smart Chain Testnet · USDT",
      "resourceId": "<RESOURCE_ID>",
      "internal": {
        "chainId": 968,
        "networkName": "BOT Chain Testnet",
        "bridgeAddress": "<BRIDGE_ADDRESS>",
        "tokenAddress": "<TOKEN_ADDRESS>",
        "assetSymbol": "USDT",
        "minimumAmountExclusive": "10"
      },
      "external": {
        "chainId": 97,
        "networkName": "BNB Smart Chain Testnet",
        "bridgeAddress": "<BRIDGE_ADDRESS>",
        "tokenAddress": "<TOKEN_ADDRESS>",
        "assetSymbol": "USDT"
      }
    },
    {
      "id": "stellar-testnet-sepolia-usdc",
      "name": "Stellar Testnet ↔ Ethereum Sepolia · USDC",
      "protocol": "cctp",
      "resourceId": "cctp-stellar-sepolia",
      "internal": {
        "networkType": "stellar",
        "networkName": "Stellar Testnet",
        "domain": 27,
        "assetSymbol": "USDC",
        "tokenAddress": "STELLAR_USDC_CONTRACT",
        "tokenMessengerMinter": "STELLAR_TOKEN_MESSENGER_MINTER",
        "messageTransmitter": "STELLAR_MESSAGE_TRANSMITTER",
        "cctpForwarder": "STELLAR_CCTP_FORWARDER",
        "tokenIssuer": "STELLAR_USDC_ISSUER"
      },
      "external": {
        "networkType": "evm",
        "networkName": "Ethereum Sepolia",
        "chainId": 11155111,
        "domain": 0,
        "assetSymbol": "USDC",
        "tokenMessenger": "0xEVM_TOKEN_MESSENGER",
        "messageTransmitter": "0xEVM_MESSAGE_TRANSMITTER",
        "tokenAddress": "0xEVM_USDC"
      }
    }
  ]
}
}`}</CodeBlock>
            <p>Native EVM currencies come from <code>networks[].nativeCurrency</code>; group ERC-20 assets under <code>evm["&lt;chainId&gt;"]</code>. Wallets may connect on another chain, but balance, transfer, and swap operations reject chains absent from <code>networks</code>. Use a Horizon URL and passphrase for the same Stellar network, and make sure the connected wallet matches its configured network. See the <a href="https://github.com/cordyStackX/cordy_minikit_official/blob/main/docs/environment.md" target="_blank" rel="noreferrer">configuration reference</a> for all supported fields.</p>
            <p>For Stellar Testnet ↔ Ethereum Sepolia USDC, set <code>protocol</code> to <code>"cctp"</code>. The Stellar side uses Circle's Soroban contracts and domain <code>27</code>; Ethereum Sepolia uses domain <code>0</code>. CCTP burns USDC on the source, waits for Circle attestation, and mints USDC on the destination.</p>
            <p>For apps that configure Cordy directly, import the client and asset JSON, then call <code>cordy.configure()</code> once before balance, transfer, or swap operations. The remaining examples assume this import is in scope:</p>
            <CodeBlock language="ts">{`import { cordy } from "@cordystackx/cordy_minikit";
import assets from "./assets.json";

cordy.configure({ assets });`}</CodeBlock>
          </section>

          <section id="authentication" className="article-section">
            <h2>Verify wallet sign-in</h2>
            <p>Set <code>cons_session</code> to require a signature before navigation. Cordy requests a SIWE challenge for EVM wallets or a SEP-10 challenge for Stellar, verifies the signature on your server, and creates an HTTP-only session cookie. A rejected or invalid signature leaves the user on the current page.</p>
            <CodeBlock language="tsx">{`<ConnectWalletBT cons_session={true} navigate="/dashboard" />`}</CodeBlock>
            <h3>Configure the server</h3>
            <p>Create the server instance in a server-only module. The SDK never reads environment variables. Keep both values in your app's server environment, and never pass secrets through the client provider.</p>
            <CodeBlock language="ts">{`// src/lib/cordy-server.ts
import "server-only";
import { createCordyServer } from "@cordystackx/cordy_minikit/server";

export const cordyServer = createCordyServer({
  signingSecret: process.env.SIGNING_SECRET,
  jwtKey: process.env.JWT_SECRET,
  // allowedDomains: ["app.example.com"],
});`}</CodeBlock>
            <p><code>SIGNING_SECRET</code> is used to build Stellar SEP-10 challenges. <code>JWT_SECRET</code> must be a random value of at least 32 bytes. The default route prefix is <code>/services/cons</code>; mount the handler at <code>app/services/cons/[action]/route.ts</code>:</p>
            <CodeBlock language="ts">{`import { cordyServer } from "@/lib/cordy-server";

export const { GET, POST } = cordyServer.handler();`}</CodeBlock>
            <p>The folder path before <code>[action]</code> is the URL prefix. If you move the route to <code>app/api/cons/[action]/route.ts</code>, set <code>consPath="/api/cons"</code> on <code>ProvidersClientWrapper</code> too. The route path and this prop must match; the SDK will request <code>/api/cons/challenge</code>, <code>/api/cons/verify</code>, <code>/api/cons/session</code>, and <code>/api/cons/disconnect</code>. Keep the default folder if you do not want to set <code>consPath</code>. For custom routing, the server instance also exposes <code>challenge(request)</code>, <code>verify(request)</code>, <code>session(request)</code>, and <code>disconnect(request)</code>.</p>
            <CodeBlock language="tsx">{`// app/providers.tsx, when the route is app/api/cons/[action]/route.ts
<ProvidersClientWrapper assets={assets} consPath="/api/cons">
  {children}
</ProvidersClientWrapper>`}</CodeBlock>
          </section>

          <section id="wallet-checks" className="article-section">
            <h2>Read the authenticated session</h2>
            <p><code>cordy.cons_verify()</code> works by itself: call it when you need a one-time check of the current server session. You do not need to import <code>useConsSession()</code> for that. The hook is an optional React convenience that loads the session and updates the UI after sign-in or logout. Either one checks an existing session; sign-in must first succeed through <code>ConnectWalletBT</code> and the server handler. Protect private data by checking <code>cordyServer.session(request)</code> on the server.</p>
            <h3>One-time check with the SDK function</h3>
            <CodeBlock language="ts">{`const wallet = await cordy.cons_verify();

if (wallet.authenticated) {
  console.log("Signed in:", wallet.chain, wallet.address);
} else {
  console.log("Sign in to continue.");
}`}</CodeBlock>
            <h3>Reactive session state with the optional hook</h3>
            <CodeBlock language="tsx">{`const { loading, authenticated, address, chain } = useConsSession();`}</CodeBlock>
          </section>

          <section id="use-functions" className="article-section">
            <h2>Call functions from your app</h2>
            <p>Put SDK calls in client components under <code>ProvidersClientWrapper</code>. Call them from a button or form submit handler, then show the result or error. These are app-side actions: your UI gathers values, Cordy performs the wallet operation, and your UI displays the response.</p>
            <h3>Read and display a balance</h3>
            <CodeBlock language="tsx">{`async function refreshBalance() {
  const result = await cordy.balance({ asset: "USDT" });
  setMessage(result.success
    ? String(result.balance) + " " + String(result.asset) + " on " + String(result.network)
    : result.error ?? "Could not read balance.");
}

<button onClick={refreshBalance}>Refresh USDT</button>`}</CodeBlock>
            <h3>Send a transfer from a form</h3>
            <CodeBlock language="tsx">{`async function sendTransfer() {
  const result = await cordy.transfer(amount, recipient, { asset: "USDT" });
  setMessage(result.success
    ? "Transaction: " + result.transactionHash
    : result.error ?? "Transfer failed.");
}

<button onClick={sendTransfer}>Send USDT</button>`}</CodeBlock>
            <h3>Swap with selected options</h3>
            <CodeBlock language="tsx">{`const result = await cordy.swap(amount, fromAsset, toAsset, 0.5, {
  version: "auto",
  feeTiers: [500, 3000, 10000],
});`}</CodeBlock>
            <p>Here, <code>0.5</code> means 0.5% slippage. The fee tiers choose which V3 pools Cordy quotes: 500 is a 0.05% pool fee, 3000 is 0.30%, and 10000 is 1.00%. These are separate settings.</p>
            <h3>Bridge using a configured route</h3>
            <CodeBlock language="tsx">{`const result = await cordy.bridge(
  amount,
  "internal",
  "external",
  recipient,
  { routeId: "bot-testnet-sepolia-usdt" },
);`}</CodeBlock>
            <p>Choose the route ID from <code>assets.bridge.routes</code>. Mount <code>BridgeEvmWalletModal</code> once if you want Cordy to open its EVM wallet dialog and prepare the route network when needed. Bridge success confirms the source transaction; destination delivery follows the configured protocol.</p>
            <p>For full examples with imports, session handling, errors, and logout, follow the <a href="https://github.com/cordyStackX/cordy_minikit_official/blob/main/docs/recipes.md" target="_blank" rel="noreferrer">Use Cordy in your app guide</a>.</p>
          </section>

          <section id="balance" className="article-section">
            <h2>Read a balance</h2>
            <p>Read an asset configured for the connected wallet’s network. Omit the asset option to use the configured default asset.</p>
            <CodeBlock language="ts">{`const result = await cordy.balance({ asset: "USDT" });

if (!result.success) {
  console.error(result.error);
} else {
  console.log(result.balance, result.asset, result.network);
}`}</CodeBlock>
          </section>

          <section id="transfer" className="article-section">
            <h2>Transfer an asset</h2>
            <p>Transfers require an asset configured for the active wallet network and wallet approval. Native EVM currencies come from the network configuration; ERC-20 assets are selected from the chain-keyed registry. Use an EVM address for EVM assets or a Stellar public address for Stellar assets.</p>
            <CodeBlock language="ts">{`const result = await cordy.transfer("1", recipient, {
  asset: "USDT",
});

if (!result.success) {
  console.error(result.error);
} else {
  console.log("Transaction:", result.transactionHash);
}`}</CodeBlock>
          </section>

          <section id="swap" className="article-section">
            <h2>Swap assets</h2>
            <p>Swap two configured assets on the connected wallet’s network. The optional fourth argument sets slippage tolerance as a percentage; it defaults to <code>1</code> (1%). Swaps require wallet approval and available liquidity.</p>
            <CodeBlock language="ts">{`const result = await cordy.swap("10", "USDT", "BOT", 0.5, {
  version: "v3",
  feeTiers: [500, 3000],
});

if (!result.success) {
  console.error(result.error);
} else {
  console.log("Estimated output:", result.estimatedAmountOut);
  console.log("Transaction:", result.transactionHash);
}

// Omit the fourth argument to use the default 1 percent tolerance.`}</CodeBlock>
            <p>EVM swaps can use configured V2 and V3 routers. Auto compares available quotes; per-call <code>feeTiers</code> can restrict which V3 pools are quoted while leaving the network defaults intact. Common tiers are 500 (0.05%), 3000 (0.30%), and 10000 (1.00%). Slippage tolerance remains the separate fourth argument. Every chain needs its own router, QuoterV2, fee-tier, and token configuration. Native swaps also need the wrapped native token address. Stellar swaps use Horizon strict-send paths and need a valid path and matching trustlines.</p>
          </section>

          <section id="disconnect" className="article-section">
            <h2>Disconnect a wallet</h2>
            <p><code>cordy.cons_disconnect()</code> clears the server session and disconnects connected wallets. The server handler must be mounted.</p>
            <CodeBlock language="ts">{`const result = await cordy.cons_disconnect();
if (!result.success) console.error(result.error);`}</CodeBlock>
          </section>

          <section id="bridge-api" className="article-section">
            <h2>Bridge assets</h2>
            <h3><code>cordy.bridge()</code></h3>
            <p>Choose a route from <code>assets.bridge.routes</code>, then choose its direction. In a call, <code>internal</code> and <code>external</code> refer to the sides in that route. The demo offers BOT Chain Testnet ↔ Sepolia and BOT Chain Testnet ↔ BNB Smart Chain Testnet. The provider imports only <code>assets.json</code>. See the <a href="https://github.com/cordyStackX/cordy_minikit_official/blob/main/docs/environment.md#bridge-routes" target="_blank" rel="noreferrer">route configuration guide</a>.</p>
            <CodeBlock language="ts">{`const result = await cordy.bridge(
  "10.5",
  "internal",
  "external",
  recipient,
  { routeId: "bot-testnet-sepolia-usdt" },
);`}</CodeBlock>
            <p>Cordy checks the source chain and balance, asks for token approval if needed, then submits the source deposit and waits for confirmation. If no EVM wallet is connected, the SDK modal opens automatically, prepares the configured route network, and resumes without a second click. Custom bridge validators deliver the asset on the destination chain afterward; the configured Stellar ↔ Sepolia route uses Circle CCTP burn, attestation, and mint.</p>
            <p><code>success: true</code> confirms the source deposit only. <code>status: "submitted"</code> means destination delivery is pending. Cordy does not track completion; check the destination balance or bridge status service.</p>
            <p>The demo's BOT testnet source requires more than 10 USDT, so the example uses 10.5. The external sides have no configured minimum. All demo route tokens are testnet assets with no real-world value.</p>
          </section>

          <section id="links" className="article-section">
            <h2>More resources</h2>
            <div className="resource-links">
              <a href="https://www.npmjs.com/package/@cordystackx/cordy_minikit" target="_blank" rel="noreferrer">NPM package <ExternalIcon /></a>
              <a href="https://github.com/cordyStackX/cordy_minikit_official/tree/main/docs" target="_blank" rel="noreferrer">Full documentation <ExternalIcon /></a>
              <a href="https://dev-docs.botchain.ai/docs/Developers/quick-guide/" target="_blank" rel="noreferrer">BOT Chain Developer Quick Guide <ExternalIcon /></a>
              <a href="https://github.com/cordyStackX/cordy_minikit_official/blob/main/CHANGELOG.md" target="_blank" rel="noreferrer">Changelog <ExternalIcon /></a>
            </div>
          </section>
          <div className="article-footer"><Link href="/">← Back to Cordy Minikit</Link><a href="#configuration">Configure assets →</a></div>
        </main>

        <aside className="documentation-toc" aria-label="On this page">
          <p>ON THIS PAGE</p>
          {sections.map((section) => <a key={section.id} href={`#${section.id}`}>{section.label}</a>)}
          <a className="toc-github" href="https://github.com/cordyStackX/cordy_minikit_official/blob/main/README.md" target="_blank" rel="noreferrer">View README <ExternalIcon /></a>
        </aside>
      </div>
    </div>
  );
}
