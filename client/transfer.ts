"use client";

import { Asset, BASE_FEE, Horizon, Memo, Operation, StrKey, TransactionBuilder } from "@stellar/stellar-sdk";
import { getNetworkDetails, requestAccess, signTransaction as freighterSignTransaction } from "@stellar/freighter-api";
import { BrowserProvider, Contract, formatUnits, isAddress, JsonRpcProvider, parseUnits, type Eip1193Provider } from "ethers";
import { getActiveWagmiConfig } from "../config/walletConfig";
import { readTokenBalance } from "../controllers/Get_Balance";
import loadStellarBalance from "../controllers/loadStellarBalance";
import tokenAbi from "../config/ERC20_ABI.json";
import { setCordyRuntimeConfig } from "./runtimeConfig";
import type { CordyAssetsConfig, EvmAssetConfig, EvmNetworkConfig, StellarAssetConfig } from "./runtimeConfig";

export type { CordyAssetsConfig, EvmAssetConfig, EvmNetworkConfig, StellarAssetConfig, StellarNetworkConfig } from "./runtimeConfig";

const ACTIVE_WALLET_SESSION_KEY = "cordy_minikit_active_wallet_session";
const STELLAR_WALLET_STORAGE_KEY = "cordy_minikit_stellar_wallet";

export type CordyTransferOptions = {
  /** Asset symbol from the configured JSON registry. */
  asset?: string;
  memo?: string;
};

export type CordyTransferResult = {
  success: boolean;
  asset?: string;
  network?: "evm" | "stellar";
  transactionHash?: string;
  error?: string;
};

export type CordyBalanceOptions = {
  /** Asset symbol from the configured JSON registry. Defaults to the first configured EVM token or Stellar XLM. */
  asset?: string;
};

export type CordyBalanceResult = {
  success: boolean;
  network?: string;
  balance?: string;
  asset?: string;
  error?: string;
};

export type CordySwapResult = {
  success: boolean;
  network?: "evm" | "stellar";
  from?: string;
  to?: string;
  amountIn?: string;
  estimatedAmountOut?: string;
  transactionHash?: string;
  error?: string;
};

export type CordyBridgeSide = "internal" | "external";

export type CordyBridgeResult = {
  success: boolean;
  asset?: string;
  from?: CordyBridgeSide;
  to?: CordyBridgeSide;
  fromNetwork?: string;
  toNetwork?: string;
  amount?: string;
  approvalTransactionHash?: string;
  transactionHash?: string;
  status?: "submitted";
  error?: string;
};

// First test route: BOT Chain Testnet <-> Ethereum Sepolia, USDT only.
const BOT_TESTNET_CHAIN_ID = 968;
const SEPOLIA_CHAIN_ID = 11155111;
const BOT_TESTNET_BRIDGE_ROUTER = "0x6239404Aa276ba68486E2Fa40E90CDd36ff8ec3A";
const BOT_TESTNET_USDT = "0x75edC9335175Fc0552D51D48439F229c10420fe3";
const SEPOLIA_BRIDGE_GATEWAY = "0xc83AE6F73e8918750b87DD001E36093A1AB7b272";
const SEPOLIA_USDT = "0x7B1e05a39adF207a759EAf89E867dBcC1C615130";
const USDT_RESOURCE_ID = "0xac589789ed8c9d2c61f17b13369864b5f181e58eba230a6ee4ec4c3e7750cd1d";
const BRIDGE_ERC20_ABI = [
  "function allowance(address owner,address spender) view returns (uint256)",
  "function approve(address spender,uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
];
const BOT_BRIDGE_ABI = [
  "function deposit(uint256 destinationChainId,bytes32 resourceId,address recipient,uint256 amount) payable",
];

let configuredAssets: CordyAssetsConfig | undefined;

export function configureCordyAssets({ assets }: { assets: CordyAssetsConfig }): void {
  if (!assets || (assets.networks !== undefined && !Array.isArray(assets.networks)) ||
    (assets.evm !== undefined && !Array.isArray(assets.evm)) ||
    (assets.stellar !== undefined && !Array.isArray(assets.stellar))) {
    throw new Error('Cordy Minikit: "networks", "evm", and "stellar" must be arrays when provided.');
  }
  configuredAssets = {
    networks: (assets.networks ?? []).map((network) => ({ ...network, nativeCurrency: { ...network.nativeCurrency } })),
    evm: (assets.evm ?? []).map((asset) => ({ ...asset })),
    stellar: (assets.stellar ?? []).map((asset) => ({ ...asset })),
    walletConnectProjectId: assets.walletConnectProjectId,
    stellarNetwork: assets.stellarNetwork ? { ...assets.stellarNetwork } : undefined,
  };
  setCordyRuntimeConfig(configuredAssets);
}

