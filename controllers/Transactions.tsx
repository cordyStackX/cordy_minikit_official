import { ethers, parseUnits } from 'ethers';
import tokenAbi from '../config/ERC20_ABI.json';
import { detectContractNetwork, enforceNetwork } from '../utils/networkEnforcer';

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
    // Step 1: Detect which network the contract is on
    console.log("🔍 Detecting contract network...");
    const requiredNetwork = await detectContractNetwork(tokenAddress);
    
    if (!requiredNetwork) {
      console.error("❌ Contract not found on any supported network");
      console.error("💡 Supported networks: Ethereum, Base, Core, Polygon, Arbitrum, Optimism, Avalanche, BNB Chain");
      return false;
    }

    console.log(`✅ Contract requires: ${requiredNetwork.chainName} (Chain ID: ${requiredNetwork.chainId})`);

    // Step 2: Get current wallet provider
    const provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    
    // Step 3: Force switch to correct network if needed
    if (Number(network.chainId) !== requiredNetwork.chainId) {
      console.warn(`⚠️ Wrong network: ${network.name} (${network.chainId})`);
      console.log(`🔄 Forcing switch to ${requiredNetwork.chainName}...`);
      
      try {
        await enforceNetwork(requiredNetwork.chainId, requiredNetwork);
        
        // Refresh provider after network switch
        await new Promise(resolve => setTimeout(resolve, 1000));
        const newProvider = new ethers.BrowserProvider(window.ethereum);
        const newNetwork = await newProvider.getNetwork();
        
        if (Number(newNetwork.chainId) !== requiredNetwork.chainId) {
          console.error("❌ Network switch failed");
          return false;
        }
        
        console.log(`✅ Successfully switched to ${requiredNetwork.chainName}`);
      } catch (err: any) {
        console.error("❌ Network enforcement failed:", err.message);
        return false;
      }
    }

    // Step 4: Proceed with transaction on correct network
    const signer = await provider.getSigner();

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