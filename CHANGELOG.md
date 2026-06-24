## [2.0.0] - 2026-06-24                                                                                            
                                                                                                                     
  ### 🎉 Major Release                                                                                               
                                                                                                                     
  Cordy MiniKit `2.0.0` introduces Non-EVM wallet support, starting with Stellar / Soroban integration through       
Freighter. This release expands the toolkit beyond EVM-only apps and adds reusable wallet status, balance, and       
disconnect controllers.                                                                                              
                                                                                                                     
  ### Added                                                                                                          
                                                                                                                     
  - Added **Non-EVM wallet support** for Stellar / Soroban.                                                          
  - Added **Freighter wallet connection** via `StellarWalletButton`.                                                 
  - Added **native Stellar / XLM transfer helper** via `CordyStackTransStellar`.                                     
  - Added **Stellar balance loading** through Horizon.                                                               
  - Added **Soroban RPC and Stellar Horizon environment support**:                                                   
    - `NEXT_PUBLIC_STELLAR_RPC`                                                                                      
    - `NEXT_PUBLIC_STELLAR_HORIZON`                                                                                  
    - `NEXT_PUBLIC_STELLAR_CONTRACT_ID`                                                                              
    - `NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE`                                                                       
  - Added `useWalletStatus()` hook for unified wallet state management.                                              
  - Added wallet context detection:                                                                                  
    - `EVM`                                                                                                          
    - `Non_EVM`                                                                                                      
    - `MULTI`                                                                                                        
    - `NONE`                                                                                                         
  - Added `useDisconnectWallets()` hook with:                                                                        
    - `disconnectEVM()`                                                                                              
    - `disconnectStellar()`                                                                                          
    - `disconnectAll()`                                                                                              
  - Added refresh helpers:                                                                                           
    - `refreshEvmBalance()`                                                                                          
    - `refreshStellarBalance()`                                                                                      
    - `refreshBalances()`                                                                                            
  - Added optional `disableWalletStatus` prop for `UI_Comp`.                                                         
  - Added active wallet session tracking for EVM and Stellar wallets.                                                
                                                                                                                     
  ### Changed                                                                                                        
                                                                                                                     
  - Improved `UI_Comp` to support both EVM and Stellar wallet flows.                                                 
  - Improved `ConnectWalletBT` to display either EVM or Stellar balances.                                            
  - Improved wallet connection architecture by separating UI, modal control, wallet status, and disconnect logic.    
  - Improved TypeScript support for new wallet status and Non-EVM APIs.                                              
  - Updated README with Stellar / Soroban usage examples and Non-EVM documentation.                                  
                                                                                                                     
  ### Documentation                                                                                                  
                                                                                                                     
  - Added Non-EVM / Stellar announcement.                                                                            
  - Added `CordyStackTransStellar` usage guide.                                                                      
  - Added `useWalletStatus()` API documentation.                                                                     
  - Added `useDisconnectWallets()` API documentation.                                                                
  - Added `WalletButton` and `StellarWalletButton` manual sections.                                                  
  - Added ERC20 transaction helper conditions.                                                                       
  - Updated architecture notes to reflect EVM + Non-EVM support.                                                     
                                                                                                                     
  ### Notes                                                                                                          
                                                                                                                     
  - This is a major release because Cordy MiniKit now supports both EVM and Non-EVM wallet workflows.                
  - Apps using Stellar features must configure the relevant `NEXT_PUBLIC_STELLAR_*` environment variables.