function requireStellarNetwork() {
  const network = configuredAssets?.stellarNetwork;
  if (!network?.horizonUrl || !network.networkPassphrase || !configuredAssets?.stellar?.length) {
    throw new Error("Stellar is not configured. Add stellarNetwork and Stellar assets to the JSON passed to ProvidersClientWrapper.");
  }
  return network;
}

function getDefaultEvmChainId(): number | undefined {
  return configuredAssets?.networks?.[0]?.chainId;
}

function normalizedAmount(amount: number | string): string {
  const value = String(amount).trim();
  if (!/^\d+(\.\d+)?$/.test(value) || !Number.isFinite(Number(value)) || Number(value) <= 0) {
    throw new Error("Amount must be a positive decimal number.");
  }
  return value;
}

function resolveEvmAsset(requestedSymbol: string | undefined, chainId: number, networkName: string): EvmAssetConfig | undefined {
  const defaultChainId = getDefaultEvmChainId();
  const chainAssets = configuredAssets?.evm?.filter((asset) =>
    (asset.chainId ?? defaultChainId) === chainId,
  ) ?? [];
  const symbol = requestedSymbol || chainAssets.find((asset) => asset.contractAddress)?.symbol || chainAssets[0]?.symbol;
  if (!symbol) return undefined;
  const sameSymbol = (configuredAssets?.evm ?? []).filter(
    (asset) => asset.symbol.toLowerCase() === symbol.toLowerCase(),
  );
  const matchingNetwork = sameSymbol.find((asset) => (asset.chainId ?? defaultChainId) === chainId);
  if (sameSymbol.length > 0 && !matchingNetwork) {
    const chainIds = [...new Set(sameSymbol.map((asset) => asset.chainId ?? defaultChainId))].join(", ");
    throw new Error(`${symbol} is configured for chain ID ${chainIds}, but the connected wallet is on ${networkName} (chain ID ${chainId}). Switch networks or add an asset entry for this chain.`);
  }
  return matchingNetwork;
}

function resolveConfiguredEvmSwapAsset(symbol: string, chainId: number): EvmAssetConfig {
  const configuredChainId = getDefaultEvmChainId();
  const matches = (configuredAssets?.evm ?? []).filter(
    (asset) => asset.symbol.toLowerCase() === symbol.toLowerCase() &&
      (asset.chainId ?? configuredChainId) === chainId,
  );
  if (matches.length > 1) {
    throw new Error(`More than one ${symbol} asset is configured for chain ID ${chainId}. Keep one entry per asset and network.`);
  }
  if (matches.length === 1) return matches[0];

  throw new Error(`${symbol} is not configured for EVM chain ID ${chainId}. Add it to the assets JSON.`);
}

function resolveConfiguredStellarSwapAsset(symbol: string, networkPassphrase: string): StellarAssetConfig {
  const matches = (configuredAssets?.stellar ?? []).filter(
    (asset) => asset.symbol.toLowerCase() === symbol.toLowerCase() &&
      (!asset.networkPassphrase || asset.networkPassphrase === networkPassphrase),
  );
  if (matches.length !== 1) {
    throw new Error(matches.length > 1
      ? `More than one ${symbol} asset is configured for this Stellar network. Keep one entry per asset and network.`
      : `${symbol} is not configured for this Stellar network. Add it to the assets JSON before swapping.`);
  }
  return matches[0];
}

