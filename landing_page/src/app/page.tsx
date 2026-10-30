import Image from "next/image";
import Link from "next/link";

const features = [
  {
    number: "01",
    title: "One wallet layer",
    description: "Connect EVM wallets or Stellar Freighter through one focused developer toolkit.",
    icon: "◈",
  },
  {
    number: "02",
    title: "Useful primitives",
    description: "Read balances, transfer assets, and build swaps with a small, typed API.",
    icon: "↗",
  },
  {
    number: "03",
    title: "Your config, your networks",
    description: "Pass networks and assets from your app. Keep your integrations in your control.",
    icon: "⌘",
  },
];

function GithubIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.55.1.76-.24.76-.54v-2.08c-3.1.68-3.76-1.32-3.76-1.32-.5-1.29-1.23-1.63-1.23-1.63-1.01-.69.08-.68.08-.68 1.12.08 1.7 1.15 1.7 1.15.99 1.7 2.6 1.21 3.23.92.1-.72.39-1.21.7-1.49-2.47-.28-5.07-1.24-5.07-5.51 0-1.22.44-2.22 1.15-3-.12-.28-.5-1.42.11-2.96 0 0 .94-.3 3.06 1.14a10.65 10.65 0 0 1 5.57 0c2.13-1.44 3.06-1.14 3.06-1.14.61 1.54.23 2.68.12 2.96.71.78 1.14 1.78 1.14 3.01 0 4.28-2.6 5.22-5.08 5.5.4.35.75 1.02.75 2.06v3.07c0 .3.2.65.77.54A11.1 11.1 0 0 0 12 .9Z" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
      <path d="M4.5 10h11m-4.5-4.5L15.5 10 11 14.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Home() {
  return (
    <main className="site-shell">
      <header className="site-header">
        <Link className="brand" href="/" aria-label="Cordy Minikit home">
          <Image className="brand-logo" src="/cordy-logo.svg" alt="" width={34} height={34} priority />
          <span>Cordy<span className="brand-light"> Minikit</span></span>
          <span className="brand-version">3.0</span>
        </Link>

        <nav className="header-nav" aria-label="Main navigation">
          <a className="github-link" href="https://github.com/cordyStackX/cordy_minikit_official" target="_blank" rel="noreferrer" aria-label="Cordy Minikit on GitHub">
            <GithubIcon />
          </a>
          <Link className="header-cta" href="/docs">Get started</Link>
        </nav>
      </header>

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-glow" aria-hidden="true" />
        <div className="hero-content">
          <div className="eyebrow"><span className="status-dot" /> OPEN SOURCE WALLET TOOLKIT <span className="eyebrow-divider">·</span> EVM + STELLAR</div>
          <h1 id="hero-title">Build wallet experiences<br /><span>from every angle.</span></h1>
          <p className="hero-copy">A practical TypeScript toolkit for connecting wallets and working with assets across EVM networks and Stellar.</p>

          <div className="hero-actions">
            <Link className="button button-primary" href="/docs/setup-guide">Open the docs <ArrowIcon /></Link>
            <a className="button button-secondary" href="https://github.com/cordyStackX/cordy_minikit_official" target="_blank" rel="noreferrer"><GithubIcon /> View on GitHub</a>
          </div>

          <div className="install-block" aria-label="Install command">
            <span className="terminal-prompt">$</span>
            <code>pnpm install @cordystackx/cordy_minikit</code>
            <span className="install-tag">NPM</span>
          </div>
          <p className="install-note">Start with the setup guide, then connect the wallet and assets your app needs.</p>
        </div>

        <div className="hero-visual" aria-label="Cordy Minikit supports BOT Chain, other EVM networks, and Stellar wallets">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="visual-center">
            <Image className="visual-logo" src="/cordy-logo.svg" alt="Cordy Minikit" width={38} height={38} />
            <span className="visual-caption">ONE TOOLKIT</span>
            <strong>Many wallet<br />experiences.</strong>
          </div>
          <div className="network-chip chip-evm"><span className="chip-symbol">◇</span><span><b>EVM</b><small>Wallets & networks</small></span></div>
          <div className="network-chip chip-bot"><Image className="chip-bot-logo" src="https://media.licdn.com/dms/image/v2/D560BAQGEjIIWDBy_ew/company-logo_200_200/B56Z4aUqBtH4AI-/0/1778558083613?e=2147483647&v=beta&t=2K8kSMtNPDdc0fPi0ivKhfsOj4dm2vbdOoGoemqd1y4" alt="BOT Chain logo" width={29} height={29} unoptimized /><span><b>BOT Chain</b><small>EVM network</small></span></div>
          <div className="network-chip chip-stellar"><span className="chip-symbol">✳</span><span><b>Stellar</b><small>Freighter & Soroban</small></span></div>
          <div className="visual-coordinate">SDK / 03.0</div>
        </div>
        <div className="hero-bottomline"><span>DESIGNED FOR BUILDERS</span><span>WALLET · ASSETS · ONCHAIN</span></div>
      </section>

      <section className="intro-section" aria-labelledby="intro-title">
        <div className="section-kicker"><span /> THE CONNECTION LAYER</div>
        <h2 id="intro-title">Less glue code.<br /><span>More room to build.</span></h2>
        <p>Cordy Minikit brings wallet connection and common onchain actions into a consistent developer experience, while your app stays in charge of configuration and user flows.</p>
        <Link className="text-link" href="/docs">Explore the documentation <ArrowIcon /></Link>
      </section>

      <section className="features-section" aria-labelledby="features-title">
        <div className="features-heading">
          <div>
            <div className="section-kicker"><span /> THE TOOLKIT</div>
            <h2 id="features-title">Everything you need<br />to get connected.</h2>
          </div>
          <p>Start with the building blocks. Bring your own network configuration, assets, and product ideas.</p>
        </div>

        <div className="feature-grid">
          {features.map((feature) => (
            <article className="feature-card" key={feature.number}>
              <div className="feature-topline"><span>{feature.number} / 03</span><span className="feature-icon">{feature.icon}</span></div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <div className="feature-rule" />
              <span className="feature-foot">CORDY MINIKIT · TYPESCRIPT</span>
            </article>
          ))}
        </div>
      </section>

      <section className="docs-banner" aria-labelledby="banner-title">
        <div className="banner-orb" aria-hidden="true" />
        <div className="banner-copy">
          <div className="section-kicker"><span /> READY WHEN YOU ARE</div>
          <h2 id="banner-title">Your next build<br />starts here.</h2>
          <p>Follow the setup guide and make Cordy Minikit part of your stack.</p>
        </div>
        <Link className="button button-banner" href="/docs/setup-guide">Open the docs <ArrowIcon /></Link>
      </section>

      <footer className="site-footer">
        <Link className="brand footer-brand" href="/">
          <Image className="brand-logo" src="/cordy-logo.svg" alt="" width={30} height={30} /><span>Cordy<span className="brand-light"> Minikit</span></span>
        </Link>
        <span>Open source tools for onchain builders.</span>
        <div className="footer-links"><Link href="/docs">Documentation</Link><a href="https://github.com/cordyStackX/cordy_minikit_official" target="_blank" rel="noreferrer" aria-label="GitHub"><GithubIcon /></a></div>
      </footer>
    </main>
  );
}
