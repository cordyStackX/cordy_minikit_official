import { BrowserProvider, Contract, isAddress, parseUnits, type Eip1193Provider } from "ethers";
import { Address, Contract as StellarContract, nativeToScVal, rpc, StrKey, TransactionBuilder, xdr } from "@stellar/stellar-sdk";
import { getNetworkDetails, requestAccess, signTransaction as freighterSignTransaction } from "@stellar/freighter-api";
import type {
  CordyBridgeRouteConfig,
} from "../client/runtimeConfig";
import type { CordyBridgeResult } from "../client/transfer";
import { getCordyRuntimeConfig } from "../client/runtimeConfig";

type CordyBridgeSide = "internal" | "external";
import { getActiveWagmiConfig } from "../config/walletConfig";

async function evmStep<T>(step: string, action: () => Promise<T>): Promise<T> {
  try {
    return await action();
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Could not ${step}. Check your wallet network and RPC access. ${detail}`);
  }
}

function requireEvmValue<T>(value: T | null | undefined, step: string): T {
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
];
const EMPTY_DESTINATION_CALLER = `0x${"00".repeat(32)}`;

function toBytes32(value: string): string {
  if (!isAddress(value)) throw new Error("CCTP EVM recipients must be valid EVM addresses.");
  return `0x${value.slice(2).padStart(64, "0")}`;
}

function stellarContractToBytes32(value: string): string {
  if (!StrKey.isValidContract(value)) {
    throw new Error("CCTP Stellar recipients require a valid CctpForwarder contract address.");
  }
  return `0x${Buffer.from(StrKey.decodeContract(value)).toString("hex")}`;
}

function buildForwarderHook(recipient: string): string {
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

function requireCctpArgument(
  value: string | number | bigint | null | undefined,
  name: string,
): string | number | bigint {
  if (value === "" || value === null || value === undefined) {
    throw new Error(`CCTP ${name} is missing.`);
  }
  return value;
}

function evmAddressBytes32(value: string): xdr.ScVal {
    if (!isAddress(value)) throw new Error("CCTP EVM recipients must be valid EVM addresses.");
    return xdr.ScVal.scvBytes(Buffer.from(value.slice(2).padStart(64, "0"), "hex"));
  }

async function submitStellarSorobanTransaction(
    server: rpc.Server,
    contractId: string,
    method: string,
    args: xdr.ScVal[],
    networkPassphrase: string,
    sourceAddress: string,
  ): Promise<string> {
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
    if (result.status === "ERROR") throw new Error(`Stellar transaction submission failed: ${JSON.stringify(result)}`);
    let completed = await server.getTransaction(result.hash);
    while (completed.status === "NOT_FOUND") {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      completed = await server.getTransaction(result.hash);
    }
    if (completed.status !== "SUCCESS") throw new Error(`Stellar transaction failed: ${JSON.stringify(completed)}`);
    return result.hash;
  }

async function waitForCctpAttestation(sourceDomain: number, transactionHash: string): Promise<{ message: string; attestation: string }> {
    const baseUrl = "https://iris-api-sandbox.circle.com/v2/messages";
    for (let attempt = 0; attempt < 60; attempt += 1) {
      const response = await fetch(`${baseUrl}/${sourceDomain}?transactionHash=${encodeURIComponent(transactionHash)}`);
      if (response.ok) {
        const data = await response.json() as { messages?: Array<{ status?: string; message?: string; attestation?: string }> };
        const message = data.messages?.[0];
        if (message?.status === "complete" && message.message && message.attestation) {
          return { message: message.message, attestation: message.attestation };
        }
      } else if (response.status !== 404) {
        throw new Error(`Circle attestation request failed with HTTP ${response.status}.`);
      }
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
    throw new Error("Circle attestation was not available within five minutes.");
  }

  async function getDestinationEvmWallet(destination: CordyBridgeRouteConfig["external"] | CordyBridgeRouteConfig["internal"]) {
    const walletConfig = getActiveWagmiConfig();
    const current = walletConfig.state.current;
    const connection = current ? walletConfig.state.connections.get(current) : undefined;
    if (!connection) {
      throw new Error("Connect an EVM wallet on the destination network before starting the Stellar CCTP transfer.");
    }

    const rawProvider = await connection.connector.getProvider();
    let provider = new BrowserProvider(rawProvider as Eip1193Provider);
    const chain = await evmStep(`read the connected wallet chain for ${destination.networkName}`, () => provider.getNetwork());
    if (destination.chainId === undefined || Number(chain.chainId) !== destination.chainId) {
      try {
        await provider.send("wallet_switchEthereumChain", [{
          chainId: `0x${destination.chainId!.toString(16)}`,
        }]);
      } catch (error) {
        const message = error instanceof Error ? error.message : "The wallet rejected the network switch.";
        throw new Error(`Switch the connected EVM wallet to ${destination.networkName} to continue: ${message}`);
      }
      const switchedChain = await provider.getNetwork();
      if (Number(switchedChain.chainId) !== destination.chainId) {
        throw new Error(`The connected EVM wallet is not on ${destination.networkName}.`);
      }
      provider = new BrowserProvider(rawProvider as Eip1193Provider);
    }
    if (!connection.accounts[0]) {
      throw new Error("The connected EVM wallet has no active account.");
    }

    return { walletConfig, connection, provider };
  }

  async function disconnectEvmWallets(walletConfig: ReturnType<typeof getActiveWagmiConfig>): Promise<void> {
    const { disconnect } = await import("wagmi/actions");
    const connections = Array.from(walletConfig.state.connections.values());
    for (const connection of connections) {
      await disconnect(walletConfig, { connector: connection.connector });
    }
  }

  async function bridgeStellarToEvm(
    amount: string,
    from: CordyBridgeSide,
    to: CordyBridgeSide,
    recipient: string,
    route: CordyBridgeRouteConfig,
  ): Promise<CordyBridgeResult> {
    const source = route[from];
    const destination = route[to];
    const stellarConfig = getCordyRuntimeConfig()?.stellarNetwork;
    if (!source || !destination || source.networkType !== "stellar" || destination.networkType !== "evm") {
      throw new Error("CCTP Stellar source requires a Stellar source and EVM destination.");
    }
    if (!isAddress(recipient)) throw new Error("The CCTP destination must be a valid EVM address.");
    if (source.domain === undefined || !source.tokenMessengerMinter || !source.tokenAddress ||
        destination.domain === undefined || !destination.messageTransmitter) {
      throw new Error("Configure Stellar tokenAddress/tokenMessengerMinter and EVM domain/messageTransmitter for CCTP.");
    }
    if (!stellarConfig?.sorobanRpcUrl) {
      throw new Error("Configure stellarNetwork.sorobanRpcUrl for Stellar CCTP.");
    }
    const destinationWallet = await getDestinationEvmWallet(destination);
    const access = await requestAccess();
    const sourceAddress = access.address;
    if (!sourceAddress) throw new Error("No Stellar wallet account is available.");
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
    const approveHash = await submitStellarSorobanTransaction(server, source.tokenAddress, "approve", [
      owner,
      messenger,
      nativeToScVal(amountIn, { type: "i128" }),
      nativeToScVal(latestLedger.sequence + 100_000, { type: "u32" }),
    ], networkPassphrase, sourceAddress);
    const burnHash = await submitStellarSorobanTransaction(server, source.tokenMessengerMinter, "deposit_for_burn", [
      owner,
      nativeToScVal(amountIn, { type: "i128" }),
      nativeToScVal(destination.domain, { type: "u32" }),
      evmAddressBytes32(recipient),
      new Address(source.tokenAddress).toScVal(),
      xdr.ScVal.scvBytes(Buffer.alloc(32)),
      nativeToScVal(0n, { type: "i128" }),
      nativeToScVal(2000, { type: "u32" }),
    ], networkPassphrase, sourceAddress);
    const attestation = await waitForCctpAttestation(source.domain, burnHash);

    const signer = await destinationWallet.provider.getSigner(destinationWallet.connection.accounts[0]);
    const transmitter = new Contract(destination.messageTransmitter, MESSAGE_TRANSMITTER_ABI, signer);
    const mintTransaction = await transmitter.receiveMessage(attestation.message, attestation.attestation);
    const receipt = await mintTransaction.wait();
    if (!receipt || receipt.status !== 1) throw new Error("EVM CCTP mint transaction failed.");
    await disconnectEvmWallets(destinationWallet.walletConfig);
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
      transactionHash: receipt.hash || mintTransaction.hash,
      status: "submitted",
      approvalTransactionHash: approveHash,
    };
}

export async function cctpBridge(
  amount: string,
  from: CordyBridgeSide,
  to: CordyBridgeSide,
  recipient: string,
  route: CordyBridgeRouteConfig,
): Promise<CordyBridgeResult> {
  const source = route[from];
  const destination = route[to];
  if (!source || !destination) throw new Error("CCTP route source and destination are required.");
  if (source.networkType === "stellar") return bridgeStellarToEvm(amount, from, to, recipient, route);
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
  if (!connection) throw new Error("No EVM wallet is currently connected.");
  const rawProvider = await connection.connector.getProvider();
  let provider = new BrowserProvider(rawProvider as Eip1193Provider);
  let chain = await evmStep(`read the connected wallet chain for ${source.networkName}`, () => provider.getNetwork());
  if (Number(chain.chainId) !== source.chainId) {
    await evmStep(`switch the connected wallet to ${source.networkName}`, () => provider.send("wallet_switchEthereumChain", [{
      chainId: `0x${source.chainId!.toString(16)}`,
    }]));
    provider = new BrowserProvider(rawProvider as Eip1193Provider);
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
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 18) throw new Error("The CCTP token returned invalid decimals.");
  const amountIn = parseUnits(amount, decimals);
  const balance = requireEvmValue(
    await evmStep(`read ${source.assetSymbol} balance`, () => token.balanceOf(sender)),
    `read ${source.assetSymbol} balance`,
  );
  if (BigInt(balance.toString()) < amountIn) {
    throw new Error(`Insufficient ${source.assetSymbol} balance for CCTP.`);
  }
  const allowanceValue = requireEvmValue(
    await evmStep(`read ${source.assetSymbol} allowance`, () => token.allowance(sender, source.tokenMessenger)),
    `read ${source.assetSymbol} allowance`,
  );
  const allowance = BigInt(allowanceValue.toString());
  let approvalTransactionHash: string | undefined;
  if (allowance < amountIn) {
    const approval = await evmStep(`submit ${source.assetSymbol} approval`, () => token.approve(source.tokenMessenger, amountIn));
    const receipt = await evmStep<{ status: number; hash: string } | null>(
      "wait for the EVM approval receipt",
      () => approval.wait(),
    );
    if (!receipt || receipt.status !== 1) throw new Error("CCTP token approval failed.");
    approvalTransactionHash = receipt.hash || approval.hash;
  }

  let transaction;
  const destinationDomain = requireCctpArgument(destination.domain, "destination domain");
  const maxFee = 0n;
  const minFinalityThreshold = 2000;
  if (destination.networkType === "stellar") {
    const forwarder = stellarContractToBytes32(destination.cctpForwarder!);
    const hookData = buildForwarderHook(recipient);
    transaction = await evmStep("submit the EVM-to-Stellar CCTP burn", () => messenger.depositForBurnWithHook(
      amountIn,
      destinationDomain,
      forwarder,
      source.tokenAddress,
      EMPTY_DESTINATION_CALLER,
      maxFee,
      minFinalityThreshold,
      hookData,
    ));
  } else {
    const mintRecipient = toBytes32(recipient);
    transaction = await evmStep("submit the EVM CCTP burn", () => messenger.depositForBurn(
      amountIn,
      destinationDomain,
      mintRecipient,
      source.tokenAddress,
      EMPTY_DESTINATION_CALLER,
      maxFee,
      minFinalityThreshold,
    ));
  }
  const receipt = await evmStep<{ status: number; hash: string } | null>(
    "wait for the EVM burn receipt",
    () => transaction.wait(),
  );
  if (!receipt || receipt.status !== 1) throw new Error("CCTP burn transaction failed.");
  let disconnectWarning: string | undefined;
  try {
    await disconnectEvmWallets(walletConfig);
  } catch (error) {
    disconnectWarning = error instanceof Error
      ? `The bridge completed, but the EVM wallet could not be disconnected: ${error.message}`
      : "The bridge completed, but the EVM wallet could not be disconnected.";
  }
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
    ...(disconnectWarning ? { warning: disconnectWarning } : {}),
  };
}
