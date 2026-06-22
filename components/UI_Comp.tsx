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

  const truncateAddress = (value?: string | null, head = 8, tail = 4) => {
    if (!value) return "";
    if (value.length <= head + tail + 3) return value;
    return `${value.slice(0, head)}...${value.slice(-tail)}`;
  };
  
  if (isConnected) {
  
  return(
    <div className={UI_Comp__css.container}>
      <div className={UI_Comp__css.connector}>
        <p className={UI_Comp__css.closed} onClick={closeModal}>✕</p>
        <h2>Wallet Status</h2>
        <div className={UI_Comp__css.split_layout}>
          <div className={UI_Comp__css.left_column}>
            <h3>EVM Wallet</h3>
            <div className={UI_Comp__css.icon_wrap}>
              <FaUser size={70} />
            </div>
          </div>
          <div className={UI_Comp__css.right_column}>
            <h3>Status</h3>
            {balance ? (
              <div className={UI_Comp__css.info}>
                <div className={UI_Comp__css.status_stack}>
                  <p style={{color: "#0f0"}}>Connected</p>
                  <p style={{color: "#2f9"}}>Network: {chain?.name || "Unknown"}</p>
                  <p style={{color: "#0ff"}}>Balance: {Number(balance).toFixed(2)} {symbol}</p>
                  <p className={UI_Comp__css.address} style={{color: "#ff0"}} title={address || ""}>{truncateAddress(address)}</p>
                </div>
              </div>
            ) : (
              <span className={UI_Comp__css.blockchain_loader}>
                <span className={UI_Comp__css.node}></span>
                <span className={UI_Comp__css.node}></span>
                <span className={UI_Comp__css.node}></span>
              </span>
            )}
          </div>
        </div>
        <button style={{ width: "230px" }} onClick={() => {
          closeModal();
          disconnect();
        }}>DisConnect</button>
        <a style={{ marginTop: "2rem" }} href={links.NPM_Pack_links}>
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
          <h2>Wallet Status</h2>
          <div className={UI_Comp__css.split_layout}>
          <div className={UI_Comp__css.left_column}>
            <h3>Stellar Wallet</h3>
              <div className={UI_Comp__css.icon_wrap}>
                  <FaUser size={70} />
              </div>
            </div>
            <div className={UI_Comp__css.right_column}>
              <h3>Status</h3>
              {stellarWallet.balance ? (
                <div className={UI_Comp__css.status_stack}>
                  <p style={{color: "#0f0"}}>Connected</p>
                  <p style={{color: "#2f9"}}>Network: {stellarWallet.network || "Stellar"}</p>
                  <p style={{color: "#0ff"}}>Balance: {Number(stellarWallet.balance || "0").toFixed(2)} XLM</p>
                  <p className={UI_Comp__css.address} style={{color: "#ff0"}} title={stellarWallet.address || ""}>{truncateAddress(stellarWallet.address)}</p>
                  {stellarError ? <p style={{color: "#f55"}}>{stellarError}</p> : null}
                </div>
              ) : (
                <span className={UI_Comp__css.blockchain_loader}>
                  <span className={UI_Comp__css.node}></span>
                  <span className={UI_Comp__css.node}></span>
                  <span className={UI_Comp__css.node}></span>
                </span>
              )}
            </div>
          </div>
          <button style={{ width: "230px" }} onClick={() => {
            disconnectStellar();
          }}>DisConnect</button>
          <a style={{ marginTop: "2rem" }} href={links.NPM_Pack_links}>
            Powered By CordyStackX | Version {pkg.version}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={UI_Comp__css.container}>
      <div className={UI_Comp__css.connector}>
        {loading || stellarLoading ? (
          <span className={UI_Comp__css.blockchain_loader}>
            <span className={UI_Comp__css.node}></span>
            <span className={UI_Comp__css.node}></span>
            <span className={UI_Comp__css.node}></span>
          </span>
        ) : null}
        <p className={UI_Comp__css.closed} onClick={closeModal}>✕</p>
        <h2>Connect Your Wallet</h2>
        <div className={UI_Comp__css.split_layout}>
          <div className={UI_Comp__css.left_column}>
            <h3>EVM Wallets</h3>
            <WalletButton
              onStatusChange={({ isPending, error }: { isPending: boolean; error?: string }) => {
                setLoading(isPending);
                setErrorMsg(error);
              }}
            />
          </div>
          <div className={UI_Comp__css.right_column}>
            <h3>Non - EVM Wallets</h3>
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
          </div>
        </div>
        <p style={{ color: "#f00" }}>{errorMsg}</p>
        <p style={{ color: "#f00" }}>{stellarError}</p>
        <a style={{ marginTop: "2rem" }} href={links.NPM_Pack_links}>
          Powered By CordyStackX | Version {pkg.version}
        </a>
      </div>
    </div>
  );
}