const V2_SWAP_ROUTER_ABI = [
  "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)",
  "function swapExactTokensForTokens(uint amountIn,uint amountOutMin,address[] calldata path,address to,uint deadline) external returns (uint[] memory amounts)",
  "function swapExactETHForTokens(uint amountOutMin,address[] calldata path,address to,uint deadline) external payable returns (uint[] memory amounts)",
  "function swapExactTokensForETH(uint amountIn,uint amountOutMin,address[] calldata path,address to,uint deadline) external returns (uint[] memory amounts)",
];
const ERC20_SWAP_ABI = [
  "function approve(address spender,uint256 amount) returns (bool)",
  "function allowance(address owner,address spender) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

type EvmSwapNetworkConfig = Pick<EvmNetworkConfig, "chainId" | "name" | "rpcUrl" | "swapRouterAddress" | "wrappedNativeTokenAddress">;

function resolveEvmSwapNetworkConfig(chainId: number): EvmSwapNetworkConfig | undefined {
  const registered = configuredAssets?.networks?.find((network) => network.chainId === chainId);
  if (registered) return registered;

  return undefined;
}

async function getEvmReadProvider(
  walletProvider: BrowserProvider,
  chainId: number,
  networkName: string,
  assetRpcUrl?: string,
): Promise<BrowserProvider | JsonRpcProvider> {
  const rpcUrl = assetRpcUrl || configuredAssets?.networks?.find((network) => network.chainId === chainId)?.rpcUrl;
  if (!rpcUrl) return walletProvider;

  const rpcProvider = new JsonRpcProvider(rpcUrl);
  let rpcNetwork;
  try {
    rpcNetwork = await rpcProvider.getNetwork();
  } catch {
    throw new Error(`Could not reach the configured EVM RPC endpoint for ${networkName}. Check its URL and availability.`);
  }
  if (Number(rpcNetwork.chainId) !== chainId) {
    throw new Error(`The configured EVM RPC is on chain ID ${rpcNetwork.chainId}, but the wallet is on ${networkName} (chain ID ${chainId}). Use an RPC for the connected network.`);
  }
  return rpcProvider;
}

function getActiveWallet(): "evm" | "stellar" {
  if (typeof window === "undefined") throw new Error("Transfers must be started in the browser.");
  const selected = window.localStorage.getItem(ACTIVE_WALLET_SESSION_KEY);
  if (selected === "stellar") return "stellar";
  if (selected === "evm") return "evm";

  const walletConfig = getActiveWagmiConfig();
  const current = walletConfig.state.current;
  if (current && walletConfig.state.connections.has(current)) return "evm";

  try {
    const stored = JSON.parse(window.localStorage.getItem(STELLAR_WALLET_STORAGE_KEY) || "null") as { address?: string } | null;
    if (stored?.address) return "stellar";
  } catch {
    // Ignore invalid stale wallet state and report that no wallet is active below.
  }
  throw new Error("Connect an EVM or Stellar wallet first.");
}

async function bridgeEvm(
  amount: string,
  from: CordyBridgeSide,
  to: CordyBridgeSide,
  recipient: string,
): Promise<CordyBridgeResult> {
  if (from !== "internal" && from !== "external") throw new Error("Source must be internal or external.");
  if (to !== "internal" && to !== "external") throw new Error("Destination must be internal or external.");
  if (from === to) throw new Error("Choose different source and destination sides.");
  if (!isAddress(recipient)) throw new Error("Recipient must be a valid EVM address.");

  const walletConfig = getActiveWagmiConfig();
  const current = walletConfig.state.current;
  const connection = current ? walletConfig.state.connections.get(current) : undefined;
  if (!connection) throw new Error("No EVM wallet is currently connected.");

  const rawProvider = await connection.connector.getProvider();
  const provider = new BrowserProvider(rawProvider as Eip1193Provider);
  const chain = await provider.getNetwork();
  const chainId = Number(chain.chainId);
  const expectedSourceChainId = from === "internal" ? BOT_TESTNET_CHAIN_ID : SEPOLIA_CHAIN_ID;
  const destinationChainId = to === "internal" ? BOT_TESTNET_CHAIN_ID : SEPOLIA_CHAIN_ID;
  if (chainId !== expectedSourceChainId) {
    const expectedNetwork = from === "internal" ? "BOT Chain Testnet" : "Ethereum Sepolia";
    throw new Error(`Connect your wallet to ${expectedNetwork} (chain ID ${expectedSourceChainId}) to bridge from ${from}. The connected wallet is on ${chain.name} (chain ID ${chainId}).`);
  }

  const inputAmount = normalizedAmount(amount);
  if (from === "internal" && Number(inputAmount) <= 10) {
    throw new Error("BOT Chain Testnet bridge-out requires more than 10 USDT.");
  }
  const tokenAddress = from === "internal" ? BOT_TESTNET_USDT : SEPOLIA_USDT;
  const bridgeAddress = from === "internal" ? BOT_TESTNET_BRIDGE_ROUTER : SEPOLIA_BRIDGE_GATEWAY;
  const signer = await provider.getSigner(connection.accounts[0]);
  const sender = await signer.getAddress();
  const token = new Contract(tokenAddress, BRIDGE_ERC20_ABI, signer);
  const code = await provider.getCode(bridgeAddress);
  if (code === "0x") throw new Error(`No bridge contract is deployed at the configured ${from === "internal" ? "BOT Chain Testnet" : "Sepolia"} testnet address.`);
  const decimals = Number(await token.decimals());
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 18) throw new Error("The configured test USDT token returned invalid decimals.");
  const amountIn = parseUnits(inputAmount, decimals);
  const tokenBalance = BigInt((await token.balanceOf(sender)).toString());
  if (tokenBalance < amountIn) throw new Error(`Insufficient test USDT on ${from === "internal" ? "BOT Chain Testnet" : "Sepolia"}.`);
  const allowance = BigInt((await token.allowance(sender, bridgeAddress)).toString());
  let approvalTransactionHash: string | undefined;

  if (allowance < amountIn) {
    if (allowance > 0n) {
      const reset = await token.approve(bridgeAddress, 0n);
      const resetReceipt = await reset.wait();
      if (!resetReceipt || resetReceipt.status !== 1) throw new Error("Could not reset the USDT bridge allowance.");
    }
    const approval = await token.approve(bridgeAddress, amountIn);
    const approvalReceipt = await approval.wait();
    if (!approvalReceipt || approvalReceipt.status !== 1) throw new Error("Could not approve USDT for the bridge.");
    approvalTransactionHash = approvalReceipt.hash || approval.hash;
  }

  const bridge = new Contract(bridgeAddress, BOT_BRIDGE_ABI, signer);
  const transaction = await bridge.deposit(destinationChainId, USDT_RESOURCE_ID, recipient, amountIn);
  const receipt = await transaction.wait();
  if (!receipt || receipt.status !== 1) throw new Error("The source-chain bridge deposit failed.");

  return {
    success: true,
    asset: "USDT",
    from,
    to,
    fromNetwork: from === "internal" ? "BOT Chain Testnet" : "Ethereum Sepolia",
    toNetwork: to === "internal" ? "BOT Chain Testnet" : "Ethereum Sepolia",
    amount: inputAmount,
    ...(approvalTransactionHash ? { approvalTransactionHash } : {}),
    transactionHash: receipt.hash || transaction.hash,
    status: "submitted",
  };
}

