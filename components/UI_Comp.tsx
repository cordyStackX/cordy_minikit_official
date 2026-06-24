"use client";
import { UI_Comp__css } from "../css";
import { WalletButton, getTokenBalance, StellarWalletButton, loadStellarBalance, useDisconnectWallets } from "../controllers";
import { useWalletModal, useStellarWallet } from "../wagmi__providers";
import { useAccount } from "wagmi";
import { FaUser } from 'react-icons/fa';
import { useState, useEffect } from "react";
import pkg from "../package.json";
import links from "../config/links.json";
const ACTIVE_WALLET_SESSION_KEY = "cordy_minikit_active_wallet_session";                                                                                                           
                                                                                                                    
export default function UI_Comp() {
  const { closeModal } = useWalletModal();
  const { stellarWallet, setStellarWallet } = useStellarWallet();
  const { isConnected, address, chain } = useAccount();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | undefined>();
  const [balance, setBalance] = useState("");
  const [symbol, setSymbol] = useState("");
  const [stellarLoading, setStellarLoading] = useState(false);
  const [stellarError, setStellarError] = useState<string | undefined>();
  const {                                                                                                          
    disconnectEVM,                                                                                                 
    disconnectStellar,                                                                                             
    // disconnectAll,                                                                                             
  } = useDisconnectWallets(); 

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

 const handleLoadStellarBalance = async (accountId: string) => {                                                    
    setStellarError(undefined);                                                                                      
                                                                                                                     
    try {                                                                                                            
      const result = await loadStellarBalance(accountId);                                                            
                                                                                                                     
      setStellarWallet((current) => ({                                                                               
        ...current,                                                                                                  
        address: result.address,                                                                                     
        network: result.network,                                                                                     
        balance: result.balance,                                                                                     
      }));                                                                                                           
                                                                                                                     
      if (typeof window !== "undefined") {                                                                           
        window.localStorage.setItem(ACTIVE_WALLET_SESSION_KEY, "stellar");                                           
      }                                                                                                              
    } catch (err) {                                                                                                  
      const message =                                                                                                
        err instanceof Error ? err.message : "Failed to load Stellar balance";                                       
                                                                                                                     
      console.error("Failed to load Stellar balance:", err);                                                         
      setStellarError(message);                                                                                      
                                                                                                                     
      setStellarWallet((current) => ({                                                                               
        ...current,                                                                                                  
        balance: "0",                                                                                                
      }));                                                                                                           
    }                                                                                                                
  };   

  const truncateAddress = (value?: string | null, head = 8, tail = 4) => {
    if (!value) return "";
    if (value.length <= head + tail + 3) return value;
    return `${value.slice(0, head)}...${value.slice(-tail)}`;
  };
  
  // EVM
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
        <button                                                                                                            
          style={{ width: "230px" }}                                                                                       
          onClick={async () => {                                                                                           
            const success = await disconnectEVM();                                                                         
            console.log("EVM disconnect:", success);                                                                       
          }}                                                                                                               
        >                                                                                                                  
          DisConnect                                                                                                       
        </button>
        <a style={{ marginTop: "2rem" }} href={links.NPM_Pack_links}>
          Powered By CordyStackX | Version {pkg.version}
        </a>
      </div>
    </div>
  );
  }

  //Non - EVM
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
                  <p style={{color: "#0ff"}}>Balance: {stellarWallet.balance ?? "0"} XLM</p>
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
          <button style={{ width: "230px" }} 
            onClick={async () => {                                                                                           
              const success = await disconnectStellar();                                                                         
              console.log("EVM disconnect:", success);                                                                       
            }}
          >DisConnect</button>
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
                void handleLoadStellarBalance(address);
              }}
              onStatusChange={({ isPending, error, address, network }) => {
                setStellarLoading(isPending);
                setStellarError(error);
                if (address) setStellarWallet((current) => ({ ...current, address }));
                if (network) {
                  setStellarWallet((current) => ({ ...current, network }));
                }
                if (address) void handleLoadStellarBalance(address);
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
