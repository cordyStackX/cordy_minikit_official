"use client";

import { UI_Comp__css } from "../css";
import { WalletButton, getTokenBalance, StellarWalletButton, loadStellarBalance, useDisconnectWallets } from "../controllers";
import { useWalletModal, useStellarWallet } from "../wagmi__providers";
import { useAccount } from "wagmi";
import { useSignMessage } from "wagmi";
import { useRouter } from "next/navigation";
import { signTransaction as freighterSignTransaction } from "@stellar/freighter-api";
import { WebAuth } from "@stellar/stellar-sdk";
import { createSiweMessage } from "viem/siwe";
import { useState, useEffect, useRef } from "react";
import pkg from "../package.json";
import links from "../config/links.json";
const ACTIVE_WALLET_SESSION_KEY = "cordy_minikit_active_wallet_session";

type WalletRoute = "browser-evm" | "walletconnect" | "stellar";

const walletRoutes: { id: WalletRoute; title: string; subtitle: string; icon: string; hint: string }[] = [
  { id: "browser-evm", title: "EVM · Browser", subtitle: "Use MetaMask, Coinbase Wallet, or another extension", icon: "E", hint: "Browser" },
  { id: "walletconnect", title: "WalletConnect · Mobile", subtitle: "Connect with a wallet on your phone using a QR code", icon: "W", hint: "QR code" },
  { id: "stellar", title: "Stellar · Non-EVM", subtitle: "Connect a Stellar account with Freighter", icon: "✦", hint: "Freighter" },
];

function CordyLogo() {
  return (
    <svg viewBox="0 0 512 512" role="img" aria-label="Cordy Minikit">
      <defs>
        <linearGradient id="cordy-logo-gradient" x1="140" y1="140" x2="350" y2="380" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#F2F4F8" />
          <stop offset="1" stopColor="#AEBBD6" />
        </linearGradient>
        <linearGradient id="cordy-star-gradient" x1="307" y1="218" x2="383" y2="294" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#4F8CFF" />
          <stop offset="1" stopColor="#5CE1E6" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="112" fill="#111214" />
      <path d="M355.6 172.4 A130 130 0 1 0 355.6 339.6 A105 105 0 1 1 355.6 172.4 Z" fill="url(#cordy-logo-gradient)" />
      <path d="M345 218 Q345 256 383 256 Q345 256 345 294 Q345 256 307 256 Q345 256 345 218 Z" fill="url(#cordy-star-gradient)" />
    </svg>
  );
}