/** Bridge test USDT between BOT Chain Testnet (internal) and Ethereum Sepolia (external). */
export async function cordy_bridge(
  amount: number | string,
  from: CordyBridgeSide,
  to: CordyBridgeSide,
  recipient: string,
): Promise<CordyBridgeResult> {
  try {
    return await bridgeEvm(normalizedAmount(amount), from, to, recipient);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Could not submit the bridge deposit." };
  }
}

async function transferEvm(amount: string, recipient: string, requestedSymbol?: string): Promise<CordyTransferResult> {
  if (!isAddress(recipient)) throw new Error("Recipient must be a valid EVM address.");

  const walletConfig = getActiveWagmiConfig();
  const current = walletConfig.state.current;
  const connection = current ? walletConfig.state.connections.get(current) : undefined;
  if (!connection) throw new Error("No EVM wallet is currently connected.");

  const rawProvider = await connection.connector.getProvider();
  const provider = new BrowserProvider(rawProvider as Eip1193Provider);
  const chain = await provider.getNetwork();
  const chainId = Number(chain.chainId);
  const tokenConfig = resolveEvmAsset(requestedSymbol, chainId, chain.name);
  const contractAddress = tokenConfig?.contractAddress || "";
  if (!contractAddress) {
    throw new Error(`No ${requestedSymbol || "default"} EVM token configured. Add it to the asset JSON.`);
  }
  if (!isAddress(contractAddress)) throw new Error("The configured EVM token contract address is invalid.");
  const readProvider = await getEvmReadProvider(provider, chainId, chain.name, tokenConfig?.rpcUrl);

  const signer = await provider.getSigner(connection.accounts[0]);
  const from = await signer.getAddress();
  const balance = await readTokenBalance(from, {
    tokenAddress: contractAddress,
    rpcUrl: tokenConfig?.rpcUrl || configuredAssets?.networks?.find((network) => network.chainId === chainId)?.rpcUrl,
    provider: readProvider,
    fallbackProvider: provider,
    expectedChainId: chainId,
    networkName: chain.name,
    symbol: tokenConfig?.symbol,
    decimals: tokenConfig?.decimals,
  });
  if (requestedSymbol && balance.symbol.toLowerCase() !== requestedSymbol.toLowerCase()) {
    throw new Error(`The configured token is ${balance.symbol}, not ${requestedSymbol}. Add ${requestedSymbol} to the asset JSON.`);
  }
  const value = parseUnits(amount, balance.decimals);
  if (BigInt(balance.rawBalance) < value) throw new Error(`Insufficient ${balance.symbol} balance for this transfer.`);

  const writeToken = new Contract(contractAddress, tokenAbi, signer);
  const transaction = await writeToken.transfer(recipient, value);
  const receipt = await transaction.wait();
  if (!receipt || receipt.status !== 1) throw new Error("EVM transfer did not complete successfully.");

  return { success: true, asset: balance.symbol, network: "evm", transactionHash: receipt.hash || transaction.hash };
}

