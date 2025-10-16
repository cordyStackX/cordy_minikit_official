"use server";
import { ethers, parseUnits } from 'ethers';
import tokenAbi from '../config/ERC20_ABI.json';
const tokenAddress = process.env.NEXT_PUBLIC_TOKENADDRESS || "";
const rpcUrl = process.env.NEXT_PUBLIC_RPC_ENDPOINT || "";
// Server-side environment variables (for backend/API routes)
const privateKeyFromEnv = process.env.PRIVATE_KEY || "";
export default async function CordyStackTrans(address, cost) {
    if (!address) {
        console.error("❌ Recipient address not found");
        return false;
    }
    const contractAddress = tokenAddress;
    if (!contractAddress) {
        console.error("❌ NEXT_PUBLIC_TOKENADDRESS not configured");
        return false;
    }
    try {
        let provider;
        let signer;
        const privateKey = privateKeyFromEnv;
        // Choose signing method
        if (privateKey) {
            // ⚠️ PRIVATE KEY SIGNING (Server-side or backend only)
            const endpoint = rpcUrl;
            if (!endpoint) {
                console.error("❌ NEXT_PUBLIC_RPC_ENDPOINT required for private key signing");
                return false;
            }
            console.log("🔐 Using private key signer (from environment)");
            provider = new ethers.JsonRpcProvider(endpoint);
            signer = new ethers.Wallet(privateKey, provider);
        }
        else {
            // 👛 WALLET SIGNING (User's wallet - MetaMask, etc.)
            console.log("👛 Using wallet signer");
            if (!window.ethereum) {
                console.error("❌ No wallet detected. Install MetaMask or similar.");
                return false;
            }
            provider = new ethers.BrowserProvider(window.ethereum);
            signer = await provider.getSigner();
        }
        // Get network info
        const network = await provider.getNetwork();
        console.log(`🌐 Network: ${network.name} (Chain ID: ${network.chainId})`);
        // Create contract instance
        const tokenContract = new ethers.Contract(contractAddress, tokenAbi, signer);
        // Get decimals from contract
        let decimals;
        try {
            decimals = await tokenContract.decimals();
        }
        catch {
            console.warn("⚠️ Could not fetch decimals, using default 18");
            decimals = 18;
        }
        const amount = parseUnits(String(cost), decimals);
        // Check balance
        const signerAddress = await signer.getAddress();
        const balance = await tokenContract.balanceOf(signerAddress);
        console.log(`💰 Balance: ${ethers.formatUnits(balance, decimals)} tokens`);
        console.log(`💸 Sending: ${ethers.formatUnits(amount, decimals)} tokens`);
        if (balance < amount) {
            console.error("❌ Insufficient balance");
            return false;
        }
        // Execute transfer
        console.log(`🚀 Initiating transfer to ${address}...`);
        const tx = await tokenContract.transfer(address, amount);
        console.log(`⏳ Transaction submitted: ${tx.hash}`);
        const receipt = await tx.wait();
        if (receipt && receipt.status === 1) {
            console.log(`✅ Transaction Complete! TX hash: ${receipt.hash}`);
            return true;
        }
        else {
            console.error("❌ Transaction Failed", receipt);
            return false;
        }
    }
    catch (err) {
        console.error("❌ Transaction error:", err);
        if (err.code === "INVALID_ARGUMENT") {
            console.error("💡 Check your private key format or wallet connection");
        }
        else if (err.code === "INSUFFICIENT_FUNDS") {
            console.error("💡 Not enough gas or token balance");
        }
        return false;
    }
}
;
