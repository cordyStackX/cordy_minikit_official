import { Contract, formatUnits, isAddress, JsonRpcProvider, type Provider } from "ethers";
import ERC20_ABI from "../config/ERC20_ABI.json";

export type TokenBalanceOptions = {
  tokenAddress?: string;
  rpcUrl?: string;
  provider?: Provider;
  fallbackProvider?: Provider;
  expectedChainId?: number;
  networkName?: string;
  symbol?: string;
  decimals?: number;
};

export type TokenBalanceResult = {
  balance: string;
  rawBalance: string;
  symbol: string;
  decimals: number;
  network: string;
  chainId: number;
};

/** Shared ERC-20 balance reader used by wallet status and the Cordy API. */
export async function readTokenBalance(
  address: string,
  options: TokenBalanceOptions = {},
): Promise<TokenBalanceResult> {
  const tokenAddress = options.tokenAddress || process.env.NEXT_PUBLIC_TOKENADDRESS;
  const rpcUrl = options.rpcUrl || process.env.NEXT_PUBLIC_RPC_ENDPOINT;
  const provider = options.provider || (rpcUrl ? new JsonRpcProvider(rpcUrl) : undefined);

  if (!tokenAddress) throw new Error("No EVM token address is configured.");
  if (!isAddress(tokenAddress)) throw new Error("The configured EVM token address is invalid.");
  if (!provider) throw new Error("No EVM RPC endpoint or connected wallet provider is available.");

  let network;
  try {
    network = await provider.getNetwork();
  } catch {
    throw new Error("Could not connect to the configured EVM RPC endpoint.");
  }
  const chainId = Number(network.chainId);
  if (options.expectedChainId !== undefined && chainId !== options.expectedChainId) {
    throw new Error(`The EVM RPC is on chain ID ${chainId}, but the wallet is on ${options.networkName || "another network"} (chain ID ${options.expectedChainId}).`);
  }

  let readProvider = provider;
  let code: string;
  try {
    code = await readProvider.getCode(tokenAddress);
  } catch (primaryError) {
    const fallbackProvider = options.fallbackProvider;
    if (!fallbackProvider || fallbackProvider === provider) {
      throw new Error(`The EVM RPC could not read the token contract on ${options.networkName || network.name}. Check the RPC endpoint and try again.`);
    }

    try {
      const fallbackNetwork = await fallbackProvider.getNetwork();
      if (Number(fallbackNetwork.chainId) !== chainId) {
        throw new Error(`The connected wallet is on chain ID ${fallbackNetwork.chainId}, not ${chainId}.`);
      }
      readProvider = fallbackProvider;
      code = await readProvider.getCode(tokenAddress);
    } catch {
      const cause = primaryError instanceof Error ? ` (${primaryError.message})` : "";
      throw new Error(`Both the configured EVM RPC and connected wallet could not read the token contract on ${options.networkName || network.name}${cause}. Check RPC access and try again.`);
    }
  }
  if (!code || code === "0x") {
    throw new Error(`No token contract was found at the configured address on ${options.networkName || network.name}. Check the connected network and token address.`);
  }

  const token = new Contract(tokenAddress, ERC20_ABI, readProvider);
  let symbol = options.symbol;
  if (!symbol) {
    try {
      symbol = String(await token.symbol());
    } catch {
      throw new Error("The configured EVM token does not expose ERC-20 symbol() on this network.");
    }
  }
  let decimals: number;
  let rawBalance: bigint;
  try {
    decimals = options.decimals ?? Number(await token.decimals());
    rawBalance = BigInt(await token.balanceOf(address));
  } catch (error) {
    if (readProvider !== provider && options.fallbackProvider) {
      const fallbackToken = new Contract(tokenAddress, ERC20_ABI, options.fallbackProvider);
      try {
        decimals = options.decimals ?? Number(await fallbackToken.decimals());
        rawBalance = BigInt(await fallbackToken.balanceOf(address));
        readProvider = options.fallbackProvider;
      } catch {
        throw new Error(`Could not read ${symbol} balance on ${options.networkName || network.name}. Check the token contract and RPC access.`);
      }
    } else {
      throw error;
    }
  }

  return {
    balance: formatUnits(rawBalance, decimals),
    rawBalance: rawBalance.toString(),
    symbol,
    decimals,
    network: options.networkName || network.name,
    chainId,
  };
}

/** Legacy controller API kept for existing `useWalletStatus` and button callers. */
export default async function getTokenBalance(
  address: string,
  decimals?: number,
): Promise<{ balance: string; symbol: string }> {
  try {
    const result = await readTokenBalance(address, { decimals });
    return { balance: result.balance, symbol: result.symbol };
  } catch (error) {
    console.error("Error fetching token balance:", error);
    return { balance: "0", symbol: "" };
  }
}