async function readEvmBalance(requestedSymbol?: string): Promise<CordyBalanceResult> {
  const walletConfig = getActiveWagmiConfig();
  const current = walletConfig.state.current;
  const connection = current ? walletConfig.state.connections.get(current) : undefined;
  if (!connection) throw new Error("No EVM wallet is currently connected.");

  const rawProvider = await connection.connector.getProvider();
  const provider = new BrowserProvider(rawProvider as Eip1193Provider);
  const chain = await provider.getNetwork();
  const chainId = Number(chain.chainId);
  const tokenConfig = resolveEvmAsset(requestedSymbol, chainId, chain.name);
  const readProvider = await getEvmReadProvider(provider, chainId, chain.name, tokenConfig?.rpcUrl);
  const walletAddress = connection.accounts[0];
  if (!walletAddress) throw new Error("No EVM wallet account is currently connected.");

  if (tokenConfig?.type === "native") {
    return {
      success: true,
      network: chain.name,
      balance: formatUnits(await readProvider.getBalance(walletAddress), 18),
      asset: tokenConfig.symbol,
    };
  }

  const contractAddress = tokenConfig?.contractAddress || "";
  if (!contractAddress) {
    throw new Error(`No ${requestedSymbol || "default"} EVM token configured. Add it to the asset JSON.`);
  }
  if (!isAddress(contractAddress)) throw new Error("The configured EVM token contract address is invalid.");
  const balance = await readTokenBalance(walletAddress, {
    tokenAddress: contractAddress,
    rpcUrl: tokenConfig?.rpcUrl || configuredAssets?.networks?.find((network) => network.chainId === chainId)?.rpcUrl,
    provider: readProvider,
    fallbackProvider: provider,
    expectedChainId: chainId,
    networkName: chain.name,
    symbol: tokenConfig?.symbol,
    decimals: tokenConfig?.decimals,
  });
  if (requestedSymbol && balance.symbol.toLowerCase() !== requestedSymbol.toLowerCase()) {
    throw new Error(`The configured token is ${balance.symbol}, not ${requestedSymbol}. Add ${requestedSymbol} to the asset JSON.`);
  }

  return {
    success: true,
    network: chain.name,
    balance: balance.balance,
    asset: balance.symbol,
  };
}

async function readStellarBalance(requestedSymbol?: string): Promise<CordyBalanceResult> {
  const symbol = requestedSymbol || "XLM";
  const stellarConfig = requireStellarNetwork();
  const access = await requestAccess();
  const address = access.address;
  if (!address) throw new Error("Could not access the connected Stellar wallet.");

  const balance = await loadStellarBalance(address, {
    assetSymbol: symbol,
    assets: configuredAssets?.stellar,
    horizonUrl: stellarConfig.horizonUrl,
    networkPassphrase: stellarConfig.networkPassphrase,
  });

  return {
    success: true,
    network: balance.network,
    balance: balance.balance,
    asset: balance.asset,
  };
}

/** Read the full-precision balance for the active wallet and selected asset. */
export async function cordy_balance(options: CordyBalanceOptions = {}): Promise<CordyBalanceResult> {
  try {
    const activeWallet = getActiveWallet();
    return activeWallet === "stellar"
      ? await readStellarBalance(options.asset)
      : await readEvmBalance(options.asset);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not read wallet balance.",
    };
  }
}

