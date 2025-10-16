"use client";
import { UI_Comp__css } from "../css";
import { WalletButton, getTokenBalance } from "../controllers";
import { useWalletModal } from "../wagmi__providers";
import { useAccount, useDisconnect} from "wagmi";
import { FaUser } from 'react-icons/fa';
import { useState, useEffect } from "react";
import pkg from "../package.json";
import links from "../config/links.json";

export default function UI_Comp() {
  const { closeModal } = useWalletModal();
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | undefined>();
  const [balance, setBalance] = useState("");
  const [symbol, setSymbol] = useState("");

  useEffect(() => {
    
    Get_Balance();

  }, [balance]);

  const Get_Balance = async () => {

    if (!address || !process.env.NEXT_PUBLIC_TOKENADDRESS) return;

    const { balance, symbol } = await getTokenBalance(address, process.env.NEXT_PUBLIC_TOKENADDRESS);

    setBalance(balance);
    setSymbol(symbol);
    return;
  };
  
  if (isConnected) {
  
  if (balance === "") {
    Get_Balance();
  }
  
  return(
    <div className={UI_Comp__css.container}>
      <div className={UI_Comp__css.connector}>
        <p className={UI_Comp__css.closed} onClick={closeModal}>✕</p>
        {isConnected && (
          <div className={UI_Comp__css.info}>
            {balance ? (
              <span>
                <FaUser size={70} />
                <p style={{color: "#0f0"}}>Connected</p>
                <p style={{color: "#0ff"}}>Balance: {Number(balance).toFixed(2)} {symbol}</p>
                <p style={{color: "#ff0"}}>{address}</p>
              </span>
              
            ) : (
                <p style={{color: "var(--foreground_wagmi)"}}>Loading balance...</p>
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

  return (
    <div className={UI_Comp__css.container}>
      <div className={UI_Comp__css.connector}>
        <p className={UI_Comp__css.closed} onClick={closeModal}>✕</p>
        <h2>Connect Your Wallet</h2>

        <div>
            <h3>{loading ? "Loading..." : ""}</h3>
            <WalletButton
                onStatusChange={({ isPending, error }: { isPending: boolean; error?: string }) => {
                setLoading(isPending);
                setErrorMsg(error);
                }}
            />      
            <p>{errorMsg}</p>
        </div>
        <a href={links.NPM_Pack_links}>
          Powered By CordyStackX | Version {pkg.version}
        </a>
      </div>
    </div>
  );
}
