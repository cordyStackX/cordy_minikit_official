## [3.0.2] - 2026-10-27

### Removed

- Removed the confusing `jwt_confirm()` alias. Use `cordy.jwt_verify()` for session checks.

### Changed

- Read public WalletConnect, EVM, and Stellar runtime settings from the JSON passed to `ProvidersClientWrapper` instead of `NEXT_PUBLIC_*` variables.

## [3.0.1] - 2026-10-27

### Removed

- Remove the deprecated `AirDrop_Faucet` helper from the package source and public exports.

### Changed

- Read public WalletConnect, EVM, and Stellar runtime settings from the JSON passed to `ProvidersClientWrapper` instead of `NEXT_PUBLIC_*` variables.

## [3.0.0] - 2026-10-27

### Added

- Added the unified `cordy.*` API: `configure`, `jwt_verify`, `jwt_disconnect`, `balance`, `transfer`, and `swap`.
- Added `cordy.transfer()` for configured EVM ERC-20 and Stellar assets, including optional Stellar memos.
- Added `cordy.balance()` for native EVM balances, configured EVM tokens, and Stellar assets.
- Added `cordy.swap()` for configured EVM and Stellar asset pairs.
- Added experimental `cordy.bridge(amount, from, to, recipient)` for test USDT between BOT Chain Testnet and Ethereum Sepolia.
- Added the `jwt_session` and `navigate` options to the wallet connection button.
- Added JSON asset configuration through `ProvidersClientWrapper` and `cordy.configure()`.
- Added BOT Chain Testnet ↔ Sepolia bridge examples to the demo and Sepolia to the default EVM wallet chain list.

### Deprecated

- Deprecated `jwt_confirm()` in favor of `cordy.jwt_verify()`; the alias is removed in 3.0.2.
- Deprecated `CordyStackTrans()` and `CordyStackTransStellar()` in favor of `cordy.transfer()`.
- Deprecated `getTokenBalance()` in favor of `cordy.balance()`.

### Notes

- `cordy.bridge()` is experimental and intended for testnet evaluation only. It is not production-ready and does not support mainnet or Stellar bridging.
- Bridge deposits may require a separate USDT approval transaction, and destination delivery is asynchronous.
- Deprecated APIs remain available for compatibility in 3.0.0. The unused `AirDrop_Faucet` helper is scheduled for removal in 3.0.1.

## [2.0.6] - 2026-06-26

  ### Changed

  - Improved `WalletButton` mobile wallet support by keeping mobile-capable connectors available without requiring a desktop injected provider.
  - Improved `StellarWalletButton` Freighter handling for mobile users with provider availability checks and clearer fallback messaging.

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
  - Apps using Stellar features must configure the Horizon endpoint, network passphrase, and assets in `ProvidersClientWrapper` JSON.