export default function UI_Comp() {
  const { openModal, closeModal, consSession, consPath, navigate, setSignedResult, authError, setAuthError } = useWalletModal();
  const { stellarWallet, setStellarWallet } = useStellarWallet();
  const { isConnected, address, chain } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | undefined>();
  const [balance, setBalance] = useState("");
  const [symbol, setSymbol] = useState("");
  const [stellarLoading, setStellarLoading] = useState(false);
  const [stellarError, setStellarError] = useState<string | undefined>();
  const [selectedRoute, setSelectedRoute] = useState<WalletRoute | null>(null);
  const { disconnectEVM, disconnectStellar } = useDisconnectWallets();
  const signingAttempt = useRef<string | null>(null);

  useEffect(() => {
    if (!consSession) {
      signingAttempt.current = null;
      return;
    }

    const stellarPreferred = selectedRoute === "stellar" ||
      (typeof window !== "undefined" && window.localStorage.getItem(ACTIVE_WALLET_SESSION_KEY) === "stellar");
    const useStellar = stellarPreferred && Boolean(stellarWallet.address);
    const evmAddress = address;
    const evmChain = chain;
    if ((!useStellar && (!isConnected || !evmAddress || !evmChain)) || (useStellar && !stellarWallet.network)) return;
    const account = useStellar ? stellarWallet.address! : evmAddress!;
    const attemptKey = `${useStellar ? "stellar" : "evm"}:${account}`;
    if (signingAttempt.current === attemptKey) return;
    signingAttempt.current = attemptKey;
    setAuthError(undefined);

    void (async () => {
      try {
        let signedPayload;
        if (useStellar) {
          const detectedNetwork = String(stellarWallet.network).toLowerCase();
          if (detectedNetwork !== "testnet" && detectedNetwork !== "public") {
            throw new Error("Freighter must be connected to Stellar Testnet or Public network.");
          }
          const networkName: "testnet" | "public" = detectedNetwork;
          const host = window.location.host;
          const challengeResponse = await fetch(`${consPath}/challenge`, {
            method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" },
            body: JSON.stringify({ chain: "stellar", account, network: networkName }),
          });
          const challenge = await challengeResponse.json();
          if (!challengeResponse.ok || challenge?.success !== true || challenge.chain !== "stellar") {
            throw new Error(typeof challenge?.message === "string" ? challenge.message : "Could not get Stellar authentication challenge.");
          }
          if (typeof challenge.transaction !== "string" || typeof challenge.network_passphrase !== "string" || typeof challenge.server_account !== "string" || typeof challenge.home_domain !== "string" || typeof challenge.web_auth_domain !== "string") {
            throw new Error("The server returned an incomplete Stellar challenge.");
          }
          if (challenge.home_domain !== host || challenge.web_auth_domain !== host) throw new Error("The Stellar challenge domain does not match this app.");
          const parsed = WebAuth.readChallengeTx(challenge.transaction, challenge.server_account, challenge.network_passphrase, host, host);
          if (parsed.clientAccountID !== account) throw new Error("The Stellar challenge account does not match the connected wallet.");
          if (parsed.matchedHomeDomain !== host) throw new Error("The Stellar challenge home domain does not match this app.");
          const result = await freighterSignTransaction(challenge.transaction, { networkPassphrase: challenge.network_passphrase, address: account });
          if (result.error) throw new Error(result.error.message || "The Stellar challenge could not be signed.");
          if (!result.signedTxXdr || result.signerAddress !== account) throw new Error("Freighter returned a signature for a different account.");
          signedPayload = { chain: "stellar" as const, address: account, network: networkName, signedXdr: result.signedTxXdr };
        } else {
          const network: "testnet" | "public" = evmChain!.testnet ? "testnet" : "public";
          const challengeResponse = await fetch(`${consPath}/challenge`, {
            method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" },
            body: JSON.stringify({ chain: "evm", account, network }),
          });
          const challenge = await challengeResponse.json();
          if (!challengeResponse.ok || challenge?.success !== true || challenge.chain !== "evm" || typeof challenge.nonce !== "string") {
            throw new Error(typeof challenge?.message === "string" ? challenge.message : "Could not get EVM authentication challenge.");
          }
          const message = createSiweMessage({
            domain: window.location.host,
            address: evmAddress!,
            statement: "Sign in to Cordy Minikit.",
            uri: window.location.origin,
            version: "1",
            chainId: evmChain!.id,
            nonce: challenge.nonce,
            issuedAt: new Date(),
            expirationTime: new Date(Date.now() + 5 * 60 * 1000),
          });
          const signature = await signMessageAsync({ message });
          signedPayload = { chain: "evm" as const, address: evmAddress!, network, signature, message };
        }

        setSignedResult(signedPayload);
        const verifyResponse = await fetch(`${consPath}/verify`, {
          method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify(signedPayload),
        });
        const verifyBody = await verifyResponse.json().catch(() => ({}));
        if (verifyResponse.ok && verifyBody?.success === true) {
          window.dispatchEvent(new Event("cordy:cons-session-authenticated"));
          closeModal();
          if (navigate) router.replace(navigate);
          return;
        }
        throw new Error(typeof verifyBody?.message === "string" ? verifyBody.message : "Signature verification failed.");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Authentication signing failed.";
        const stellarAttempt = attemptKey.startsWith("stellar:");
        if (stellarAttempt) await disconnectStellar(); else await disconnectEVM();
        openModal({ consSession: true, navigate });
        setAuthError(message.toLowerCase().includes("reject") || message.toLowerCase().includes("denied")
          ? "You rejected the signature request. The wallet was disconnected."
          : `Could not complete wallet signing: ${message}`);
        signingAttempt.current = null;
      }
    })();
  }, [address, chain, closeModal, consPath, consSession, disconnectEVM, disconnectStellar, isConnected, navigate, openModal, router, selectedRoute, setAuthError, setSignedResult, signMessageAsync, stellarWallet.address, stellarWallet.network]);

  useEffect(() => {
    if (!consSession && isConnected && address) void Get_Balance();
  }, [isConnected, address, consSession]);

  useEffect(() => {
    if (!consSession && stellarWallet.address) void loadStellarBalance(stellarWallet.address);
  }, [stellarWallet.address, consSession]);

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
            <div className={UI_Comp__css.brand_mark}><CordyLogo /></div>
            <div><p className={UI_Comp__css.eyebrow}>CORDY MINIKIT</p><h2 id="wallet-modal-title">Wallet connected</h2></div>
            <button className={UI_Comp__css.close_button} type="button" onClick={closeModal} aria-label="Close wallet dialog">×</button>
          </header>
          <div className={UI_Comp__css.connected_card}>
            <div className={UI_Comp__css.connected_heading}><span className={UI_Comp__css.connected_dot} /> {isStellar ? "Stellar wallet" : "EVM wallet"}<span className={UI_Comp__css.network_badge}>{connectedNetwork}</span></div>
            {!consSession && <>
              <div className={UI_Comp__css.balance_value}>{connectedBalance}</div>
              <p className={UI_Comp__css.muted}>{isStellar ? "Native balance" : "Token balance"}</p>
            </>}
            <div className={UI_Comp__css.address_row}><span>Address</span><code title={connectedAddress || ""}>{truncateAddress(connectedAddress, 12, 8)}</code></div>
            {authError && <p className={UI_Comp__css.error_message} role="status">{authError}</p>}
            {isStellar && stellarError && <p className={UI_Comp__css.error_message} role="alert">{stellarError}</p>}
          </div>
          {consSession && !authError && <p className={UI_Comp__css.loading_notice} role="status">Check your wallet and approve the sign-in request to confirm ownership. This signs a message only; it does not send a transaction.</p>}
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
          <div className={UI_Comp__css.brand_mark}><CordyLogo /></div>
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
                    if (!consSession) void handleLoadStellarBalance(accountId);
                  }}
                  onStatusChange={({ isPending, error, address: accountId, network }) => {
                    setStellarLoading(isPending);
                    setStellarError(error);
                    if (accountId) {
                      setStellarWallet((current) => ({ ...current, address: accountId }));
                      if (!consSession) void handleLoadStellarBalance(accountId);
                    }
                    if (network) setStellarWallet((current) => ({ ...current, network }));
                  }}
                />}
              </div>
              <p className={UI_Comp__css.panel_note}>{selectedRoute === "walletconnect" ? "Scan the QR code with your mobile wallet to continue." : selectedRoute === "stellar" ? "Freighter will ask you to approve access to your Stellar account." : "Choose an installed browser wallet to continue."}</p>
            </div>
          </>
        )}

        {(errorMsg || stellarError || authError) && <div className={UI_Comp__css.error_message} role="alert">{errorMsg || stellarError || authError}</div>}
        <div className={UI_Comp__css.modal_footer}><span>Connecting only shares your public wallet address.</span>{footer}</div>
      </section>
    </div>
  );
}
