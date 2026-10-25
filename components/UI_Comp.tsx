"use client";

import { UI_Comp__css } from "../css";
import { WalletButton, getTokenBalance, StellarWalletButton, loadStellarBalance, useDisconnectWallets } from "../controllers";
import { useWalletModal, useStellarWallet } from "../wagmi__providers";
import { useAccount } from "wagmi";
import { useState, useEffect } from "react";
import pkg from "../package.json";
import links from "../config/links.json";
const ACTIVE_WALLET_SESSION_KEY = "cordy_minikit_active_wallet_session";

type WalletRoute = "browser-evm" | "walletconnect" | "stellar";

const walletRoutes: { id: WalletRoute; title: string; subtitle: string; icon: string; hint: string }[] = [
  { id: "browser-evm", title: "EVM · Browser", subtitle: "Use MetaMask, Coinbase Wallet, or another extension", icon: "E", hint: "Browser" },
  { id: "walletconnect", title: "WalletConnect · Mobile", subtitle: "Connect with a wallet on your phone using a QR code", icon: "W", hint: "QR code" },
  { id: "stellar", title: "Stellar · Non-EVM", subtitle: "Connect a Stellar account with Freighter", icon: "✦", hint: "Freighter" },
];

export default function UI_Comp() {
  const { closeModal, jwtSession } = useWalletModal();
  const { stellarWallet, setStellarWallet } = useStellarWallet();
  const { isConnected, address, chain } = useAccount();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | undefined>();
  const [balance, setBalance] = useState("");
  const [symbol, setSymbol] = useState("");
  const [stellarLoading, setStellarLoading] = useState(false);
  const [stellarError, setStellarError] = useState<string | undefined>();
  const [selectedRoute, setSelectedRoute] = useState<WalletRoute | null>(null);
  const { disconnectEVM, disconnectStellar } = useDisconnectWallets();

  useEffect(() => {
    if (!jwtSession && isConnected && address) void Get_Balance();
  }, [isConnected, address, jwtSession]);

  useEffect(() => {
    if (!jwtSession && stellarWallet.address) void loadStellarBalance(stellarWallet.address);
  }, [stellarWallet.address, jwtSession]);

  const Get_Balance = async () => {
    if (!address) return;
    const result = await getTokenBalance(address);
    setBalance(result.balance);
    setSymbol(result.symbol);
  };

  const handleLoadStellarBalance = async (accountId: string) => {
    setStellarError(undefined);
    try {
      const result = await loadStellarBalance(accountId);
      setStellarWallet((current) => ({ ...current, address: result.address, network: result.network, balance: result.balance }));
      window.localStorage.setItem(ACTIVE_WALLET_SESSION_KEY, "stellar");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load Stellar balance";
      console.error("Failed to load Stellar balance:", err);
      setStellarError(message);
      setStellarWallet((current) => ({ ...current, balance: "0" }));
    }
  };

  const truncateAddress = (value?: string | null, head = 8, tail = 4) => {
    if (!value) return "";
    if (value.length <= head + tail + 3) return value;
    return `${value.slice(0, head)}...${value.slice(-tail)}`;
  };

  const footer = <a className={UI_Comp__css.footer_link} href={links.NPM_Pack_links} target="_blank" rel="noreferrer">
    Cordy Minikit <span aria-hidden="true">·</span> v{pkg.version}
  </a>;

  if (isConnected || stellarWallet.address) {
    const isStellar = !isConnected && Boolean(stellarWallet.address);
    const connectedAddress = isStellar ? stellarWallet.address : address;
    const connectedNetwork = isStellar ? stellarWallet.network || "Stellar" : chain?.name || "Network unavailable";
    const connectedBalance = isStellar
      ? stellarWallet.balance ? `${stellarWallet.balance} XLM` : "Loading balance…"
      : balance ? `${Number(balance).toFixed(4)} ${symbol}` : "Loading balance…";

    return (
      <div className={UI_Comp__css.container}>
        <section className={UI_Comp__css.connector} role="dialog" aria-modal="true" aria-labelledby="wallet-modal-title">
          <header className={UI_Comp__css.modal_header}>
            <div className={UI_Comp__css.brand_mark} aria-hidden="true">C</div>
            <div><p className={UI_Comp__css.eyebrow}>CORDY MINIKIT</p><h2 id="wallet-modal-title">Wallet connected</h2></div>
            <button className={UI_Comp__css.close_button} type="button" onClick={closeModal} aria-label="Close wallet dialog">×</button>
          </header>
          <div className={UI_Comp__css.connected_card}>
            <div className={UI_Comp__css.connected_heading}><span className={UI_Comp__css.connected_dot} /> {isStellar ? "Stellar wallet" : "EVM wallet"}<span className={UI_Comp__css.network_badge}>{connectedNetwork}</span></div>
            {!jwtSession && <>
              <div className={UI_Comp__css.balance_value}>{connectedBalance}</div>
              <p className={UI_Comp__css.muted}>{isStellar ? "Native balance" : "Token balance"}</p>
            </>}
            <div className={UI_Comp__css.address_row}><span>Address</span><code title={connectedAddress || ""}>{truncateAddress(connectedAddress, 12, 8)}</code></div>
            {isStellar && stellarError && <p className={UI_Comp__css.error_message} role="alert">{stellarError}</p>}
          </div>
          <button className={UI_Comp__css.disconnect_button} type="button" onClick={async () => { if (isStellar) await disconnectStellar(); else await disconnectEVM(); }}>Disconnect wallet</button>
          {footer}
        </section>
      </div>
    );
  }

  const selectedWalletRoute = walletRoutes.find((route) => route.id === selectedRoute);

  return (
    <div className={UI_Comp__css.container}>
      <section className={UI_Comp__css.connector} role="dialog" aria-modal="true" aria-labelledby="wallet-modal-title" aria-describedby="wallet-modal-description">
        <header className={UI_Comp__css.modal_header}>
          <div className={UI_Comp__css.brand_mark} aria-hidden="true">C</div>
          <div><p className={UI_Comp__css.eyebrow}>CORDY MINIKIT <span>·</span> WALLET ACCESS</p><h2 id="wallet-modal-title">{selectedWalletRoute?.title || "Choose a wallet"}</h2></div>
          <button className={UI_Comp__css.close_button} type="button" onClick={closeModal} aria-label="Close wallet dialog">×</button>
        </header>
        <p id="wallet-modal-description" className={UI_Comp__css.modal_description}>{selectedWalletRoute ? selectedWalletRoute.subtitle : "Select how you want to connect."}</p>

        {(loading || stellarLoading) && <div className={UI_Comp__css.loading_notice} role="status"><span className={UI_Comp__css.spinner} /> Waiting for wallet approval…</div>}

        {!selectedRoute ? (
          <div className={UI_Comp__css.wallet_choices} role="group" aria-label="Wallet connection options">
            {walletRoutes.map((route) => (
              <button key={route.id} type="button" className={UI_Comp__css.wallet_choice} onClick={() => { setErrorMsg(undefined); setStellarError(undefined); setSelectedRoute(route.id); }}>
                <span className={`${UI_Comp__css.choice_icon} ${route.id === "stellar" ? UI_Comp__css.stellar_choice_icon : ""}`} aria-hidden="true">{route.icon}</span>
                <span className={UI_Comp__css.choice_copy}><span className={UI_Comp__css.choice_title}>{route.title}</span><span className={UI_Comp__css.choice_subtitle}>{route.subtitle}</span></span>
                <span className={UI_Comp__css.choice_hint}>{route.hint}</span>
                <svg className={UI_Comp__css.choice_chevron} aria-hidden="true" viewBox="0 0 16 16" fill="none"><path d="m6 3 5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            ))}
          </div>
        ) : (
          <>
            <button type="button" className={UI_Comp__css.back_button} onClick={() => { setSelectedRoute(null); setErrorMsg(undefined); setStellarError(undefined); }}>
              <svg aria-hidden="true" viewBox="0 0 16 16" fill="none"><path d="M10 3 5 8l5 5M5 8h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              All connection options
            </button>
            <div className={UI_Comp__css.wallet_panel}>
              <p className={UI_Comp__css.panel_label}>AVAILABLE WALLETS</p>
              <div className={UI_Comp__css.wallet_options}>
                {selectedRoute === "browser-evm" && <WalletButton connectorGroup="browser" onStatusChange={({ isPending, error }: { isPending: boolean; error?: string }) => { setLoading(isPending); setErrorMsg(error); }} />}
                {selectedRoute === "walletconnect" && <WalletButton connectorGroup="walletconnect" onStatusChange={({ isPending, error }: { isPending: boolean; error?: string }) => { setLoading(isPending); setErrorMsg(error); }} />}
                {selectedRoute === "stellar" && <StellarWalletButton
                  onConnect={(accountId) => {
                    setStellarWallet((current) => ({ ...current, address: accountId }));
                    if (!jwtSession) void handleLoadStellarBalance(accountId);
                  }}
                  onStatusChange={({ isPending, error, address: accountId, network }) => {
                    setStellarLoading(isPending);
                    setStellarError(error);
                    if (accountId) {
                      setStellarWallet((current) => ({ ...current, address: accountId }));
                      if (!jwtSession) void handleLoadStellarBalance(accountId);
                    }
                    if (network) setStellarWallet((current) => ({ ...current, network }));
                  }}
                />}
              </div>
              <p className={UI_Comp__css.panel_note}>{selectedRoute === "walletconnect" ? "Scan the QR code with your mobile wallet to continue." : selectedRoute === "stellar" ? "Freighter will ask you to approve access to your Stellar account." : "Choose an installed browser wallet to continue."}</p>
            </div>
          </>
        )}

        {(errorMsg || stellarError) && <div className={UI_Comp__css.error_message} role="alert">{errorMsg || stellarError}</div>}
        <div className={UI_Comp__css.modal_footer}><span>Connecting only shares your public wallet address.</span>{footer}</div>
      </section>
    </div>
  );
}