async function transferStellar(amount: string, recipient: string, requestedSymbol?: string, memo?: string): Promise<CordyTransferResult> {
  const stellarConfig = requireStellarNetwork();
  if (!StrKey.isValidEd25519PublicKey(recipient)) throw new Error("Recipient must be a valid Stellar public address.");
  if (!/^\d+(\.\d{1,7})?$/.test(amount)) throw new Error("Stellar amounts support up to 7 decimal places.");
  const symbol = requestedSymbol || "XLM";

  const access = await requestAccess();
  const sourceAddress = access.address;
  if (!sourceAddress) throw new Error("Could not access the connected Stellar wallet.");

  const networkDetails = await getNetworkDetails();
  const networkPassphrase = networkDetails.networkPassphrase || stellarConfig.networkPassphrase;
  if (networkDetails.networkPassphrase && networkDetails.networkPassphrase !== stellarConfig.networkPassphrase) {
    throw new Error(`Stellar network mismatch. Expected ${stellarConfig.networkPassphrase}, got ${networkDetails.networkPassphrase}.`);
  }
  const candidates = (configuredAssets?.stellar ?? []).filter(
    (asset) => asset.symbol.toLowerCase() === symbol.toLowerCase() &&
      (!asset.networkPassphrase || asset.networkPassphrase === networkPassphrase),
  );
  if (candidates.length > 1) throw new Error(`More than one ${symbol} asset matches this Stellar network; make the JSON entries unique.`);
  const assetConfig: StellarAssetConfig = candidates[0] ??
    (symbol.toLowerCase() === "xlm" ? { symbol: "XLM", type: "native" } : undefined)!;
  if (!assetConfig) throw new Error(`No ${symbol} asset is configured for this Stellar network.`);

  const stellarAsset = assetConfig.type === "native"
    ? Asset.native()
    : new Asset(assetConfig.code, assetConfig.issuer);
  const server = new Horizon.Server(stellarConfig.horizonUrl);
  const sourceAccount = await server.loadAccount(sourceAddress);
  const assetBalance = assetConfig.type === "native"
    ? sourceAccount.balances.find((item) => item.asset_type === "native")
    : sourceAccount.balances.find((item) =>
      (item.asset_type === "credit_alphanum4" || item.asset_type === "credit_alphanum12") &&
      item.asset_code === assetConfig.code &&
      item.asset_issuer === assetConfig.issuer,
    );
  if (!assetBalance) {
    throw new Error(assetConfig.type === "native"
      ? `The connected Stellar account has no ${symbol} balance.`
      : `The connected Stellar account has no ${symbol} trustline from the configured issuer.`);
  }
  const requiredBalance = Number(amount) + (assetConfig.type === "native" ? 0.00001 : 0);
  if (Number(assetBalance.balance) < requiredBalance) throw new Error(`Insufficient ${symbol} balance for this transfer.`);

  const builder = new TransactionBuilder(sourceAccount, { fee: BASE_FEE, networkPassphrase })
    .addOperation(Operation.payment({ destination: recipient, asset: stellarAsset, amount: Number(amount).toFixed(7) }))
    .setTimeout(180);

  const memoText = memo?.trim();
  if (memoText) {
    if (new TextEncoder().encode(memoText).length > 28) throw new Error("Stellar text memos must be 28 bytes or fewer.");
    builder.addMemo(Memo.text(memoText));
  }

  const unsignedTx = builder.build();
  const { signedTxXdr, error } = await freighterSignTransaction(unsignedTx.toXDR(), {
    networkPassphrase,
    address: sourceAddress,
  });
  if (error || !signedTxXdr) throw new Error(error?.message || "Stellar wallet signing was rejected.");

  const signedTx = TransactionBuilder.fromXDR(signedTxXdr, networkPassphrase);
  const receipt = await server.submitTransaction(signedTx);
  if (!receipt.successful || !receipt.hash) throw new Error("Stellar transfer did not complete successfully.");

  return { success: true, asset: symbol, network: "stellar", transactionHash: receipt.hash };
}

