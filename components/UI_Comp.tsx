"use client";
import { UI_Comp__css } from "../css";
import { WalletButton, getTokenBalance, StellarWalletButton } from "../controllers";
import { useWalletModal } from "../wagmi__providers";
import { useAccount, useDisconnect} from "wagmi";
import { FaUser } from 'react-icons/fa';
import { useState, useEffect } from "react";
import pkg from "../package.json";
import links from "../config/links.json";
import { isConnected as stellarIsConnected, getAddress as stellarGetAddress, getNetworkDetails as stellarGetNetworkDetails } from "@stellar/freighter-api";
import { Horizon } from "@stellar/stellar-sdk";

const STELLAR_ADDRESS_KEY = "cordy_minikit:stellar_address";
const STELLAR_NETWORK_KEY = "cordy_minikit:stellar_network";
const STELLAR_RPC = process.env.NEXT_PUBLIC_STELLAR_RPC || "https://soroban-testnet.stellar.org";

export default function UI_Comp() {
  const { closeModal } = useWalletModal();
  const { isConnected, address, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | undefined>();
  const [balance, setBalance] = useState("");
  const [symbol, setSymbol] = useState("");
  const [stellarAddress, setStellarAddress] = useState<string | null>(null);
  const [stellarNetwork, setStellarNetwork] = useState<string | undefined>();
  const [stellarLoading, setStellarLoading] = useState(false);
  const [stellarError, setStellarError] = useState<string | undefined>();
  const [stellarBalance, setStellarBalance] = useState<string>("0");

  useEffect(() => {
    if (isConnected && address) {
      Get_Balance();
    }
  }, [isConnected, address]);

  useEffect(() => {
    const hydrateStellar = async () => {
      const storedAddress = window.localStorage.getItem(STELLAR_ADDRESS_KEY);
      const storedNetwork = window.localStorage.getItem(STELLAR_NETWORK_KEY);

      if (storedAddress) {
        setStellarAddress(storedAddress);
        setStellarNetwork(storedNetwork || undefined);
        return;
      }

      try {
        const connected = await stellarIsConnected();
        if (!connected.isConnected) return;

        const account = await stellarGetAddress();
        const networkDetails = await stellarGetNetworkDetails();

        setStellarAddress(account.address);
        setStellarNetwork(networkDetails.network || "Stellar");
        window.localStorage.setItem(STELLAR_ADDRESS_KEY, account.address);
        window.localStorage.setItem(STELLAR_NETWORK_KEY, networkDetails.network || "Stellar");
        await loadStellarBalance(account.address);
      } catch (err) {
        console.error("Failed to hydrate Stellar wallet state:", err);
      }
    };

    void hydrateStellar();
  }, []);

  const Get_Balance = async () => {

    if (!address) return;

    const { balance, symbol } = await getTokenBalance(address);

    setBalance(balance);
    setSymbol(symbol);
    return;
  };

  const loadStellarBalance = async (accountId: string) => {
    try {
      const server = new Horizon.Server(STELLAR_RPC);
      const account = await server.loadAccount(accountId);
      const native = account.balances.find((item) => item.asset_type === "native");
      setStellarBalance(native?.balance ?? "0");
    } catch (err) {
      console.error("Failed to load Stellar balance:", err);
      setStellarBalance("0");
    }
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

  if (stellarAddress) {
    return(
      <div className={UI_Comp__css.container}>
        <div className={UI_Comp__css.connector}>
          <p className={UI_Comp__css.closed} onClick={closeModal}>✕</p>
          <div className={UI_Comp__css.info}>
            <FaUser size={70} />
            <p style={{color: "#0f0"}}>Connected</p>
            <p style={{color: "#2f9"}}>Network: {stellarNetwork || "Stellar"}</p>
            <p style={{color: "#0ff"}}>Balance: {Number(stellarBalance).toFixed(2)} XLM</p>
            <p style={{color: "#ff0"}}>{stellarAddress}</p>
            {stellarError ? <p style={{color: "#f55"}}>{stellarError}</p> : null}
          </div>
          <button onClick={() => {
            closeModal();
            setStellarAddress(null);
            setStellarNetwork(undefined);
            setStellarError(undefined);
            window.localStorage.removeItem(STELLAR_ADDRESS_KEY);
            window.localStorage.removeItem(STELLAR_NETWORK_KEY);
          }}>DisConnect</button>
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

        <div>
            
            {loading || stellarLoading ? (
              <span className={UI_Comp__css.blockchain_loader}>
                <span className={UI_Comp__css.node}></span>
                <span className={UI_Comp__css.node}></span>
                <span className={UI_Comp__css.node}></span>
              </span>
            ) : null}
            <WalletButton
                onStatusChange={({ isPending, error }: { isPending: boolean; error?: string }) => {
                setLoading(isPending);
                setErrorMsg(error);
                }}
            />
            <StellarWalletButton
              onConnect={(address) => {
                setStellarAddress(address);
                window.localStorage.setItem(STELLAR_ADDRESS_KEY, address);
                void loadStellarBalance(address);
                closeModal();
              }}
              onStatusChange={({ isPending, error, address, network }) => {
                setStellarLoading(isPending);
                setStellarError(error);
                if (address) setStellarAddress(address);
                if (address) window.localStorage.setItem(STELLAR_ADDRESS_KEY, address);
                if (network) {
                  setStellarNetwork(network);
                  window.localStorage.setItem(STELLAR_NETWORK_KEY, network);
                }
                if (address) void loadStellarBalance(address);
              }}
            />
            <p>{errorMsg}</p>
            <p>{stellarError}</p>
        </div>
        <a href={links.NPM_Pack_links}>
          Powered By CordyStackX | Version {pkg.version}
        </a>
      </div>
    </div>
  );
}
