import { ethers, parseUnits } from "ethers";
import tokenAbi from "../config/ERC20_ABI.json";
import { CoinbaseWalletSDK } from "@coinbase/wallet-sdk";
const tokenAddress = process.env.NEXT_PUBLIC_TOKENADDRESS || "";
const rpcUrl = process.env.NEXT_PUBLIC_RPC_ENDPOINT || "https://mainnet.base.org";
export default async function CordyStackTrans(address, cost) {
    if (!address) {
        console.error("Address Not Found");
        return false;
    }
    try {
        // ✅ Initialize Coinbase Wallet SDK
        const coinbase = new CoinbaseWalletSDK({
            appName: "Cordy Stack", // any name you want
            appLogoUrl: "https://your-logo.png", // optional
        });
        // ✅ Connect to Coinbase Wallet
        const ethereum = coinbase.makeWeb3Provider({ options: "all", keysUrl: rpcUrl }); // chainId handled by provider or wallet
        const provider = new ethers.BrowserProvider(ethereum);
        const signer = await provider.getSigner();
        const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, signer);
        const decimals = 18;
        const amount = parseUnits(String(cost), decimals);
        // ✅ Always fetch balance using a read-only provider (not signer)
        const readProvider = new ethers.JsonRpcProvider(rpcUrl);
        const readContract = new ethers.Contract(tokenAddress, tokenAbi, readProvider);
        const balance = await readContract.balanceOf(await signer.getAddress());
        if (balance < amount) {
            console.log("Insufficient Funds");
            return false;
        }
        // ✅ Proceed with transfer
        const tx = await tokenContract.transfer(address, amount);
        const receipt = await tx.wait();
        if (receipt.status === 1) {
            console.log("Transaction Complete! TX hash:", receipt.hash);
            return true;
        }
        else {
            console.log("Transaction Failed", receipt);
            return false;
        }
    }
    catch (err) {
        console.error("Transaction error:", err);
        return false;
    }
}