async function swapEvm(amount: string, fromSymbol: string, toSymbol: string): Promise<CordySwapResult> {
  const walletConfig = getActiveWagmiConfig();
  const current = walletConfig.state.current;
  const connection = current ? walletConfig.state.connections.get(current) : undefined;
  if (!connection) throw new Error("No EVM wallet is currently connected.");

  const rawProvider = await connection.connector.getProvider();
  const provider = new BrowserProvider(rawProvider as Eip1193Provider);
  const chain = await provider.getNetwork();
  const chainId = Number(chain.chainId);
  const networkConfig = resolveEvmSwapNetworkConfig(chainId);
  const networkName = networkConfig?.name || chain.name;
  const fromAsset = resolveConfiguredEvmSwapAsset(fromSymbol, chainId);
  const toAsset = resolveConfiguredEvmSwapAsset(toSymbol, chainId);
  if (fromSymbol.toLowerCase() === toSymbol.toLowerCase()) throw new Error("Choose two different assets to swap.");

  if (!networkConfig?.swapRouterAddress || !isAddress(networkConfig.swapRouterAddress)) {
    throw new Error(`No valid Uniswap V2-compatible swap router is configured for ${networkName} (chain ID ${chainId}). Add swapRouterAddress to its network entry in assets JSON.`);
  }
  const isNative = (asset: EvmAssetConfig) => asset.type === "native" || !asset.contractAddress;
  const fromNative = isNative(fromAsset);
  const toNative = isNative(toAsset);
  const wrappedNative = networkConfig.wrappedNativeTokenAddress;
  if ((fromNative || toNative) && (!wrappedNative || !isAddress(wrappedNative))) {
    throw new Error(`Configure wrappedNativeTokenAddress for ${networkName} in assets JSON to swap its native currency.`);
  }
  const fromAddress = fromNative ? wrappedNative! : fromAsset.contractAddress!;
  const toAddress = toNative ? wrappedNative! : toAsset.contractAddress!;
  if (!isAddress(fromAddress) || !isAddress(toAddress)) throw new Error("A configured swap asset has an invalid token contract address.");

  const signer = await provider.getSigner(connection.accounts[0]);
  const sender = await signer.getAddress();
  const inputAmount = normalizedAmount(amount);
  const inputDecimals = fromNative ? 18 : fromAsset.decimals ?? Number(await new Contract(fromAddress, ERC20_SWAP_ABI, provider).decimals());
  const outputDecimals = toNative ? 18 : toAsset.decimals ?? Number(await new Contract(toAddress, ERC20_SWAP_ABI, provider).decimals());
  const amountIn = parseUnits(inputAmount, inputDecimals);
  const router = new Contract(networkConfig.swapRouterAddress, V2_SWAP_ROUTER_ABI, signer);
  const path = [fromAddress, toAddress];
  const amounts = await router.getAmountsOut(amountIn, path);
  const quotedOut = BigInt(amounts[amounts.length - 1].toString());
  if (quotedOut <= 0n) throw new Error(`No swap quote is available for ${fromSymbol} to ${toSymbol} on ${networkName}.`);
  const minOut = quotedOut * 9900n / 10000n;
  const deadline = Math.floor(Date.now() / 1000) + 20 * 60;

  let transaction;
  if (fromNative) {
    transaction = await router.swapExactETHForTokens(minOut, path, sender, deadline, { value: amountIn });
  } else {
    const token = new Contract(fromAddress, ERC20_SWAP_ABI, signer);
    const allowance = BigInt((await token.allowance(sender, networkConfig.swapRouterAddress)).toString());
    if (allowance < amountIn) {
      if (allowance > 0n) {
        const reset = await token.approve(networkConfig.swapRouterAddress, 0n);
        const resetReceipt = await reset.wait();
        if (!resetReceipt || resetReceipt.status !== 1) throw new Error(`Could not reset the ${fromSymbol} swap allowance.`);
      }
      const approval = await token.approve(networkConfig.swapRouterAddress, amountIn);
      const approvalReceipt = await approval.wait();
      if (!approvalReceipt || approvalReceipt.status !== 1) throw new Error(`Could not approve ${fromSymbol} for the swap.`);
    }
    transaction = toNative
      ? await router.swapExactTokensForETH(amountIn, minOut, path, sender, deadline)
      : await router.swapExactTokensForTokens(amountIn, minOut, path, sender, deadline);
  }
  const receipt = await transaction.wait();
  if (!receipt || receipt.status !== 1) throw new Error(`The ${fromSymbol} to ${toSymbol} swap failed on ${networkName}.`);

  return {
    success: true,
    network: "evm",
    from: fromAsset.symbol,
    to: toAsset.symbol,
    amountIn: inputAmount,
    estimatedAmountOut: formatUnits(quotedOut, outputDecimals),
    transactionHash: receipt.hash || transaction.hash,
  };
}

