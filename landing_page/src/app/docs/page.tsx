import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

const sections = [
  { id: "install", label: "Install" },
  { id: "getting-started", label: "Provider setup" },
  { id: "configuration", label: "Configure assets" },
  { id: "wallet-checks", label: "Check wallet" },
  { id: "balance", label: "Read balances" },
  { id: "transfer", label: "Transfer assets" },
  { id: "swap", label: "Swap assets" },
  { id: "disconnect", label: "Disconnect wallet" },
  { id: "experimental-api", label: "Experimental API" },
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
          <a className="sidebar-item" href="#wallet-checks">Check wallet</a>
          <a className="sidebar-item" href="#balance">Read balances</a>
          <a className="sidebar-item" href="#transfer">Transfer assets</a>
          <a className="sidebar-item" href="#swap">Swap assets</a>
          <a className="sidebar-item" href="#disconnect">Disconnect wallet</a>
          <a className="sidebar-item" href="#experimental-api">Experimental features</a>
          <div className="sidebar-bottom">
            <span className="version-dot" /> Cordy Minikit <span>v3.0.5</span>
          </div>
        </aside>

        <main className="documentation-article">
          <div className="article-eyebrow">CORDY MINIKIT <span>›</span> DEVELOPERS <span>›</span> QUICK GUIDE</div>
          <h1>Getting Started</h1>
          <p className="article-lead">Cordy Minikit provides wallet connection checks and asset operations for EVM and Stellar/Soroban. Follow this guide to install the package, configure assets, and use each method. Examples assume the user has connected the appropriate wallet and network.</p>

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
            <p>The wrapper sets up the wallet and network clients for its children. Render <code>ConnectWalletBT</code> and call the <code>cordy.*</code> methods from components beneath it. EVM wallets and Stellar through Freighter are supported.</p>
            <CodeBlock language="tsx">{`"use client";

import { ConnectWalletBT } from "@cordystackx/cordy_minikit";

export function WalletAccess() {
  return <ConnectWalletBT />;
}`}</CodeBlock>
          </section>

          <section id="configuration" className="article-section">
            <h2>Configure assets</h2>
            <p>Define supported networks and assets in your application’s JSON configuration and pass it to the provider wrapper above. The wrapper configures Cordy automatically.</p>
            <p>This filtered example follows the demo’s <code>assets.json</code> structure. Replace the sample IDs and addresses with values for your own app:</p>
            <CodeBlock language="json">{`{
  "walletConnectProjectId": "YOUR_WALLETCONNECT_PROJECT_ID",
  "networks": [
    {
      "chainId": 1,
      "name": "Your EVM Network",
      "nativeCurrency": { "name": "Ether", "symbol": "ETH", "decimals": 18 },
      "rpcUrl": "https://your-network-rpc.example",
      "blockExplorerUrl": "https://your-block-explorer.example",
      "swapRouterAddress": "0xYourSwapRouterAddress",
      "wrappedNativeTokenAddress": "0xYourWrappedNativeTokenAddress"
    }
  ],
  "stellarNetwork": {
    "horizonUrl": "https://horizon-testnet.stellar.org",
    "contractId": "YOUR_SOROBAN_CONTRACT_ID",
    "networkPassphrase": "Test SDF Network ; September 2015"
  },
  "evm": [
    { "symbol": "ETH", "type": "native", "decimals": 18 },
    {
      "symbol": "USDC",
      "contractAddress": "0xYourTokenContractAddress",
      "decimals": 6
    }
  },
  "stellar": [
    {
      "symbol": "USDC",
      "type": "credit",
      "code": "USDC",
      "issuer": "YOUR_STELLAR_ASSET_ISSUER"
    },
    { "symbol": "XLM", "type": "native" }
  ]
}`}</CodeBlock>
            <p>Use a Horizon URL and passphrase for the same Stellar network, and make sure the connected wallet matches its configured network. See the <a href="https://github.com/cordyStackX/cordy_minikit_official/blob/main/docs/environment.md" target="_blank" rel="noreferrer">configuration reference</a> for all supported fields.</p>
            <p>For apps that configure Cordy directly, import the client and asset JSON, then call <code>cordy.configure()</code> once before balance, transfer, or swap operations. The remaining examples assume this import is in scope:</p>
            <CodeBlock language="ts">{`import { cordy } from "@cordystackx/cordy_minikit";
import assets from "./assets.json";

cordy.configure({ assets });`}</CodeBlock>
          </section>

          <section id="wallet-checks" className="article-section">
            <h2>Check the wallet connection</h2>
            <p>Use <code>cordy.cons_verify()</code> to check the current browser connection. It returns status <code>200</code> when connected or <code>401</code> when disconnected. This reports local connection state; it does not authenticate wallet ownership to your server.</p>
            <CodeBlock language="ts">{`const wallet = await cordy.cons_verify();

if (wallet.status === 200) {
  console.log("Connected:", wallet.network, wallet.address);
} else {
  console.log("Connect a wallet to continue.");
}`}</CodeBlock>
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
            <p>Transfers require an asset configured for the active wallet network and wallet approval. Use an EVM address for EVM assets or a Stellar public address for Stellar assets.</p>
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
            <CodeBlock language="ts">{`const result = await cordy.swap("10", "USDT", "BOT", 0.5);

if (!result.success) {
  console.error(result.error);
} else {
  console.log("Estimated output:", result.estimatedAmountOut);
  console.log("Transaction:", result.transactionHash);
}

// Omit the fourth argument to use the default 1 percent tolerance.`}</CodeBlock>
            <p>EVM swaps need a configured Uniswap V2-compatible router; native-asset swaps also need the wrapped native token address. Stellar swaps use Horizon strict-send paths and need a valid path and matching trustlines.</p>
          </section>

          <section id="disconnect" className="article-section">
            <h2>Disconnect a wallet</h2>
            <p><code>cordy.cons_disconnect()</code> disconnects the wallet locally. It does not need a server endpoint.</p>
            <CodeBlock language="ts">{`const result = await cordy.cons_disconnect();
if (!result.success) console.error(result.error);`}</CodeBlock>
          </section>

          <section id="experimental-api" className="article-section">
            <div className="section-title-row"><h2>Experimental API</h2><span className="experimental-badge">EXPERIMENTAL</span></div>
            <h3><code>cordy.bridge()</code></h3>
            <p>The current bridge test route supports test USDT between BOT Chain Testnet and Ethereum Sepolia only. It is experimental and is not production-ready.</p>
            <CodeBlock language="ts">{`const result = await cordy.bridge(
  "12",
  "internal",
  "external",
  recipient,
);`}</CodeBlock>
            <p>Both directions require test assets and source-chain gas. A successful result means the source deposit was confirmed; destination delivery is handled asynchronously by bridge validators.</p>
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
