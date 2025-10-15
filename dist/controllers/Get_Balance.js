import { ethers } from "ethers";
import ERC20_ABI from "../config/ERC20_ABI.json";
export default async function getTokenBalance(address, tokenAddress, decimals = 18) {
    try {
        const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_ENDPOINT);
        const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
        // Fetch balance
        const balance = await contract.balanceOf(address);
        const formattedBalance = ethers.formatUnits(balance, decimals);
        // Fetch token symbol
        let symbol;
        try {
            symbol = await contract.symbol();
        }
        catch {
            symbol = ""; // fallback if the contract doesn't implement symbol()
        }
        return { balance: formattedBalance, symbol };
    }
    catch (err) {
        console.error("Error fetching token balance:", err);
        return { balance: "0", symbol: "" };
    }
}
