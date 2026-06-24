import { ethers } from "ethers";
import ERC20_ABI from "../config/ERC20_ABI.json";
export default async function getTokenBalance(address, decimals = 18) {
    try {
        const tokenAddress = process.env.NEXT_PUBLIC_TOKENADDRESS;
        const rpcEndpoint = process.env.NEXT_PUBLIC_RPC_ENDPOINT;
        if (!tokenAddress) {
            console.error("NEXT_PUBLIC_TOKENADDRESS is not configured");
            return { balance: "0", symbol: "" };
        }
        if (!rpcEndpoint) {
            console.error("NEXT_PUBLIC_RPC_ENDPOINT is not configured");
            return { balance: "0", symbol: "" };
        }
        const provider = new ethers.JsonRpcProvider(rpcEndpoint);
        const code = await provider.getCode(tokenAddress);
        if (!code || code === "0x") {
            console.error(`No contract bytecode found at ${tokenAddress} on ${rpcEndpoint}`);
            return { balance: "0", symbol: "" };
        }
        const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
        // Fetch balance
        const balance = await contract.balanceOf(address);
        const formattedBalance = ethers.formatUnits(balance, decimals);
        // Fetch token symbol
        let symbol;
        try {
            symbol = await contract.symbol();
        }
        catch (err) {
            console.log(err);
            symbol = "Unknown";
        }
        return { balance: formattedBalance, symbol };
    }
    catch (err) {
        console.error("Error fetching token balance:", err);
        return { balance: "0", symbol: "" };
    }
}
