import { ethers } from "ethers";
import ERC20_ABI from "../config/ERC20_ABI.json";

export default async function getTokenBalance(
  address: string,
  tokenAddress: string,
  decimals: number = 18
): Promise<{ balance: string; symbol: string }> {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_ENDPOINT);
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

    // Fetch balance
    const balance = await contract.balanceOf(address);
    const formattedBalance = ethers.formatUnits(balance, decimals);

    // Fetch token symbol
    let symbol: string;
    try {
      symbol = await contract.symbol();
    } catch(err) {
      console.log(err);
      symbol = "Unknown";
    }

    return { balance: formattedBalance, symbol };
  } catch (err) {
    console.error("Error fetching token balance:", err);
    return { balance: "0", symbol: "" };
  }
}
