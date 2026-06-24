"use client";                                                                                                      
                                                                                                                     
import { useCallback, useEffect, useState } from "react";                                                          
import { useAccount, useDisconnect } from "wagmi";                                                                 
import { useWalletModal, useStellarWallet } from "../wagmi__providers";                                            
import getTokenBalance from "./Get_Balance";                                                                   
import loadStellarBalance from "./loadStellarBalance";                                                             
                                                                                                                    
const ACTIVE_WALLET_SESSION_KEY = "cordy_minikit_active_wallet_session";                                           
export type WalletContext = "EVM" | "Non_EVM" | "MULTI" | "NONE";     


export default function useWalletStatus() {                                                                        
  const { closeModal } = useWalletModal();                                                                         
  const { stellarWallet, setStellarWallet, clearStellarWallet } =                                                  
    useStellarWallet();                                                                                            
                                                                                                                    
  const { isConnected, address: evmAddress, chain } = useAccount();                                                
  const { disconnectAsync } = useDisconnect();                                                                     
                                                                                                                    
  const [evmBalance, setEvmBalance] = useState("");                                                                
  const [evmSymbol, setEvmSymbol] = useState("");                                                                  
  const [stellarError, setStellarError] = useState<string | undefined>();                                          
  const [evmError, setEvmError] = useState<string | undefined>();
  
  const walletContext =                                                                                              
  isConnected && stellarWallet.address                                                                             
    ? "MULTI"                                                                                                      
    : isConnected                                                                                                  
      ? "EVM"                                                                                                      
      : stellarWallet.address                                                                                      
        ? "Non-EVM"                                                                                                
        : "NONE";
                                                                                                                    
  const refreshEvmBalance = useCallback(async (): Promise<boolean> => {                                            
    if (!evmAddress) return false;                                                                                 
                                                                                                                    
    try {                                                                                                          
      setEvmError(undefined);                                                                                      
                                                                                                                    
      const result = await getTokenBalance(evmAddress);                                                            
                                                                                                                    
      setEvmBalance(result.balance);                                                                               
      setEvmSymbol(result.symbol);                                                                                 
                                                                                                                    
      return true;                                                                                                 
    } catch (err) {                                                                                                
      const message =                                                                                              
        err instanceof Error ? err.message : "Failed to load EVM balance";                                         
                                                                                                                    
      console.error("Failed to load EVM balance:", err);                                                           
      setEvmError(message);                                                                                        
                                                                                                                    
      return false;                                                                                                
    }                                                                                                              
  }, [evmAddress]);                                                                                                
                                                                                                                    
  const refreshStellarBalance = useCallback(                                                                       
    async (accountId?: string): Promise<boolean> => {                                                              
      const stellarAddress = accountId || stellarWallet.address;                                                   
      if (!stellarAddress) return false;                                                                           
                                                                                                                    
      try {                                                                                                        
        setStellarError(undefined);                                                                                
                                                                                                                    
        const result = await loadStellarBalance(stellarAddress);                                                   
                                                                                                                    
        setStellarWallet((current) => ({                                                                           
          ...current,                                                                                              
          address: result.address,                                                                                 
          network: result.network,                                                                                 
          balance: result.balance,                                                                                 
        }));                                                                                                       
                                                                                                                    
        if (typeof window !== "undefined") {                                                                       
          window.localStorage.setItem(ACTIVE_WALLET_SESSION_KEY, "stellar");                                       
        }                                                                                                          
                                                                                                                    
        return true;                                                                                               
      } catch (err) {                                                                                              
        const message =                                                                                            
          err instanceof Error ? err.message : "Failed to load Stellar balance";                                   
                                                                                                                    
        console.error("Failed to load Stellar balance:", err);                                                     
        setStellarError(message);                                                                                  
                                                                                                                    
        setStellarWallet((current) => ({                                                                           
          ...current,                                                                                              
          balance: "0",                                                                                            
        }));                                                                                                       
                                                                                                                    
        return false;                                                                                              
      }                                                                                                            
    },                                                                                                             
    [stellarWallet.address, setStellarWallet]                                                                      
  );                                                                                                               
                                                                                                                    
  const refreshBalances = useCallback(async (): Promise<boolean> => {                                              
    const results = await Promise.all([                                                                            
      refreshEvmBalance(),                                                                                         
      refreshStellarBalance(),                                                                                     
    ]);                                                                                                            
                                                                                                                    
    return results.some(Boolean);                                                                                  
  }, [refreshEvmBalance, refreshStellarBalance]);                                                                  
                                                                                                                    
  const disconnectEVM = async (): Promise<boolean> => {                                                            
    try {                                                                                                          
      await disconnectAsync();                                                                                     
                                                                                                                    
      setEvmBalance("");                                                                                           
      setEvmSymbol("");                                                                                            
                                                                                                                    
      if (typeof window !== "undefined") {                                                                         
        window.localStorage.removeItem(ACTIVE_WALLET_SESSION_KEY);                                                 
      }                                                                                                            
                                                                                                                    
      closeModal();                                                                                                
      return true;                                                                                                 
    } catch (err) {                                                                                                
      console.error("Failed to disconnect EVM wallet:", err);                                                      
      return false;                                                                                                
    }                                                                                                              
  };                                                                                                               
                                                                                                                    
  const disconnectStellar = async (): Promise<boolean> => {                                                        
    try {                                                                                                          
      clearStellarWallet();                                                                                        
                                                                                                                    
      if (typeof window !== "undefined") {                                                                         
        window.localStorage.removeItem(ACTIVE_WALLET_SESSION_KEY);                                                 
      }                                                                                                            
                                                                                                                    
      closeModal();                                                                                                
      return true;                                                                                                 
    } catch (err) {                                                                                                
      console.error("Failed to disconnect Stellar wallet:", err);                                                  
      return false;                                                                                                
    }                                                                                                              
  };                                                                                                               
                                                                                                                    
  const disconnectAll = async (): Promise<boolean> => {                                                            
    try {                                                                                                          
      await disconnectAsync();                                                                                     
      clearStellarWallet();                                                                                        
                                                                                                                    
      setEvmBalance("");                                                                                           
      setEvmSymbol("");                                                                                            
                                                                                                                    
      if (typeof window !== "undefined") {                                                                         
        window.localStorage.removeItem(ACTIVE_WALLET_SESSION_KEY);                                                 
      }                                                                                                            
                                                                                                                    
      closeModal();                                                                                                
      return true;                                                                                                 
    } catch (err) {                                                                                                
      console.error("Failed to disconnect wallets:", err);                                                         
      return false;                                                                                                
    }                                                                                                              
  };                                                                                                               
                                                                                                                    
  useEffect(() => {                                                                                                
    if (isConnected && evmAddress) {                                                                               
      void refreshEvmBalance();                                                                                    
    }                                                                                                              
  }, [isConnected, evmAddress, refreshEvmBalance]);                                                                
                                                                                                                    
  useEffect(() => {                                                                                                
    if (stellarWallet.address) {                                                                                   
      void refreshStellarBalance(stellarWallet.address);                                                           
    }                                                                                                              
  }, [stellarWallet.address, refreshStellarBalance]);                                                              
                                                                                                                    
  return {                                                                                                           
    context: walletContext,                                                                                          
                                                                                                                    
    evm: {                                                                                                           
      isConnected,                                                                                                   
      address: evmAddress,                                                                                           
      chain,                                                                                                         
      balance: evmBalance,                                                                                           
      symbol: evmSymbol,                                                                                             
      error: evmError,                                                                                               
    },                                                                                                               
                                                                                                                    
    stellar: {                                                                                                       
      isConnected: Boolean(stellarWallet.address),                                                                   
      address: stellarWallet.address,                                                                                
      network: stellarWallet.network,                                                                                
      balance: stellarWallet.balance,                                                                                
      error: stellarError,                                                                                           
    },                                                                                                               
                                                                                                                    
    refreshEvmBalance,                                                                                               
    refreshStellarBalance,                                                                                           
    refreshBalances,                                                                                                 
                                                                                                                    
    disconnectEVM,                                                                                                   
    disconnectStellar,                                                                                               
    disconnectAll,                                                                                                   
  };                                                                                                              
}