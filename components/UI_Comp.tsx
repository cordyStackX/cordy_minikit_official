"use client";
import { UI_Comp__css } from "../css";
import { WalletButton, getTokenBalance, StellarWalletButton } from "../controllers";
import { useWalletModal, useStellarWallet } from "../wagmi__providers";
import { useAccount, useDisconnect} from "wagmi";
import { FaUser } from 'react-icons/fa';
import { useState, useEffect } from "react";
import pkg from "../package.json";
import links from "../config/links.json";
import { Horizon } from "@stellar/stellar-sdk";

const STELLAR_RPC = process.env.NEXT_PUBLIC_STELLAR_RPC || "https://soroban-testnet.stellar.org";
const STELLAR_HORIZON =
  process.env.NEXT_PUBLIC_STELLAR_HORIZON || "https://horizon-testnet.stellar.org";

export default function UI_Comp() {
  const { closeModal } = useWalletModal();
  const { stellarWallet, setStellarWallet, clearStellarWallet } = useStellarWallet();
  const { isConnected, address, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | undefined>();
  const [balance, setBalance] = useState("");
  const [symbol, setSymbol] = useState("");
  const [stellarLoading, setStellarLoading] = useState(false);
  const [stellarError, setStellarError] = useState<string | undefined>();

  useEffect(() => {
    if (isConnected && address) {
      Get_Balance();
    }
  }, [isConnected, address]);

  useEffect(() => {
    if (stellarWallet.address) {
      void loadStellarBalance(stellarWallet.address);
    }
  }, [stellarWallet.address]);

  const Get_Balance = async () => {

    if (!address) return;

    const { balance, symbol } = await getTokenBalance(address);

    setBalance(balance);
    setSymbol(symbol);
    return;
  };

  const loadStellarBalance = async (accountId: string) => {
    try {
      const server = new Horizon.Server(STELLAR_HORIZON);
      const account = await server.loadAccount(accountId);
      const native = account.balances.find((item) => item.asset_type === "native");
      setStellarWallet((current) => ({
        ...current,
        balance: native?.balance ?? "0",
      }));
    } catch (err) {
      console.error("Failed to load Stellar balance:", err);
      setStellarWallet((current) => ({ ...current, balance: "0" }));
    }
  };

  const disconnectStellar = () => {
    closeModal();
    setStellarError(undefined);
    clearStellarWallet();
  };
  
  if (isConnected) {
  
  return(
    <div className={UI_Comp__css.container}>
      <div className={UI_Comp__css.connector}>
        <p className={UI_Comp__css.closed} onClick={closeModal}>✕</p>
        {isConnected && (
          <div className={UI_Comp__css.info}>
            {balance ? (
              <div>
                <FaUser size={70} />
                <p style={{color: "#0f0"}}>Connected</p>
                <p style={{color: "#2f9"}}>Network: {chain?.name || "Unknown"}</p>
                <p style={{color: "#0ff"}}>Balance: {Number(balance).toFixed(2)} {symbol}</p>
                <p style={{color: "#ff0"}}>{address}</p>
              </div>
              
            ) : (
                <span className={UI_Comp__css.blockchain_loader}>
                  <span className={UI_Comp__css.node}></span>
                  <span className={UI_Comp__css.node}></span>
                  <span className={UI_Comp__css.node}></span>
                </span>
            )}
            
          </div>
        )}
        
        <button onClick={() => {
          closeModal();
          disconnect();
        }}>DisConnect</button>
        <a href={links.NPM_Pack_links}>
          Powered By CordyStackX | Version {pkg.version}
        </a>

      </div>
    </div>
  );
  }

  if (stellarWallet.address) {
    return(
      <div className={UI_Comp__css.container}>
        <div className={UI_Comp__css.connector}>
          <p className={UI_Comp__css.closed} onClick={closeModal}>✕</p>
          <div className={UI_Comp__css.split_layout}>
            <div className={UI_Comp__css.left_column}>
              <div className={UI_Comp__css.info}>
                <div>
                  <FaUser size={70} />
                  <p style={{color: "#0f0"}}>Connected</p>
                  <p style={{color: "#2f9"}}>Network: {stellarWallet.network || "Stellar"}</p>
                  <p style={{color: "#0ff"}}>Balance: {Number(stellarWallet.balance || "0").toFixed(2)} XLM</p>
                  <p style={{color: "#ff0"}}>{stellarWallet.address}</p>
                  {stellarError ? <p style={{color: "#f55"}}>{stellarError}</p> : null}
                </div>
              </div>
              <button onClick={() => {
                disconnectStellar();
              }}>DisConnect</button>
            </div>
            <div className={UI_Comp__css.right_column}>
              {(loading || stellarLoading) ? (
                <span className={UI_Comp__css.blockchain_loader}>
                  <span className={UI_Comp__css.node}></span>
                  <span className={UI_Comp__css.node}></span>
                  <span className={UI_Comp__css.node}></span>
                </span>
              ) : null}
            </div>
          </div>
          <a href={links.NPM_Pack_links}>
            Powered By CordyStackX | Version {pkg.version}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={UI_Comp__css.container}>
      <div className={UI_Comp__css.connector}>
        <p className={UI_Comp__css.closed} onClick={closeModal}>✕</p>
        <h2>Connect Your Wallet</h2>
        <div className={UI_Comp__css.split_layout}>
          <div className={UI_Comp__css.left_column}>
            <WalletButton
              onStatusChange={({ isPending, error }: { isPending: boolean; error?: string }) => {
                setLoading(isPending);
                setErrorMsg(error);
              }}
            />
            <StellarWalletButton
              onConnect={(address) => {
                setStellarWallet((current) => ({ ...current, address }));
                void loadStellarBalance(address);
                closeModal();
              }}
              onStatusChange={({ isPending, error, address, network }) => {
                setStellarLoading(isPending);
                setStellarError(error);
                if (address) setStellarWallet((current) => ({ ...current, address }));
                if (network) {
                  setStellarWallet((current) => ({ ...current, network }));
                }
                if (address) void loadStellarBalance(address);
              }}
            />
            <p>{errorMsg}</p>
            <p>{stellarError}</p>
          </div>
          <div className={UI_Comp__css.right_column}>
            {loading || stellarLoading ? (
              <span className={UI_Comp__css.blockchain_loader}>
                <span className={UI_Comp__css.node}></span>
                <span className={UI_Comp__css.node}></span>
                <span className={UI_Comp__css.node}></span>
              </span>
            ) : null}
          </div>
        </div>
        <a href={links.NPM_Pack_links}>
          Powered By CordyStackX | Version {pkg.version}
        </a>
      </div>
    </div>
  );
}
