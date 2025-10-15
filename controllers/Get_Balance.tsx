import { ethers } from "ethers";
import ERC20_ABI from "../config/ERC20_ABI.json";

const RPCS: Record<number, string> = {
  84532: "https://api.developer.coinbase.com/rpc/v1/base-sepolia/<CDP_API_KEY>",
  1115: "https://rpc.test2.btcs.network",
  11155111: "https://sepolia.infura.io/v3/<INFURA_API_KEY>",
};

export default async function getTokenBalance(
  address: string,
  tokenAddress: string,
  chainId: number,
  decimals: number = 18
) {
  if (!address || !chainId) return "0";

  const rpc = RPCS[chainId];
  if (!rpc) {
    console.error(`No RPC configured for chain ${chainId}`);
    return "0";
  }

  try {
    const provider = new ethers.JsonRpcProvider(rpc);
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const balance = await contract.balanceOf(address);
    return ethers.formatUnits(balance, decimals);
  } catch (err) {
    console.error("Error fetching token balance:", err);
    return "0";
  }
}
