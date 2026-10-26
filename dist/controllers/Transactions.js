"use client";
import { ethers, parseUnits } from 'ethers';
import { Horizon, Asset, BASE_FEE, Memo, Operation, TransactionBuilder } from "@stellar/stellar-sdk";
import { getNetworkDetails, requestAccess, signTransaction as freighterSignTransaction } from "@stellar/freighter-api";
import tokenAbi from '../config/ERC20_ABI.json';
import { getCordyRuntimeConfig } from '../client/runtimeConfig';
/** @deprecated Use `cordy.transfer(amount, recipient, { asset })` instead. */
export default async function CordyStackTrans(address, cost) {
    if (!address) {
        console.error("Address Not Found");
        return false;
    }
    try {
        const runtimeConfig = getCordyRuntimeConfig();
        const defaultNetwork = runtimeConfig?.networks?.[0];
        const defaultAsset = runtimeConfig?.evm?.find((asset) => (asset.chainId ?? defaultNetwork?.chainId) === defaultNetwork?.chainId && asset.contractAddress);
        const tokenAddress = defaultAsset?.contractAddress || "";
        const rpcEndpoint = defaultAsset?.rpcUrl || defaultNetwork?.rpcUrl || "";
        const ethereum = window?.ethereum;
        if (!ethereum) {
            console.error("Ethereum provider not found");
            return false;
        }
        const provider = new ethers.BrowserProvider(ethereum);
        const signer = await provider.getSigner();
        if (!tokenAddress) {
            console.error("No EVM token is configured in the assets JSON");
            return false;
        }
        if (!rpcEndpoint) {
            console.error("No EVM network RPC is configured in the assets JSON");
            return false;
        }
        const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, signer);
        const decimals = 18;
        const amount = parseUnits(String(cost), decimals);
        const balance = await tokenContract.balanceOf(await signer.getAddress());
        if (balance < amount) {
            console.log("Insuficient Funds");
            return false;
        }
        const tx = await tokenContract.transfer(address, amount);
        const receipt = await tx.wait();
        const txHash = receipt?.hash || tx.hash;
        if (receipt?.status === 1 || txHash) {
            console.log("Transaction Complete TX hash", txHash || receipt);
            return true;
        }
        else {
            console.log("Transaction Failed", receipt);
            return false;
        }
    }
    catch (err) {
        console.error(err);
        return false;
    }
}
;
/** @deprecated Use `cordy.transfer(amount, recipient, { asset: "XLM", memo })` instead. */
export async function CordyStackTransStellar(address, cost, options = {}) {
    if (!address) {
        console.error("Address Not Found");
        return false;
    }
    if (!Number.isFinite(cost) || cost <= 0) {
        console.error("Stellar amount must be greater than 0");
        return false;
    }
    if (typeof window === "undefined") {
        console.error("Stellar transactions require a browser wallet");
        return false;
    }
    try {
        const stellarConfig = getCordyRuntimeConfig()?.stellarNetwork;
        if (!stellarConfig?.horizonUrl || !stellarConfig.networkPassphrase) {
            console.error("Stellar network configuration is missing from the assets JSON");
            return false;
        }
        const access = await requestAccess();
        const sourceAddress = options.source || access.address;
        if (!sourceAddress) {
            console.error("Stellar source address not found");
            return false;
        }
        const networkDetails = await getNetworkDetails();
        const networkPassphrase = networkDetails.networkPassphrase || stellarConfig.networkPassphrase;
        if (!networkPassphrase) {
            console.error("Stellar network passphrase not found");
            return false;
        }
        if (networkDetails.networkPassphrase && networkDetails.networkPassphrase !== stellarConfig.networkPassphrase) {
            console.error("Stellar network mismatch. Expected", stellarConfig.networkPassphrase, "got", networkDetails.networkPassphrase);
            return false;
        }
        const server = new Horizon.Server(stellarConfig.horizonUrl);
        const sourceAccount = await server.loadAccount(sourceAddress);
        const asset = Asset.native();
        const payment = Operation.payment({
            destination: address,
            asset,
            amount: cost.toFixed(7),
        });
        const builder = new TransactionBuilder(sourceAccount, {
            fee: BASE_FEE,
            networkPassphrase,
        })
            .addOperation(payment)
            .setTimeout(180);
        const memoText = options.memo?.trim();
        if (memoText) {
            builder.addMemo(Memo.text(memoText.slice(0, 28)));
        }
        const unsignedTx = builder.build();
        const { signedTxXdr, error } = await freighterSignTransaction(unsignedTx.toXDR(), {
            networkPassphrase,
            address: sourceAddress,
        });
        if (error || !signedTxXdr) {
            console.error("Stellar signing failed", error);
            return false;
        }
        const signedTx = TransactionBuilder.fromXDR(signedTxXdr, networkPassphrase);
        const receipt = await server.submitTransaction(signedTx);
        if (receipt?.successful && receipt?.hash) {
            console.log("Stellar transaction complete TX hash", receipt.hash);
            return true;
        }
        console.log("Stellar transaction failed", receipt);
        return false;
    }
    catch (err) {
        console.error(err);
        return false;
    }
}