function stellarAssetFromConfig(asset: StellarAssetConfig): Asset {
  return asset.type === "native" ? Asset.native() : new Asset(asset.code, asset.issuer);
}

async function swapStellar(amount: string, fromSymbol: string, toSymbol: string): Promise<CordySwapResult> {
  const stellarConfig = requireStellarNetwork();
  if (fromSymbol.toLowerCase() === toSymbol.toLowerCase()) throw new Error("Choose two different assets to swap.");
  if (!/^\d+(\.\d{1,7})?$/.test(amount)) throw new Error("Stellar swap amounts support up to 7 decimal places.");

  const access = await requestAccess();
  const source = access.address;
  if (!source) throw new Error("Could not access the connected Stellar wallet.");
  const networkDetails = await getNetworkDetails();
  const passphrase = networkDetails.networkPassphrase || stellarConfig.networkPassphrase;
  if (passphrase !== stellarConfig.networkPassphrase) throw new Error(`Stellar network mismatch. Expected ${stellarConfig.networkPassphrase}, got ${passphrase}.`);
  const fromAsset = resolveConfiguredStellarSwapAsset(fromSymbol, passphrase);
  const toAsset = resolveConfiguredStellarSwapAsset(toSymbol, passphrase);
  const stellarFrom = stellarAssetFromConfig(fromAsset);
  const stellarTo = stellarAssetFromConfig(toAsset);
  const server = new Horizon.Server(stellarConfig.horizonUrl);
  const sourceAccount = await server.loadAccount(source);
  const paths = await server.strictSendPaths(stellarFrom, amount, [stellarTo]).call();
  const route = paths.records[0];
  if (!route) throw new Error(`No Stellar path is available to swap ${fromSymbol} to ${toSymbol}.`);
  const minOut = (Number(route.destination_amount) * 0.99).toFixed(7);
  const routeAssets = route.path.map((item) => item.asset_type === "native"
    ? Asset.native()
    : new Asset(item.asset_code, item.asset_issuer));
  const transaction = new TransactionBuilder(sourceAccount, { fee: BASE_FEE, networkPassphrase: passphrase })
    .addOperation(Operation.pathPaymentStrictSend({
      sendAsset: stellarFrom,
      sendAmount: amount,
      destination: source,
      destAsset: stellarTo,
      destMin: minOut,
      path: routeAssets,
    }))
    .setTimeout(180)
    .build();
  const signed = await freighterSignTransaction(transaction.toXDR(), { networkPassphrase: passphrase, address: source });
  if (signed.error || !signed.signedTxXdr) throw new Error(signed.error?.message || "Stellar wallet signing was rejected.");
  const receipt = await server.submitTransaction(TransactionBuilder.fromXDR(signed.signedTxXdr, passphrase));
  if (!receipt.successful || !receipt.hash) throw new Error("The Stellar swap did not complete successfully.");
  return {
    success: true,
    network: "stellar",
    from: fromAsset.symbol,
    to: toAsset.symbol,
    amountIn: amount,
    estimatedAmountOut: route.destination_amount,
    transactionHash: receipt.hash,
  };
}

/** Swap two configured assets using the active EVM or Stellar wallet. */
export async function cordy_swap(amount: number | string, from: string, to: string): Promise<CordySwapResult> {
  try {
    const normalized = normalizedAmount(amount);
    const activeWallet = getActiveWallet();
    return activeWallet === "stellar"
      ? await swapStellar(normalized, from, to)
      : await swapEvm(normalized, from, to);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Could not swap the selected assets." };
  }
}

/** Configure a caller-owned JSON asset registry before requesting transfers. */
export function cordy_configure(options: { assets: CordyAssetsConfig }): void {
  configureCordyAssets(options);
}

/** Send a selected JSON-configured asset using Minikit's active wallet. */
export async function cordy_transfer(
  amount: number | string,
  recipient: string,
  options: CordyTransferOptions = {},
): Promise<CordyTransferResult> {
  try {
    const normalized = normalizedAmount(amount);
    const activeWallet = getActiveWallet();
    return activeWallet === "stellar"
      ? await transferStellar(normalized, recipient, options.asset, options.memo)
      : await transferEvm(normalized, recipient, options.asset);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Transfer failed.",
    };
  }
}
