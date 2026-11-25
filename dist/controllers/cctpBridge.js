import { BrowserProvider, Contract, isAddress, parseUnits } from "ethers";
import { Address, Contract as StellarContract, nativeToScVal, rpc, StrKey, TransactionBuilder, xdr } from "@stellar/stellar-sdk";
import { getNetworkDetails, requestAccess, signTransaction as freighterSignTransaction } from "@stellar/freighter-api";
import { getCordyRuntimeConfig } from "../client/runtimeConfig";
import { getActiveWagmiConfig } from "../config/walletConfig";
async function evmStep(step, action) {
    try {
        return await action();
    }
    catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        throw new Error(`Could not ${step}. Check your wallet network and RPC access. ${detail}`);
    }
}
function requireEvmValue(value, step) {
    if (value === null || value === undefined) {
        throw new Error(`Could not ${step}. The connected wallet provider returned no value.`);
    }
    return value;
}
const CCTP_TOKEN_ABI = [
    "function allowance(address owner,address spender) view returns (uint256)",
    "function approve(address spender,uint256 amount) returns (bool)",
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
];
const CCTP_MESSENGER_ABI = [
    "function depositForBurn(uint256 amount,uint32 destinationDomain,bytes32 mintRecipient,address burnToken,bytes32 destinationCaller,uint256 maxFee,uint32 minFinalityThreshold)",
    "function depositForBurnWithHook(uint256 amount,uint32 destinationDomain,bytes32 mintRecipient,address burnToken,bytes32 destinationCaller,uint256 maxFee,uint32 minFinalityThreshold,bytes hookData)",
];
const MESSAGE_TRANSMITTER_ABI = [
    "function receiveMessage(bytes message,bytes attestation)",
    "function usedNonces(bytes32 nonce) view returns (bool)",
];
const EMPTY_DESTINATION_CALLER = `0x${"00".repeat(32)}`;
const STELLAR_CCTP_RECOVERY_KEY = "cordy_minikit_stellar_cctp_recovery";
const STELLAR_CONFIRMATION_POLL_INTERVAL_MS = 2000;
const STELLAR_CONFIRMATION_MAX_POLLS = 60;
const CCTP_MINT_LOCK_TTL_MS = 15 * 60 * 1000;
const activeCctpMints = new Set();
function readStellarCctpRecoveryMap() {
    try {
        const stored = window.localStorage.getItem(STELLAR_CCTP_RECOVERY_KEY);
        if (!stored)
            return {};
        const parsed = JSON.parse(stored);
        const legacyRecord = parsed;
        if (typeof legacyRecord.burnTransactionHash === "string") {
            return { [legacyRecord.burnTransactionHash]: legacyRecord };
        }
        return parsed;
    }
    catch {
        return {};
    }
}
export function getStellarCctpRecoveryRecords() {
    return Object.values(readStellarCctpRecoveryMap()).filter((record) => Boolean(record?.burnTransactionHash && record?.routeId));
}
function saveStellarCctpRecoveryRecord(record) {
    const records = readStellarCctpRecoveryMap();
    records[record.burnTransactionHash] = record;
    window.localStorage.setItem(STELLAR_CCTP_RECOVERY_KEY, JSON.stringify(records));
}
export function removeStellarCctpRecoveryRecord(burnHash) {
    const records = readStellarCctpRecoveryMap();
    delete records[burnHash];
    try {
        if (Object.keys(records).length)
            window.localStorage.setItem(STELLAR_CCTP_RECOVERY_KEY, JSON.stringify(records));
        else
            window.localStorage.removeItem(STELLAR_CCTP_RECOVERY_KEY);
    }
    catch { /* Ignore storage cleanup failures. */ }
}
class CctpMintPendingError extends Error {
    constructor(burnTransactionHash, mintTransactionHash) {
        super(`Destination mint recovery for burn ${burnTransactionHash} is already in progress. Check the pending wallet transaction before retrying.`);
        this.burnTransactionHash = burnTransactionHash;
        this.mintTransactionHash = mintTransactionHash;
        this.name = "CctpMintPendingError";
    }
}
class StellarTransactionPendingError extends Error {
    constructor(transactionHash, detail) {
        super(detail
            ? `Stellar transaction ${transactionHash} was submitted, but confirmation could not be checked: ${detail}`
            : `Stellar transaction ${transactionHash} was submitted but is still unconfirmed after ${STELLAR_CONFIRMATION_MAX_POLLS * STELLAR_CONFIRMATION_POLL_INTERVAL_MS / 1000} seconds.`);
        this.transactionHash = transactionHash;
        this.name = "StellarTransactionPendingError";
    }
}
async function getConnectedEvmProvider(connection) {
    const connector = connection.connector;
    if (typeof connector.getProvider === "function") {
        return await connector.getProvider();
    }
    const injectedProvider = window.ethereum;
    if (injectedProvider)
        return injectedProvider;
    throw new Error("The connected EVM wallet provider is unavailable. Reconnect the destination wallet and resume the bridge.");
}
function toBytes32(value) {
    if (!isAddress(value))
        throw new Error("CCTP EVM recipients must be valid EVM addresses.");
    return `0x${value.slice(2).padStart(64, "0")}`;
}
function stellarContractToBytes32(value) {
    if (!StrKey.isValidContract(value)) {
        throw new Error("CCTP Stellar recipients require a valid CctpForwarder contract address.");
    }
    return `0x${Buffer.from(StrKey.decodeContract(value)).toString("hex")}`;
}
function buildForwarderHook(recipient) {
    if (!StrKey.isValidEd25519PublicKey(recipient) &&
        !StrKey.isValidContract(recipient) &&
        !StrKey.isValidMed25519PublicKey(recipient)) {
        throw new Error("CCTP Stellar recipients must be valid G..., M..., or C... addresses.");
    }
    const encoded = Buffer.from(recipient, "utf8");
    const hook = Buffer.alloc(32 + encoded.length);
    hook.writeUInt32BE(0, 24);
    hook.writeUInt32BE(encoded.length, 28);
    encoded.copy(hook, 32);
    return `0x${hook.toString("hex")}`;
}
function requireCctpArgument(value, name) {
    if (value === "" || value === null || value === undefined) {
        throw new Error(`CCTP ${name} is missing.`);
    }
    return value;
}
function evmAddressBytes32(value) {
    if (!isAddress(value))
        throw new Error("CCTP EVM recipients must be valid EVM addresses.");
    return xdr.ScVal.scvBytes(Buffer.from(value.slice(2).padStart(64, "0"), "hex"));
}
async function submitStellarSorobanTransaction(server, contractId, method, args, networkPassphrase, sourceAddress, onSubmitted) {
    const account = await server.getAccount(sourceAddress);
    const transaction = new TransactionBuilder(account, {
        fee: "10000000",
        networkPassphrase,
    })
        .addOperation(new StellarContract(contractId).call(method, ...args))
        .setTimeout(120)
        .build();
    const simulation = await server.simulateTransaction(transaction);
    if (rpc.Api.isSimulationError(simulation)) {
        throw new Error(`Stellar Soroban simulation failed: ${JSON.stringify(simulation)}`);
    }
    const prepared = rpc.assembleTransaction(transaction, simulation).build();
    const signed = await freighterSignTransaction(prepared.toXDR(), {
        networkPassphrase,
        address: sourceAddress,
    });
    if (signed.error || !signed.signedTxXdr) {
        throw new Error(signed.error?.message || "Stellar wallet signing was rejected.");
    }
    const result = await server.sendTransaction(TransactionBuilder.fromXDR(signed.signedTxXdr, networkPassphrase));
    if (result.status === "ERROR")
        throw new Error(`Stellar transaction submission failed: ${JSON.stringify(result)}`);
    onSubmitted?.(result.hash);
    let completed;
    try {
        completed = await server.getTransaction(result.hash);
        for (let poll = 0; completed.status === "NOT_FOUND" && poll < STELLAR_CONFIRMATION_MAX_POLLS; poll += 1) {
            await new Promise((resolve) => setTimeout(resolve, STELLAR_CONFIRMATION_POLL_INTERVAL_MS));
            completed = await server.getTransaction(result.hash);
        }
    }
    catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        throw new StellarTransactionPendingError(result.hash, detail);
    }
    if (completed.status === "NOT_FOUND")
        throw new StellarTransactionPendingError(result.hash);
    if (completed.status !== "SUCCESS")
        throw new Error(`Stellar transaction failed: ${JSON.stringify(completed)}`);
    return result.hash;
}
async function waitForCctpAttestation(sourceDomain, transactionHash) {
    const baseUrl = "https://iris-api-sandbox.circle.com/v2/messages";
    for (let attempt = 0; attempt < 60; attempt += 1) {
        const response = await fetch(`${baseUrl}/${sourceDomain}?transactionHash=${encodeURIComponent(transactionHash)}`);
        if (response.ok) {
            const data = await response.json();
            const message = data.messages?.[0];
            if (message?.status === "complete" && message.message && message.attestation) {
                return { message: message.message, attestation: message.attestation };
            }
        }
        else if (response.status !== 404) {
            throw new Error(`Circle attestation request failed with HTTP ${response.status}.`);
        }
        await new Promise((resolve) => setTimeout(resolve, 5000));
    }
    throw new Error("Circle attestation was not available within five minutes.");
}
async function getDestinationEvmWallet(destination) {
    const walletConfig = getActiveWagmiConfig();
    const current = walletConfig.state.current;
    const connection = current ? walletConfig.state.connections.get(current) : undefined;
    if (!connection) {
        throw new Error("Connect an EVM wallet on the destination network before starting the Stellar CCTP transfer.");
    }
    const rawProvider = await getConnectedEvmProvider(connection);
    let provider = new BrowserProvider(rawProvider);
    const chain = await evmStep(`read the connected wallet chain for ${destination.networkName}`, () => provider.getNetwork());
    if (destination.chainId === undefined || Number(chain.chainId) !== destination.chainId) {
        try {
            await provider.send("wallet_switchEthereumChain", [{
                    chainId: `0x${destination.chainId.toString(16)}`,
                }]);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "The wallet rejected the network switch.";
            throw new Error(`Switch the connected EVM wallet to ${destination.networkName} to continue: ${message}`);
        }
        const switchedChain = await provider.getNetwork();
        if (Number(switchedChain.chainId) !== destination.chainId) {
            throw new Error(`The connected EVM wallet is not on ${destination.networkName}.`);
        }
        provider = new BrowserProvider(rawProvider);
    }
    if (!connection.accounts[0]) {
        throw new Error("The connected EVM wallet has no active account.");
    }
    return { walletConfig, connection, provider };
}
async function bridgeStellarToEvm(amount, from, to, recipient, route) {
    const source = route[from];
    const destination = route[to];
    const stellarConfig = getCordyRuntimeConfig()?.stellarNetwork;
    if (!source || !destination || source.networkType !== "stellar" || destination.networkType !== "evm") {
        throw new Error("CCTP Stellar source requires a Stellar source and EVM destination.");
    }
    if (!isAddress(recipient))
        throw new Error("The CCTP destination must be a valid EVM address.");
    if (source.domain === undefined || !source.tokenMessengerMinter || !source.tokenAddress ||
        destination.domain === undefined || !destination.messageTransmitter) {
        throw new Error("Configure Stellar tokenAddress/tokenMessengerMinter and EVM domain/messageTransmitter for CCTP.");
    }
    if (!stellarConfig?.sorobanRpcUrl) {
        throw new Error("Configure stellarNetwork.sorobanRpcUrl for Stellar CCTP.");
    }
    const destinationWallet = await getDestinationEvmWallet(destination);
    const pendingRecovery = getStellarCctpRecoveryRecords().find((record) => record.routeId === route.id && record.from === from && record.to === to);
    if (pendingRecovery) {
        try {
            const resumed = await finishStellarToEvm(pendingRecovery.burnTransactionHash, source, destination, destinationWallet);
            removeStellarCctpRecoveryRecord(pendingRecovery.burnTransactionHash);
            return {
                success: true,
                asset: pendingRecovery.asset ?? source.assetSymbol,
                from,
                to,
                fromNetwork: pendingRecovery.fromNetwork ?? source.networkName,
                toNetwork: pendingRecovery.toNetwork ?? destination.networkName,
                routeId: route.id,
                routeName: route.name,
                amount: pendingRecovery.amount,
                burnTransactionHash: pendingRecovery.burnTransactionHash,
                transactionHash: resumed.hash,
                status: "submitted",
                ...(resumed.alreadyReceived ? { warning: "This CCTP message was already received on the destination; no additional mint was submitted." } : {}),
            };
        }
        catch (error) {
            const errorDetail = error instanceof Error ? error.message : String(error);
            return {
                success: false,
                ...pendingRecovery,
                status: error instanceof CctpMintPendingError ? "pending" : "burned",
                error: errorDetail,
                errorDetail,
            };
        }
    }
    const access = await requestAccess();
    const sourceAddress = access.address;
    if (!sourceAddress)
        throw new Error("No Stellar wallet account is available.");
    const network = await getNetworkDetails();
    const networkPassphrase = network.networkPassphrase || stellarConfig.networkPassphrase;
    if (networkPassphrase !== stellarConfig.networkPassphrase) {
        throw new Error(`Stellar network mismatch. Expected ${stellarConfig.networkPassphrase}.`);
    }
    const server = new rpc.Server(stellarConfig.sorobanRpcUrl);
    const latestLedger = await server.getLatestLedger();
    const amountIn = parseUnits(amount, 7);
    const owner = new Address(sourceAddress).toScVal();
    const messenger = new Address(source.tokenMessengerMinter).toScVal();
    let approveHash;
    try {
        approveHash = await submitStellarSorobanTransaction(server, source.tokenAddress, "approve", [
            owner,
            messenger,
            nativeToScVal(amountIn, { type: "i128" }),
            nativeToScVal(latestLedger.sequence + 100000, { type: "u32" }),
        ], networkPassphrase, sourceAddress);
    }
    catch (error) {
        if (error instanceof StellarTransactionPendingError) {
            return { success: false, asset: source.assetSymbol, from, to, routeId: route.id, routeName: route.name, amount, status: "pending", transactionHash: error.transactionHash, error: error.message, errorDetail: error.message };
        }
        throw error;
    }
    const recoveryForBurn = (burnTransactionHash) => ({ burnTransactionHash, from, to, routeId: route.id, routeName: route.name, amount, recipient, asset: source.assetSymbol, fromNetwork: source.networkName, toNetwork: destination.networkName });
    let burnHash;
    try {
        burnHash = await submitStellarSorobanTransaction(server, source.tokenMessengerMinter, "deposit_for_burn", [
            owner,
            nativeToScVal(amountIn, { type: "i128" }),
            nativeToScVal(destination.domain, { type: "u32" }),
            evmAddressBytes32(recipient),
            new Address(source.tokenAddress).toScVal(),
            xdr.ScVal.scvBytes(Buffer.alloc(32)),
            nativeToScVal(0n, { type: "i128" }),
            nativeToScVal(2000, { type: "u32" }),
        ], networkPassphrase, sourceAddress, (hash) => {
            try {
                saveStellarCctpRecoveryRecord(recoveryForBurn(hash));
            }
            catch { /* Recovery storage may be unavailable in restricted browsers. */ }
            window.dispatchEvent(new CustomEvent("cordy:stellar-cctp-burn-submitted", { detail: { transactionHash: hash } }));
        });
    }
    catch (error) {
        if (error instanceof StellarTransactionPendingError) {
            const recovery = recoveryForBurn(error.transactionHash);
            try {
                saveStellarCctpRecoveryRecord(recovery);
            }
            catch { /* Recovery storage may be unavailable in restricted browsers. */ }
            return { success: false, ...recovery, status: "pending", transactionHash: error.transactionHash, error: error.message, errorDetail: error.message };
        }
        throw error;
    }
    const recovery = recoveryForBurn(burnHash);
    try {
        saveStellarCctpRecoveryRecord(recovery);
    }
    catch { /* Recovery storage may be unavailable in restricted browsers. */ }
    try {
        const result = await finishStellarToEvm(burnHash, source, destination, destinationWallet);
        removeStellarCctpRecoveryRecord(burnHash);
        return {
            success: true,
            asset: source.assetSymbol,
            from,
            to,
            fromNetwork: source.networkName,
            toNetwork: destination.networkName,
            routeId: route.id,
            routeName: route.name,
            amount,
            transactionHash: result.hash,
            status: "submitted",
            approvalTransactionHash: approveHash,
            burnTransactionHash: burnHash,
            ...(result.alreadyReceived ? { warning: "This CCTP message was already received on the destination; no additional mint was submitted." } : {}),
        };
    }
    catch (error) {
        const errorDetail = error instanceof Error ? error.message : String(error);
        if (error instanceof CctpMintPendingError) {
            return { success: false, ...recovery, status: "pending", transactionHash: error.mintTransactionHash, error: errorDetail, errorDetail };
        }
        return { success: false, ...recovery, status: "burned", error: `The Stellar burn succeeded (${burnHash}), but destination minting did not finish: ${errorDetail}`, errorDetail };
    }
}
async function finishStellarToEvm(burnHash, source, destination, destinationWallet) {
    if (source.domain === undefined || !destination.messageTransmitter)
        throw new Error("The saved CCTP route is missing its source domain or destination transmitter.");
    if (activeCctpMints.has(burnHash))
        throw new CctpMintPendingError(burnHash);
    activeCctpMints.add(burnHash);
    const lockKey = `${STELLAR_CCTP_RECOVERY_KEY}:mint:${burnHash}`;
    let mintTransactionHash;
    let lockWritten = false;
    let transmitter;
    let nonce;
    try {
        const attestation = await waitForCctpAttestation(source.domain, burnHash);
        const signer = await destinationWallet.provider.getSigner(destinationWallet.connection.accounts[0]);
        transmitter = new Contract(destination.messageTransmitter, MESSAGE_TRANSMITTER_ABI, signer);
        if (!/^0x[\da-fA-F]{88,}$/.test(attestation.message))
            throw new Error("Circle returned a malformed CCTP message; its nonce cannot be checked.");
        nonce = `0x${attestation.message.slice(2 + 24, 2 + 24 + 64)}`;
        if (await transmitter.usedNonces(nonce)) {
            try {
                window.localStorage.removeItem(lockKey);
            }
            catch { /* The on-chain nonce is authoritative. */ }
            return { alreadyReceived: true };
        }
        let previousLock;
        try {
            const rawLock = window.localStorage.getItem(lockKey);
            previousLock = rawLock ? JSON.parse(rawLock) : undefined;
        }
        catch { /* Ignore malformed or inaccessible lock data and continue with the nonce check. */ }
        if (previousLock?.expiresAt && previousLock.expiresAt > Date.now()) {
            throw new CctpMintPendingError(burnHash, previousLock.mintTransactionHash);
        }
        const lock = { burnTransactionHash: burnHash, expiresAt: Date.now() + CCTP_MINT_LOCK_TTL_MS };
        try {
            window.localStorage.setItem(lockKey, JSON.stringify(lock));
            lockWritten = true;
        }
        catch { /* In-memory guard still protects retries in this tab. */ }
        const mintTransaction = await transmitter.receiveMessage(attestation.message, attestation.attestation);
        mintTransactionHash = mintTransaction.hash;
        const extendedLock = { ...lock, mintTransactionHash, expiresAt: Date.now() + CCTP_MINT_LOCK_TTL_MS };
        try {
            window.localStorage.setItem(lockKey, JSON.stringify(extendedLock));
            const recovery = readStellarCctpRecoveryMap()[burnHash];
            if (recovery)
                saveStellarCctpRecoveryRecord({ ...recovery, mintTransactionHash });
        }
        catch { /* Keep the persistent pre-submit lock if storage becomes unavailable. */ }
        const receipt = await mintTransaction.wait();
        if (!receipt || receipt.status !== 1)
            throw new Error("EVM CCTP mint transaction failed.");
        try {
            window.localStorage.removeItem(lockKey);
        }
        catch { /* Nonce check protects the next retry. */ }
        return { hash: receipt.hash || mintTransactionHash };
    }
    catch (error) {
        if (lockWritten && !mintTransactionHash) {
            try {
                window.localStorage.removeItem(lockKey);
            }
            catch { /* Ignore lock cleanup failures. */ }
        }
        else if (lockWritten && mintTransactionHash) {
            try {
                const receipt = await destinationWallet.provider.getTransactionReceipt(mintTransactionHash);
                if (receipt && (receipt.status === 0 || (transmitter && nonce && await transmitter.usedNonces(nonce)))) {
                    window.localStorage.removeItem(lockKey);
                }
            }
            catch { /* Keep the lock while transaction outcome remains unknown. */ }
        }
        throw error;
    }
    finally {
        activeCctpMints.delete(burnHash);
    }
}
export async function cctpResumeStellarToEvm(burnHash, route, from, to) {
    const source = route[from];
    const destination = route[to];
    if (!source || source.networkType !== "stellar" || !destination || destination.networkType !== "evm") {
        throw new Error("Recovery requires a Stellar-to-EVM CCTP route.");
    }
    if (!destination.messageTransmitter)
        throw new Error("The destination CCTP message transmitter is not configured.");
    const wallet = await getDestinationEvmWallet(destination);
    const result = await finishStellarToEvm(burnHash, source, destination, wallet);
    return { transactionHash: result.hash, alreadyReceived: result.alreadyReceived };
}
export async function cctpBridge(amount, from, to, recipient, route) {
    const source = route[from];
    const destination = route[to];
    if (!source || !destination)
        throw new Error("CCTP route source and destination are required.");
    if (source.networkType === "stellar")
        return bridgeStellarToEvm(amount, from, to, recipient, route);
    if (source.networkType !== "evm" || source.chainId === undefined || source.domain === undefined || !source.tokenAddress || !source.tokenMessenger) {
        throw new Error("Configure the CCTP EVM source with chainId, domain, tokenAddress, and tokenMessenger.");
    }
    if (destination.networkType === "evm" && (destination.domain === undefined || !isAddress(destination.tokenAddress || ""))) {
        throw new Error("Configure the CCTP EVM destination with domain and a valid tokenAddress.");
    }
    if (destination.networkType === "stellar" && !destination.cctpForwarder) {
        throw new Error("Configure the Stellar CctpForwarder contract for EVM-to-Stellar CCTP.");
    }
    const walletConfig = getActiveWagmiConfig();
    const current = walletConfig.state.current;
    const connection = current ? walletConfig.state.connections.get(current) : undefined;
    if (!connection)
        throw new Error("No EVM wallet is currently connected.");
    const rawProvider = await connection.connector.getProvider();
    let provider = new BrowserProvider(rawProvider);
    let chain = await evmStep(`read the connected wallet chain for ${source.networkName}`, () => provider.getNetwork());
    if (Number(chain.chainId) !== source.chainId) {
        await evmStep(`switch the connected wallet to ${source.networkName}`, () => provider.send("wallet_switchEthereumChain", [{
                chainId: `0x${source.chainId.toString(16)}`,
            }]));
        provider = new BrowserProvider(rawProvider);
        chain = await evmStep(`verify the connected wallet is on ${source.networkName}`, () => provider.getNetwork());
        if (Number(chain.chainId) !== source.chainId) {
            throw new Error(`The connected EVM wallet is not on ${source.networkName}.`);
        }
    }
    const signer = await evmStep("access the connected EVM signer", () => provider.getSigner(connection.accounts[0]));
    const sender = await evmStep("read the connected EVM account", () => signer.getAddress());
    const token = new Contract(source.tokenAddress, CCTP_TOKEN_ABI, signer);
    const messenger = new Contract(source.tokenMessenger, CCTP_MESSENGER_ABI, signer);
    const decimalsValue = await evmStep(`read ${source.assetSymbol} decimals`, () => token.decimals());
    const decimals = Number(requireEvmValue(decimalsValue, `read ${source.assetSymbol} decimals`));
    if (!Number.isInteger(decimals) || decimals < 0 || decimals > 18)
        throw new Error("The CCTP token returned invalid decimals.");
    const amountIn = parseUnits(amount, decimals);
    const balance = requireEvmValue(await evmStep(`read ${source.assetSymbol} balance`, () => token.balanceOf(sender)), `read ${source.assetSymbol} balance`);
    if (BigInt(balance.toString()) < amountIn) {
        throw new Error(`Insufficient ${source.assetSymbol} balance for CCTP.`);
    }
    const allowanceValue = requireEvmValue(await evmStep(`read ${source.assetSymbol} allowance`, () => token.allowance(sender, source.tokenMessenger)), `read ${source.assetSymbol} allowance`);
    const allowance = BigInt(allowanceValue.toString());
    let approvalTransactionHash;
    if (allowance < amountIn) {
        const approval = await evmStep(`submit ${source.assetSymbol} approval`, () => token.approve(source.tokenMessenger, amountIn));
        const receipt = await evmStep("wait for the EVM approval receipt", () => approval.wait());
        if (!receipt || receipt.status !== 1)
            throw new Error("CCTP token approval failed.");
        approvalTransactionHash = receipt.hash || approval.hash;
    }
    let transaction;
    const destinationDomain = requireCctpArgument(destination.domain, "destination domain");
    const maxFee = 0n;
    const minFinalityThreshold = 2000;
    if (destination.networkType === "stellar") {
        const forwarder = stellarContractToBytes32(destination.cctpForwarder);
        const hookData = buildForwarderHook(recipient);
        transaction = await evmStep("submit the EVM-to-Stellar CCTP burn", () => messenger.depositForBurnWithHook(amountIn, destinationDomain, forwarder, source.tokenAddress, EMPTY_DESTINATION_CALLER, maxFee, minFinalityThreshold, hookData));
    }
    else {
        const mintRecipient = toBytes32(recipient);
        transaction = await evmStep("submit the EVM CCTP burn", () => messenger.depositForBurn(amountIn, destinationDomain, mintRecipient, source.tokenAddress, EMPTY_DESTINATION_CALLER, maxFee, minFinalityThreshold));
    }
    const receipt = await evmStep("wait for the EVM burn receipt", () => transaction.wait());
    if (!receipt || receipt.status !== 1)
        throw new Error("CCTP burn transaction failed.");
    return {
        success: true,
        asset: source.assetSymbol,
        from,
        to,
        fromNetwork: source.networkName,
        toNetwork: destination.networkName,
        routeId: route.id,
        routeName: route.name,
        amount,
        ...(approvalTransactionHash ? { approvalTransactionHash } : {}),
        transactionHash: receipt.hash || transaction.hash,
        status: "pending",
    };
}
