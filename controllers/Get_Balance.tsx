import { ethers } from "ethers";
import ERC20_ABI from "../config/ERC20_ABI.json";

// RPC URLs for different chains
const RPC_URLS: Record<number, string> = {
  1: process.env.NEXT_PUBLIC_RPC_ENDPOINT || "https://eth.llamarpc.com"
};

export default async function getTokenBalance(
  address: string, 
  tokenAddress: string, 
  chainId: number = 1,
  decimals: number = 18
) {
  
  if (!address) return "0";

  try {
    const rpcUrl = RPC_URLS[chainId];
    
    if (!rpcUrl) {
      console.error(`No RPC URL configured for chain ID: ${chainId}`);
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
