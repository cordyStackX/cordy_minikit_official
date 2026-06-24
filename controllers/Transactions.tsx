"use client";
import { ethers, parseUnits } from 'ethers';
import { Horizon, Asset, BASE_FEE, Memo, Networks, Operation, TransactionBuilder } from "@stellar/stellar-sdk";
import { getNetworkDetails, requestAccess, signTransaction as freighterSignTransaction } from "@stellar/freighter-api";
import tokenAbi from '../config/ERC20_ABI.json';

const tokenAddress = process.env.NEXT_PUBLIC_TOKENADDRESS || "";
const rpcEndpoint = process.env.NEXT_PUBLIC_RPC_ENDPOINT || "";
const stellarRpc = process.env.NEXT_PUBLIC_STELLAR_HORIZON || "https://horizon-testnet.stellar.org";
const stellarNetwork = process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE || Networks.TESTNET;

type CordyStackStellarTransOptions = {
  memo?: string;
  source?: string;
};

export default async function CordyStackTrans(address: string, cost: number) {
  if (!address) {
    console.error("Address Not Found");
    return false;
  }

  try {
    const ethereum = window?.ethereum;
    if (!ethereum) {
      console.error("Ethereum provider not found");
      return false;
    }
    const provider = new ethers.BrowserProvider(ethereum);
    const signer = await provider.getSigner();

    if (!tokenAddress) {
      console.error("NEXT_PUBLIC_TOKENADDRESS is not configured");
      return false;
    }

    if (!rpcEndpoint) {
      console.error("NEXT_PUBLIC_RPC_ENDPOINT is not configured");
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
    } else {
      console.log("Transaction Failed", receipt)
      return false;
    }

  } catch (err) {
    console.error(err);

    return false;
  }
};

export async function CordyStackTransStellar(
  address: string,
  cost: number,
  options: CordyStackStellarTransOptions = {}
) {
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
    const access = await requestAccess();
    const sourceAddress = options.source || access.address;

    if (!sourceAddress) {
      console.error("Stellar source address not found");
      return false;
    }

    const networkDetails = await getNetworkDetails();
    const networkPassphrase = networkDetails.networkPassphrase || stellarNetwork;
    if (!networkPassphrase) {
      console.error("Stellar network passphrase not found");
      return false;
    }

    if (networkDetails.networkPassphrase && networkDetails.networkPassphrase !== stellarNetwork) {
      console.error("Stellar network mismatch. Expected", stellarNetwork, "got", networkDetails.networkPassphrase);
      return false;
    }

    const server = new Horizon.Server(stellarRpc);
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
  } catch (err) {
    console.error(err);
    return false;
  }
}
