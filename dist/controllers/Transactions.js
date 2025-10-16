import { ethers, parseUnits } from "ethers";
import tokenAbi from "../config/ERC20_ABI.json";
import { CoinbaseWalletSDK } from "@coinbase/wallet-sdk";
const tokenAddress = process.env.NEXT_PUBLIC_TOKENADDRESS || "";
const rpcUrl = process.env.NEXT_PUBLIC_RPC_ENDPOINT || "https://mainnet.base.org";
// ⚙️ Set your expected network
const EXPECTED_CHAIN_ID = 8453; // Base mainnet
const EXPECTED_CHAIN_NAME = "Base Mainnet";
export default async function CordyStackTrans(address, cost) {
    if (!address) {
        console.error("Address Not Found");
        return false;
    }
    try {
        // ✅ Initialize Coinbase Wallet SDK
        const coinbase = new CoinbaseWalletSDK({
            appName: "Cordy Minikit",
            appLogoUrl: "https://cordy-stack-x.vercel.app/logo.png",
        });
        // ✅ Create provider linked to Base RPC
        const ethereum = coinbase.makeWeb3Provider({ options: "all" });
        const provider = new ethers.BrowserProvider(ethereum);
        const signer = await provider.getSigner();
        // 🧠 Step 1: Strictly enforce the correct network
        const network = await provider.getNetwork();
        if (Number(network.chainId) !== EXPECTED_CHAIN_ID) {
            console.warn(`⚠️ Wrong network detected: ${network.name} (${network.chainId}). Expected ${EXPECTED_CHAIN_NAME} (${EXPECTED_CHAIN_ID}).`);
            // Try to auto-switch chain if wallet supports it
            try {
                await ethereum.request({
                    method: "wallet_switchEthereumChain",
                    params: [{ chainId: ethers.toBeHex(EXPECTED_CHAIN_ID) }],
                });
                console.log(`✅ Switched to ${EXPECTED_CHAIN_NAME}`);
            }
            catch (switchError) {
                // If the network isn’t added, request to add it
                if (switchError.code === 4902) {
                    try {
                        await ethereum.request({
                            method: "wallet_addEthereumChain",
                            params: [
                                {
                                    chainId: ethers.toBeHex(EXPECTED_CHAIN_ID),
                                    chainName: EXPECTED_CHAIN_NAME,
                                    nativeCurrency: {
                                        name: "Ethereum",
                                        symbol: "ETH",
                                        decimals: 18,
                                    },
                                    rpcUrls: [rpcUrl],
                                    blockExplorerUrls: ["https://basescan.org/"]
                                }
                            ]
                        });
                        console.log(`✅ Added and switched to ${EXPECTED_CHAIN_NAME}`);
                    }
                    catch (addError) {
                        console.error("❌ Failed to add network:", addError);
                        return false;
                    }
                }
                else {
                    console.error("❌ Network switch failed or rejected by user.");
                    return false;
                }
            }
        }
        // ✅ Set up contracts
        const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, signer);
        const decimals = 18;
        const amount = parseUnits(String(cost), decimals);
        // ✅ Read balance safely from Base network
        const readProvider = new ethers.JsonRpcProvider(rpcUrl);
        const readContract = new ethers.Contract(tokenAddress, tokenAbi, readProvider);
        const userAddress = await signer.getAddress();
        const balance = await readContract.balanceOf(userAddress);
        if (balance < amount) {
            console.error("❌ Insufficient token balance.");
            return false;
        }
        // ✅ Execute transfer (now guaranteed on Base)
        const tx = await tokenContract.transfer(address, amount);
        const receipt = await tx.wait();
        if (receipt.status === 1) {
            console.log("✅ Transaction Complete! TX hash:", receipt.hash);
            return true;
        }
        else {
            console.error("❌ Transaction failed:", receipt);
            return false;
        }
    }
    catch (err) {
        console.error("Transaction error:", err);
        return false;
    }
}
