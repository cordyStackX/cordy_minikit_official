import { ethers } from "ethers";
import ERC20_ABI from "../config/ERC20_ABI.json";

export default async function getTokenBalance(
  address: string,
  tokenAddress: string,
  decimals: number = 18
) {

  try {
    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_ENDPOINT);
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const balance = await contract.balanceOf(address);
    return ethers.formatUnits(balance, decimals);
  } catch (err) {
    console.error("Error fetching token balance:", err);
    return "0";
  }
}
