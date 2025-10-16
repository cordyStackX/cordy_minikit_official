import { ethers, parseUnits } from 'ethers';
import tokenAbi from '../config/ERC20_ABI.json';

const tokenAddress = process.env.NEXT_PUBLIC_TOKENADDRESS || "";
const rpcUrl = process.env.NEXT_PUBLIC_RPC_ENDPOINT || "";

export default async function CordyStackTrans(address: string, cost: number) {

  if (!address) {
    console.error("❌ Recipient address not found");
    return false;
  }

  if (!tokenAddress) {
    console.error("❌ NEXT_PUBLIC_TOKENADDRESS not configured");
    return false;
  }

  if (!rpcUrl) {
    console.error("❌ NEXT_PUBLIC_RPC_ENDPOINT not configured");
    return false;
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    
    // Get current network
    const network = await provider.getNetwork();
    console.log(`🌐 Connected to network: ${network.name} (Chain ID: ${network.chainId})`);

    // Verify contract exists on this network
    console.log(`🔍 Checking contract at ${tokenAddress}...`);
    const contractCode = await provider.getCode(tokenAddress);
    
    if (contractCode === "0x") {
      console.error(`❌ No contract found at ${tokenAddress} on chain ${network.chainId}`);
      console.error("❌ Please check:");
      console.error("   1. You're connected to the correct network");
      console.error("   2. The token contract address is correct");
      console.error("   3. The contract is deployed on this network");
      alert("Wrong Mainnet");
      return false;
    }

    console.log("✅ Contract found on network");

    // Create contract instance
    const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, signer);

    // Verify it's a valid ERC20 token
    try {
      const symbol = await tokenContract.symbol();
      const decimals = await tokenContract.decimals();
      console.log(`✅ Valid ERC20 token: ${symbol} (decimals: ${decimals})`);
    } catch (err) {
      console.error("❌ Contract exists but is not a valid ERC20 token");
      return false;
    }

    // Get decimals from contract
    const decimals = await tokenContract.decimals();
    const amount = parseUnits(String(cost), decimals);

    // Check balance
    const userAddress = await signer.getAddress();
    const balance = await tokenContract.balanceOf(userAddress);
    const symbol = await tokenContract.symbol();
    
    console.log(`💰 Your balance: ${ethers.formatUnits(balance, decimals)} ${symbol}`);
    console.log(`💸 Transfer amount: ${ethers.formatUnits(amount, decimals)} ${symbol}`);

    if (balance < amount) {
      console.error(`❌ Insufficient balance. Need: ${ethers.formatUnits(amount, decimals)} ${symbol}, Have: ${ethers.formatUnits(balance, decimals)} ${symbol}`);
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
    } else {
      console.error("❌ Transaction Failed", receipt);
      return false;
    }
  } catch (err: any) {
    console.error("❌ Transaction error:", err);
    
    // Provide helpful error messages
    if (err.code === "NETWORK_ERROR") {
      console.error("💡 Network error - check your internet connection");
    } else if (err.code === "ACTION_REJECTED") {
      console.error("💡 Transaction was rejected by user");
    } else if (err.message?.includes("BAD_DATA")) {
      console.error("💡 Contract doesn't exist on this network or wrong address");
    }
    
    return false;
  }
};