import { ethers } from "ethers";
import ERC20_ABI from "../config/ERC20_ABI.json";
import { useAccount } from "wagmi";

export default async function getTokenBalance(
  decimals: number = 18
): Promise<{ balance: string; symbol: string }> {
  const { address } = useAccount();

  try {

    if (!process.env.NEXT_PUBLIC_TOKENADDRESS) return { balance: "0", symbol: "" };

    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_ENDPOINT);
    const contract = new ethers.Contract(process.env.NEXT_PUBLIC_TOKENADDRESS, ERC20_ABI, provider);

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
