import { ethers } from "ethers";
import ERC20_ABI from "../config/ERC20_ABI.json";

// RPC URLs for different chains
const RPC_URLS: Record<number, string> = {
  1: process.env.NEXT_PUBLIC_MAINNET_RPC || "https://eth.llamarpc.com", // Ethereum Mainnet
  8453: process.env.NEXT_PUBLIC_BASE_RPC || "https://mainnet.base.org", // Base Mainnet
  84532: process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || "https://sepolia.base.org", // Base Sepolia
  1114: process.env.NEXT_PUBLIC_CORE_TESTNET_RPC || "https://rpc.test2.btcs.network", // Core Blockchain TestNet
  // Add more chains as needed
};

export default async function getTokenBalance(
  address: string,
  tokenAddress: string,
  chainId?: number,
  decimals: number = 18
) {

  try {
    // Use provided chainId or fallback to env variable or default
    const selectedChainId = chainId || 8453; // Default to Base if not provided
    const rpcUrl = RPC_URLS[selectedChainId] || process.env.NEXT_PUBLIC_RPC_ENDPOINT;

    if (!rpcUrl) {
      console.error(`No RPC URL configured for chain ID: ${selectedChainId}`);
      return "0";
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const balance = await contract.balanceOf(address);
    return ethers.formatUnits(balance, decimals);
  } catch (err) {
    console.error("Error fetching token balance:", err);
    return "0";
  }
}
