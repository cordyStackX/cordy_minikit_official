"use client";
import { Asset, BASE_FEE, Horizon, Memo, Networks, Operation, StrKey, TransactionBuilder } from "@stellar/stellar-sdk";
import { getNetworkDetails, requestAccess, signTransaction as freighterSignTransaction } from "@stellar/freighter-api";
import { BrowserProvider, Contract, isAddress, parseUnits } from "ethers";
import { config } from "../config/walletConfig";
import tokenAbi from "../config/ERC20_ABI.json";
const ACTIVE_WALLET_SESSION_KEY = "cordy_minikit_active_wallet_session";
const STELLAR_WALLET_STORAGE_KEY = "cordy_minikit_stellar_wallet";
const stellarRpc = process.env.NEXT_PUBLIC_STELLAR_HORIZON || "https://horizon-testnet.stellar.org";
const stellarNetwork = process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE || Networks.TESTNET;
let configuredAssets;
export function configureCordyAssets({ assets }) {
    if (!assets || (assets.evm !== undefined && !Array.isArray(assets.evm)) ||
        (assets.stellar !== undefined && !Array.isArray(assets.stellar))) {
        throw new Error('Cordy Minikit: "evm" and "stellar" assets must be arrays when provided.');
    }
    configuredAssets = {
        evm: (assets.evm ?? []).map((asset) => ({ ...asset })),
        stellar: (assets.stellar ?? []).map((asset) => ({ ...asset })),
    };
}
function normalizedAmount(amount) {
    const value = String(amount).trim();
    if (!/^\d+(\.\d+)?$/.test(value) || !Number.isFinite(Number(value)) || Number(value) <= 0) {
        throw new Error("Amount must be a positive decimal number.");
    }
    return value;
}
function getActiveWallet() {
    if (typeof window === "undefined")
        throw new Error("Transfers must be started in the browser.");
    const selected = window.localStorage.getItem(ACTIVE_WALLET_SESSION_KEY);
    if (selected === "stellar")
        return "stellar";
    if (selected === "evm")
        return "evm";
    const current = config.state.current;
    if (current && config.state.connections.has(current))
        return "evm";
    try {
        const stored = JSON.parse(window.localStorage.getItem(STELLAR_WALLET_STORAGE_KEY) || "null");
        if (stored?.address)
            return "stellar";
    }
    catch {
        // Ignore invalid stale wallet state and report that no wallet is active below.
    }
    throw new Error("Connect an EVM or Stellar wallet first.");
}
async function transferEvm(amount, recipient, requestedSymbol) {
    if (!isAddress(recipient))
        throw new Error("Recipient must be a valid EVM address.");
    const current = config.state.current;
    const connection = current ? config.state.connections.get(current) : undefined;
    if (!connection)
        throw new Error("No EVM wallet is currently connected.");
    const rawProvider = await connection.connector.getProvider();
    const provider = new BrowserProvider(rawProvider);
    const chain = await provider.getNetwork();
    const chainId = Number(chain.chainId);
    const tokenConfig = requestedSymbol
        ? configuredAssets?.evm?.find((asset) => asset.symbol.toLowerCase() === requestedSymbol.toLowerCase() && asset.chainId === chainId)
        : undefined;
    const fallbackAddress = process.env.NEXT_PUBLIC_TOKENADDRESS || "";
    const contractAddress = tokenConfig?.contractAddress || fallbackAddress;
    if (!contractAddress) {
        throw new Error(`No ${requestedSymbol || "default"} EVM token configured. Add it to the asset JSON or set NEXT_PUBLIC_TOKENADDRESS.`);
    }
    if (!isAddress(contractAddress))
        throw new Error("The configured EVM token contract address is invalid.");
    const signer = await provider.getSigner(connection.accounts[0]);
    const from = await signer.getAddress();
    const token = new Contract(contractAddress, tokenAbi, signer);
    const onchainSymbol = tokenConfig?.symbol || String(await token.symbol());
    if (requestedSymbol && onchainSymbol.toLowerCase() !== requestedSymbol.toLowerCase()) {
        throw new Error(`The fallback token symbol is ${onchainSymbol}, not ${requestedSymbol}. Add ${requestedSymbol} to the asset JSON.`);
    }
    const decimals = tokenConfig?.decimals ?? Number(await token.decimals());
    const value = parseUnits(amount, decimals);
    const balance = BigInt(await token.balanceOf(from));
    if (balance < value)
        throw new Error(`Insufficient ${onchainSymbol} balance for this transfer.`);
    const transaction = await token.transfer(recipient, value);
    const receipt = await transaction.wait();
    if (!receipt || receipt.status !== 1)
        throw new Error("EVM transfer did not complete successfully.");
    return { success: true, asset: onchainSymbol, network: "evm", transactionHash: receipt.hash || transaction.hash };
}
async function transferStellar(amount, recipient, requestedSymbol, memo) {
    if (!StrKey.isValidEd25519PublicKey(recipient))
        throw new Error("Recipient must be a valid Stellar public address.");
    if (!/^\d+(\.\d{1,7})?$/.test(amount))
        throw new Error("Stellar amounts support up to 7 decimal places.");
    const symbol = requestedSymbol || "XLM";
    const access = await requestAccess();
    const sourceAddress = access.address;
    if (!sourceAddress)
        throw new Error("Could not access the connected Stellar wallet.");
    const networkDetails = await getNetworkDetails();
    const networkPassphrase = networkDetails.networkPassphrase || stellarNetwork;
    if (networkDetails.networkPassphrase && networkDetails.networkPassphrase !== stellarNetwork) {
        throw new Error(`Stellar network mismatch. Expected ${stellarNetwork}, got ${networkDetails.networkPassphrase}.`);
    }
    const candidates = (configuredAssets?.stellar ?? []).filter((asset) => asset.symbol.toLowerCase() === symbol.toLowerCase() &&
        (!asset.networkPassphrase || asset.networkPassphrase === networkPassphrase));
    if (candidates.length > 1)
        throw new Error(`More than one ${symbol} asset matches this Stellar network; make the JSON entries unique.`);
    const assetConfig = candidates[0] ??
        (symbol.toLowerCase() === "xlm" ? { symbol: "XLM", type: "native" } : undefined);
    if (!assetConfig)
        throw new Error(`No ${symbol} asset is configured for this Stellar network.`);
    const stellarAsset = assetConfig.type === "native"
        ? Asset.native()
        : new Asset(assetConfig.code, assetConfig.issuer);
    const server = new Horizon.Server(stellarRpc);
    const sourceAccount = await server.loadAccount(sourceAddress);
    const assetBalance = assetConfig.type === "native"
        ? sourceAccount.balances.find((item) => item.asset_type === "native")
        : sourceAccount.balances.find((item) => (item.asset_type === "credit_alphanum4" || item.asset_type === "credit_alphanum12") &&
            item.asset_code === assetConfig.code &&
            item.asset_issuer === assetConfig.issuer);
    if (!assetBalance) {
        throw new Error(assetConfig.type === "native"
            ? `The connected Stellar account has no ${symbol} balance.`
            : `The connected Stellar account has no ${symbol} trustline from the configured issuer.`);
    }
    const requiredBalance = Number(amount) + (assetConfig.type === "native" ? 0.00001 : 0);
    if (Number(assetBalance.balance) < requiredBalance)
        throw new Error(`Insufficient ${symbol} balance for this transfer.`);
    const builder = new TransactionBuilder(sourceAccount, { fee: BASE_FEE, networkPassphrase })
        .addOperation(Operation.payment({ destination: recipient, asset: stellarAsset, amount: Number(amount).toFixed(7) }))
        .setTimeout(180);
    const memoText = memo?.trim();
    if (memoText) {
        if (new TextEncoder().encode(memoText).length > 28)
            throw new Error("Stellar text memos must be 28 bytes or fewer.");
        builder.addMemo(Memo.text(memoText));
    }
    const unsignedTx = builder.build();
    const { signedTxXdr, error } = await freighterSignTransaction(unsignedTx.toXDR(), {
        networkPassphrase,
        address: sourceAddress,
    });
    if (error || !signedTxXdr)
        throw new Error(error?.message || "Stellar wallet signing was rejected.");
    const signedTx = TransactionBuilder.fromXDR(signedTxXdr, networkPassphrase);
    const receipt = await server.submitTransaction(signedTx);
    if (!receipt.successful || !receipt.hash)
        throw new Error("Stellar transfer did not complete successfully.");
    return { success: true, asset: symbol, network: "stellar", transactionHash: receipt.hash };
}
/** Configure a caller-owned JSON asset registry before requesting transfers. */
export function cordy_configure(options) {
    configureCordyAssets(options);
}
/** Send a selected JSON-configured asset using Minikit's active wallet. */
export async function cordy_transfer(amount, recipient, options = {}) {
    try {
        const normalized = normalizedAmount(amount);
        const activeWallet = getActiveWallet();
        return activeWallet === "stellar"
            ? await transferStellar(normalized, recipient, options.asset, options.memo)
            : await transferEvm(normalized, recipient, options.asset);
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Transfer failed.",
        };
    }
}
