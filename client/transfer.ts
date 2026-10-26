"use client";

import { Asset, BASE_FEE, Horizon, Memo, Networks, Operation, StrKey, TransactionBuilder } from "@stellar/stellar-sdk";
import { getNetworkDetails, requestAccess, signTransaction as freighterSignTransaction } from "@stellar/freighter-api";
import { BrowserProvider, Contract, formatEther, isAddress, JsonRpcProvider, parseUnits, type Eip1193Provider } from "ethers";
import { getActiveWagmiConfig } from "../config/walletConfig";
import { readTokenBalance } from "../controllers/Get_Balance";
import loadStellarBalance from "../controllers/loadStellarBalance";
import tokenAbi from "../config/ERC20_ABI.json";

const ACTIVE_WALLET_SESSION_KEY = "cordy_minikit_active_wallet_session";
const STELLAR_WALLET_STORAGE_KEY = "cordy_minikit_stellar_wallet";
const stellarRpc = process.env.NEXT_PUBLIC_STELLAR_HORIZON || "https://horizon-testnet.stellar.org";
const stellarNetwork = process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE || Networks.TESTNET;

export type EvmAssetConfig = {
  symbol: string;
  chainId: number;
  type?: "native" | "erc20";
  contractAddress?: string;
  decimals?: number;
  rpcUrl?: string;
};

export type EvmNetworkConfig = {
  chainId: number;
  name: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  rpcUrl: string;
  blockExplorerUrl?: string;
};

export type StellarAssetConfig =
  | { symbol: string; type: "native"; networkPassphrase?: string }
  | { symbol: string; type: "credit"; code: string; issuer: string; networkPassphrase?: string };

/** JSON registry supplied by the application developer. */
export type CordyAssetsConfig = {
  networks?: EvmNetworkConfig[];
  evm?: EvmAssetConfig[];
  stellar?: StellarAssetConfig[];
};

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
  /** Asset symbol from the configured JSON registry. Defaults to the EVM env token or Stellar XLM. */
  asset?: string;
};

export type CordyBalanceResult = {
  success: boolean;
  network?: string;
  balance?: string;
  asset?: string;
  error?: string;
};

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
  };
}

function normalizedAmount(amount: number | string): string {
  const value = String(amount).trim();
  if (!/^\d+(\.\d+)?$/.test(value) || !Number.isFinite(Number(value)) || Number(value) <= 0) {
    throw new Error("Amount must be a positive decimal number.");
  }
  return value;
}

function resolveEvmAsset(requestedSymbol: string | undefined, chainId: number, networkName: string): EvmAssetConfig | undefined {
  if (!requestedSymbol) return undefined;
  const sameSymbol = (configuredAssets?.evm ?? []).filter(
    (asset) => asset.symbol.toLowerCase() === requestedSymbol.toLowerCase(),
  );
  const matchingNetwork = sameSymbol.find((asset) => asset.chainId === chainId);
  if (sameSymbol.length > 0 && !matchingNetwork) {
    const chainIds = [...new Set(sameSymbol.map((asset) => asset.chainId))].join(", ");
    throw new Error(`${requestedSymbol} is configured for chain ID ${chainIds}, but the connected wallet is on ${networkName} (chain ID ${chainId}). Switch networks or add an asset entry for this chain.`);
  }
  return matchingNetwork;
}

async function getEvmReadProvider(
  walletProvider: BrowserProvider,
  chainId: number,
  networkName: string,
  assetRpcUrl?: string,
): Promise<BrowserProvider | JsonRpcProvider> {
  const rpcUrl = assetRpcUrl || configuredAssets?.networks?.find((network) => network.chainId === chainId)?.rpcUrl || process.env.NEXT_PUBLIC_RPC_ENDPOINT;
  if (!rpcUrl) return walletProvider;

  const rpcProvider = new JsonRpcProvider(rpcUrl);
  let rpcNetwork;
  try {
    rpcNetwork = await rpcProvider.getNetwork();
  } catch {
    if (!assetRpcUrl && !configuredAssets?.networks?.some((network) => network.rpcUrl === rpcUrl)) return walletProvider;
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
  const fallbackAddress = process.env.NEXT_PUBLIC_TOKENADDRESS || "";
  const contractAddress = tokenConfig?.contractAddress || fallbackAddress;
  if (!contractAddress) {
    throw new Error(`No ${requestedSymbol || "default"} EVM token configured. Add it to the asset JSON or set NEXT_PUBLIC_TOKENADDRESS.`);
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
      balance: formatEther(await readProvider.getBalance(walletAddress)),
      asset: tokenConfig.symbol,
    };
  }

  const contractAddress = tokenConfig?.contractAddress || process.env.NEXT_PUBLIC_TOKENADDRESS || "";
  if (!contractAddress) {
    throw new Error(`No ${requestedSymbol || "default"} EVM token configured. Add it to the asset JSON or set NEXT_PUBLIC_TOKENADDRESS.`);
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
  const access = await requestAccess();
  const address = access.address;
  if (!address) throw new Error("Could not access the connected Stellar wallet.");

  const balance = await loadStellarBalance(address, {
    assetSymbol: symbol,
    assets: configuredAssets?.stellar,
    horizonUrl: stellarRpc,
    networkPassphrase: stellarNetwork,
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
  if (!StrKey.isValidEd25519PublicKey(recipient)) throw new Error("Recipient must be a valid Stellar public address.");
  if (!/^\d+(\.\d{1,7})?$/.test(amount)) throw new Error("Stellar amounts support up to 7 decimal places.");
  const symbol = requestedSymbol || "XLM";

  const access = await requestAccess();
  const sourceAddress = access.address;
  if (!sourceAddress) throw new Error("Could not access the connected Stellar wallet.");

  const networkDetails = await getNetworkDetails();
  const networkPassphrase = networkDetails.networkPassphrase || stellarNetwork;
  if (networkDetails.networkPassphrase && networkDetails.networkPassphrase !== stellarNetwork) {
    throw new Error(`Stellar network mismatch. Expected ${stellarNetwork}, got ${networkDetails.networkPassphrase}.`);
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
  const server = new Horizon.Server(stellarRpc);
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
