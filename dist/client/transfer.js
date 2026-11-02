"use client";
import { Asset, BASE_FEE, Horizon, Memo, Operation, StrKey, TransactionBuilder } from "@stellar/stellar-sdk";
import { getNetworkDetails, requestAccess, signTransaction as freighterSignTransaction } from "@stellar/freighter-api";
import { BrowserProvider, Contract, formatUnits, isAddress, JsonRpcProvider, parseUnits } from "ethers";
import { getActiveWagmiConfig } from "../config/walletConfig";
import { readTokenBalance } from "../controllers/Get_Balance";
import loadStellarBalance from "../controllers/loadStellarBalance";
import { cctpBridge } from "../controllers/cctpBridge";
import tokenAbi from "../config/ERC20_ABI.json";
import { setCordyRuntimeConfig } from "./runtimeConfig";
import { waitForBridgeEvmWallet } from "../controllers/bridgeWalletSession";
import { getConfiguredEvmAssets, requireConfiguredEvmNetwork } from "./runtimeConfig";
const ACTIVE_WALLET_SESSION_KEY = "cordy_minikit_active_wallet_session";
const STELLAR_WALLET_STORAGE_KEY = "cordy_minikit_stellar_wallet";
// Bridge deployments and tokens are supplied through the app's bridge configuration.
const BRIDGE_ERC20_ABI = [
    "function allowance(address owner,address spender) view returns (uint256)",
    "function approve(address spender,uint256 amount) returns (bool)",
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
];
const BOT_BRIDGE_ABI = [
    "function deposit(uint256 destinationChainId,bytes32 resourceId,address recipient,uint256 amount) payable",
];
let configuredAssets;
export function configureCordyAssets({ assets }) {
    if (!assets || (assets.networks !== undefined && !Array.isArray(assets.networks)) ||
        (assets.evm !== undefined && (Array.isArray(assets.evm) || typeof assets.evm !== "object")) ||
        (assets.stellar !== undefined && !Array.isArray(assets.stellar))) {
        throw new Error('Cordy Minikit: "networks" and "stellar" must be arrays; "evm" must be grouped by chain ID.');
    }
    configuredAssets = {
        networks: (assets.networks ?? []).map((network) => ({ ...network, nativeCurrency: { ...network.nativeCurrency } })),
        evm: Object.fromEntries(Object.entries(assets.evm ?? {}).map(([chainId, entries]) => [
            chainId,
            entries.map((asset) => ({ ...asset })),
        ])),
        bridge: assets.bridge ? {
            ...assets.bridge,
            internal: assets.bridge.internal ? { ...assets.bridge.internal } : undefined,
            external: assets.bridge.external ? { ...assets.bridge.external } : undefined,
            routes: assets.bridge.routes?.map((route) => ({
                ...route,
                internal: { ...route.internal },
                external: { ...route.external },
            })),
        } : undefined,
        stellar: (assets.stellar ?? []).map((asset) => ({ ...asset })),
        walletConnectProjectId: assets.walletConnectProjectId,
        stellarNetwork: assets.stellarNetwork ? { ...assets.stellarNetwork } : undefined,
    };
    setCordyRuntimeConfig(configuredAssets);
}
function requireStellarNetwork() {
    const network = configuredAssets?.stellarNetwork;
    if (!network?.horizonUrl || !network.networkPassphrase || !configuredAssets?.stellar?.length) {
        throw new Error("Stellar is not configured. Add stellarNetwork and Stellar assets to the JSON passed to ProvidersClientWrapper.");
    }
    return network;
}
function normalizedAmount(amount) {
    const value = String(amount).trim();
    if (!/^\d+(\.\d+)?$/.test(value) || !Number.isFinite(Number(value)) || Number(value) <= 0) {
        throw new Error("Amount must be a positive decimal number.");
    }
    return value;
}
function resolveEvmAsset(requestedSymbol, chainId, networkName) {
    const network = configuredAssets?.networks?.find((candidate) => candidate.chainId === chainId);
    const chainAssets = getConfiguredEvmAssets(configuredAssets).filter((asset) => asset.chainId === chainId) ?? [];
    if (requestedSymbol && network?.nativeCurrency.symbol.toLowerCase() === requestedSymbol.toLowerCase()) {
        return {
            symbol: network.nativeCurrency.symbol,
            type: "native",
            decimals: network.nativeCurrency.decimals,
        };
    }
    const symbol = requestedSymbol || chainAssets.find((asset) => asset.contractAddress)?.symbol || chainAssets[0]?.symbol;
    if (!symbol)
        return undefined;
    const sameSymbol = getConfiguredEvmAssets(configuredAssets).filter((asset) => asset.symbol.toLowerCase() === symbol.toLowerCase());
    const matchingNetwork = sameSymbol.find((asset) => asset.chainId === chainId);
    if (sameSymbol.length > 0 && !matchingNetwork) {
        const chainIds = [...new Set(sameSymbol.map((asset) => asset.chainId))].join(", ");
        throw new Error(`${symbol} is configured for chain ID ${chainIds}, but the connected wallet is on ${networkName} (chain ID ${chainId}). Switch networks or add an asset entry for this chain.`);
    }
    return matchingNetwork;
}
function resolveConfiguredEvmSwapAsset(symbol, chainId) {
    const network = configuredAssets?.networks?.find((candidate) => candidate.chainId === chainId);
    if (network?.nativeCurrency.symbol.toLowerCase() === symbol.toLowerCase()) {
        return {
            symbol: network.nativeCurrency.symbol,
            type: "native",
            decimals: network.nativeCurrency.decimals,
        };
    }
    const matches = getConfiguredEvmAssets(configuredAssets).filter((asset) => asset.symbol.toLowerCase() === symbol.toLowerCase() &&
        asset.chainId === chainId);
    if (matches.length > 1) {
        throw new Error(`More than one ${symbol} asset is configured for chain ID ${chainId}. Keep one entry per asset and network.`);
    }
    if (matches.length === 1)
        return matches[0];
    throw new Error(`${symbol} is not configured for EVM chain ID ${chainId}. Add it to the assets JSON.`);
}
function resolveConfiguredStellarSwapAsset(symbol, networkPassphrase) {
    const matches = (configuredAssets?.stellar ?? []).filter((asset) => asset.symbol.toLowerCase() === symbol.toLowerCase() &&
        (!asset.networkPassphrase || asset.networkPassphrase === networkPassphrase));
    if (matches.length !== 1) {
        throw new Error(matches.length > 1
            ? `More than one ${symbol} asset is configured for this Stellar network. Keep one entry per asset and network.`
            : `${symbol} is not configured for this Stellar network. Add it to the assets JSON before swapping.`);
    }
    return matches[0];
}
const V2_SWAP_ROUTER_ABI = [
    "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)",
    "function swapExactTokensForTokens(uint amountIn,uint amountOutMin,address[] calldata path,address to,uint deadline) external returns (uint[] memory amounts)",
    "function swapExactETHForTokens(uint amountOutMin,address[] calldata path,address to,uint deadline) external payable returns (uint[] memory amounts)",
    "function swapExactTokensForETH(uint amountIn,uint amountOutMin,address[] calldata path,address to,uint deadline) external returns (uint[] memory amounts)",
];
const V3_QUOTER_V2_ABI = [
    "function quoteExactInputSingle((address tokenIn,address tokenOut,uint256 amountIn,uint24 fee,uint160 sqrtPriceLimitX96) params) returns (uint256 amountOut,uint160 sqrtPriceX96After,uint32 initializedTicksCrossed,uint256 gasEstimate)",
];
const V3_ROUTER_ABI = [
    "function exactInputSingle((address tokenIn,address tokenOut,uint24 fee,address recipient,uint256 deadline,uint256 amountIn,uint256 amountOutMinimum,uint160 sqrtPriceLimitX96) params) payable returns (uint256 amountOut)",
    "function multicall(bytes[] data) payable returns (bytes[] results)",
    "function unwrapWETH9(uint256 amountMinimum,address recipient) payable",
];
const V3_ROUTER_02_ABI = [
    "function exactInputSingle((address tokenIn,address tokenOut,uint24 fee,address recipient,uint256 amountIn,uint256 amountOutMinimum,uint160 sqrtPriceLimitX96) params) payable returns (uint256 amountOut)",
    "function multicall(bytes[] data) payable returns (bytes[] results)",
    "function unwrapWETH9(uint256 amountMinimum,address recipient) payable",
];
const ERC20_SWAP_ABI = [
    "function approve(address spender,uint256 amount) returns (bool)",
    "function allowance(address owner,address spender) view returns (uint256)",
    "function decimals() view returns (uint8)",
];
const SWAP_BPS_DENOMINATOR = 10000n;
const DEFAULT_SWAP_TOLERANCE_PERCENT = 1;
function swapMinimumOutputBps(tolerancePercent = DEFAULT_SWAP_TOLERANCE_PERCENT) {
    if (!Number.isFinite(tolerancePercent) || tolerancePercent < 0 || tolerancePercent >= 100) {
        throw new Error("Swap tolerance must be a number from 0% up to, but not including, 100%.");
    }
    return BigInt(Math.round((100 - tolerancePercent) * 100));
}
function resolveEvmSwapNetworkConfig(chainId) {
    const registered = configuredAssets?.networks?.find((network) => network.chainId === chainId);
    if (registered)
        return registered;
    return undefined;
}
async function getEvmReadProvider(walletProvider, chainId, networkName, assetRpcUrl) {
    const rpcUrl = assetRpcUrl || configuredAssets?.networks?.find((network) => network.chainId === chainId)?.rpcUrl;
    if (!rpcUrl)
        return walletProvider;
    const rpcProvider = new JsonRpcProvider(rpcUrl);
    let rpcNetwork;
    try {
        rpcNetwork = await rpcProvider.getNetwork();
    }
    catch {
        throw new Error(`Could not reach the configured EVM RPC endpoint for ${networkName}. Check its URL and availability.`);
    }
    if (Number(rpcNetwork.chainId) !== chainId) {
        throw new Error(`The configured EVM RPC is on chain ID ${rpcNetwork.chainId}, but the wallet is on ${networkName} (chain ID ${chainId}). Use an RPC for the connected network.`);
    }
    return rpcProvider;
}
function getActiveWallet() {
    if (typeof window === "undefined")
        throw new Error("Transfers must be started in the browser.");
    const selected = window.localStorage.getItem(ACTIVE_WALLET_SESSION_KEY);
    if (selected === "stellar")
        return "stellar";
    if (selected === "evm")
        return "evm";
    const walletConfig = getActiveWagmiConfig();
    const current = walletConfig.state.current;
    if (current && walletConfig.state.connections.has(current))
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
function resolveBridgeRoute(bridgeConfig, routeId) {
    if (!bridgeConfig)
        throw new Error("Bridge is not configured. Add bridge routes to the assets JSON.");
    if (bridgeConfig.routes?.length) {
        const routeIds = bridgeConfig.routes.map((route) => route.id);
        if (routeIds.some((id) => !id) || new Set(routeIds).size !== routeIds.length) {
            throw new Error("Bridge route IDs must be present and unique in assets.bridge.routes.");
        }
        if (!routeId && bridgeConfig.routes.length > 1) {
            throw new Error(`Choose a bridge route. Available route IDs: ${bridgeConfig.routes.map((route) => route.id).join(", ")}.`);
        }
        const route = routeId
            ? bridgeConfig.routes.find((candidate) => candidate.id === routeId)
            : bridgeConfig.routes[0];
        if (!route)
            throw new Error(`Bridge route "${routeId}" is not configured.`);
        return route;
    }
    if (bridgeConfig.resourceId && bridgeConfig.internal && bridgeConfig.external) {
        if (routeId && routeId !== "default")
            throw new Error(`Bridge route "${routeId}" is not configured.`);
        return {
            id: "default",
            name: `${bridgeConfig.internal.networkName} ↔ ${bridgeConfig.external.networkName}`,
            resourceId: bridgeConfig.resourceId,
            internal: bridgeConfig.internal,
            external: bridgeConfig.external,
        };
    }
    throw new Error("Add at least one complete route to assets.bridge.routes.");
}
async function bridgeEvm(amount, from, to, recipient, options = {}) {
    if (from !== "internal" && from !== "external")
        throw new Error("Source must be internal or external.");
    if (to !== "internal" && to !== "external")
        throw new Error("Destination must be internal or external.");
    if (from === to)
        throw new Error("Choose different source and destination sides.");
    if (!isAddress(recipient))
        throw new Error("Recipient must be a valid EVM address.");
    const walletConfig = getActiveWagmiConfig();
    const current = walletConfig.state.current;
    const connection = current ? walletConfig.state.connections.get(current) : undefined;
    if (!connection)
        throw new Error("No EVM wallet is currently connected.");
    const rawProvider = await connection.connector.getProvider();
    const provider = new BrowserProvider(rawProvider);
    const chain = await provider.getNetwork();
    const chainId = Number(chain.chainId);
    const route = resolveBridgeRoute(configuredAssets?.bridge, options.routeId);
    if (!route.id || !route.name)
        throw new Error("Each bridge route must have an id and name.");
    if (!route.resourceId || !/^0x[\da-fA-F]{64}$/.test(route.resourceId)) {
        throw new Error("The configured bridge resourceId must be a 32-byte hex value.");
    }
    const sourceConfig = route[from];
    const destinationConfig = route[to];
    if (!sourceConfig || !destinationConfig || !Number.isInteger(sourceConfig.chainId) || !Number.isInteger(destinationConfig.chainId)) {
        throw new Error("Bridge internal and external settings must include valid chain IDs.");
    }
    for (const [side, networkConfig] of [[from, sourceConfig], [to, destinationConfig]]) {
        const bridgeAddress = networkConfig.bridgeAddress;
        const tokenAddress = networkConfig.tokenAddress;
        if (!networkConfig.networkName || !networkConfig.assetSymbol ||
            !bridgeAddress || !tokenAddress || !isAddress(bridgeAddress) || !isAddress(tokenAddress)) {
            throw new Error(`Configure a networkName, assetSymbol, valid bridgeAddress, and valid tokenAddress for the ${side} bridge side.`);
        }
        if (!walletConfig.chains.some((network) => network.id === networkConfig.chainId)) {
            throw new Error(`Configure ${networkConfig.networkName} (chain ID ${networkConfig.chainId}) in the provider's EVM networks.`);
        }
    }
    if (sourceConfig.assetSymbol.toLowerCase() !== destinationConfig.assetSymbol.toLowerCase()) {
        throw new Error("The bridge asset symbols must match on the internal and external networks.");
    }
    if (sourceConfig.chainId === destinationConfig.chainId) {
        throw new Error("The internal and external bridge sides must use different chain IDs.");
    }
    const expectedSourceChainId = sourceConfig.chainId;
    const destinationChainId = destinationConfig.chainId;
    if (chainId !== expectedSourceChainId) {
        const expectedNetwork = sourceConfig.networkName;
        throw new Error(`Connect your wallet to ${expectedNetwork} (chain ID ${expectedSourceChainId}) to bridge from ${from}. The connected wallet is on ${chain.name} (chain ID ${chainId}).`);
    }
    const inputAmount = normalizedAmount(amount);
    const signer = await provider.getSigner(connection.accounts[0]);
    const sender = await signer.getAddress();
    const bridgeAddress = sourceConfig.bridgeAddress;
    const tokenAddress = sourceConfig.tokenAddress;
    if (!bridgeAddress || !tokenAddress)
        throw new Error("The EVM bridge route is missing bridge and token addresses.");
    const token = new Contract(tokenAddress, BRIDGE_ERC20_ABI, signer);
    const code = await provider.getCode(bridgeAddress);
    if (code === "0x")
        throw new Error(`No bridge contract is deployed at the configured ${sourceConfig.networkName} address.`);
    const decimals = Number(await token.decimals());
    if (!Number.isInteger(decimals) || decimals < 0 || decimals > 18)
        throw new Error(`The configured ${sourceConfig.assetSymbol} token returned invalid decimals.`);
    const amountIn = parseUnits(inputAmount, decimals);
    if (sourceConfig.minimumAmountExclusive !== undefined) {
        let minimumAmount;
        try {
            minimumAmount = parseUnits(normalizedAmount(sourceConfig.minimumAmountExclusive), decimals);
        }
        catch {
            throw new Error(`The configured minimumAmountExclusive for ${sourceConfig.networkName} is invalid.`);
        }
        if (amountIn <= minimumAmount) {
            throw new Error(`${sourceConfig.networkName} bridge-out requires more than ${sourceConfig.minimumAmountExclusive} ${sourceConfig.assetSymbol}.`);
        }
    }
    const tokenBalance = BigInt((await token.balanceOf(sender)).toString());
    if (tokenBalance < amountIn)
        throw new Error(`Insufficient ${sourceConfig.assetSymbol} on ${sourceConfig.networkName}.`);
    const allowance = BigInt((await token.allowance(sender, bridgeAddress)).toString());
    let approvalTransactionHash;
    if (allowance < amountIn) {
        if (allowance > 0n) {
            const reset = await token.approve(bridgeAddress, 0n);
            const resetReceipt = await reset.wait();
            if (!resetReceipt || resetReceipt.status !== 1)
                throw new Error(`Could not reset the ${sourceConfig.assetSymbol} bridge allowance.`);
        }
        const approval = await token.approve(bridgeAddress, amountIn);
        const approvalReceipt = await approval.wait();
        if (!approvalReceipt || approvalReceipt.status !== 1)
            throw new Error(`Could not approve ${sourceConfig.assetSymbol} for the bridge.`);
        approvalTransactionHash = approvalReceipt.hash || approval.hash;
    }
    const bridge = new Contract(bridgeAddress, BOT_BRIDGE_ABI, signer);
    const transaction = await bridge.deposit(destinationChainId, route.resourceId, recipient, amountIn);
    const receipt = await transaction.wait();
    if (!receipt || receipt.status !== 1)
        throw new Error("The source-chain bridge deposit failed.");
    const { disconnect } = await import("wagmi/actions");
    for (const activeConnection of Array.from(walletConfig.state.connections.values())) {
        await disconnect(walletConfig, { connector: activeConnection.connector });
    }
    return {
        success: true,
        asset: sourceConfig.assetSymbol,
        from,
        to,
        fromNetwork: sourceConfig.networkName,
        toNetwork: destinationConfig.networkName,
        routeId: route.id,
        routeName: route.name,
        amount: inputAmount,
        ...(approvalTransactionHash ? { approvalTransactionHash } : {}),
        transactionHash: receipt.hash || transaction.hash,
        status: "submitted",
    };
}
async function bridgeStellar(amount, from, to, recipient, options = {}) {
    if (from !== "internal" && from !== "external")
        throw new Error("Source must be internal or external.");
    if (to !== "internal" && to !== "external")
        throw new Error("Destination must be internal or external.");
    if (from === to)
        throw new Error("Choose different source and destination sides.");
    if (!StrKey.isValidEd25519PublicKey(recipient))
        throw new Error("Recipient must be a valid Stellar public address.");
    if (!/^\d+(\.\d{1,7})?$/.test(amount))
        throw new Error("Stellar amounts support up to 7 decimal places.");
    const stellarConfig = requireStellarNetwork();
    const access = await requestAccess();
    const sourceAddress = access.address;
    if (!sourceAddress)
        throw new Error("Could not access the connected Stellar wallet.");
    const networkDetails = await getNetworkDetails();
    const networkPassphrase = networkDetails.networkPassphrase || stellarConfig.networkPassphrase;
    if (networkDetails.networkPassphrase && networkDetails.networkPassphrase !== stellarConfig.networkPassphrase) {
        throw new Error(`Stellar network mismatch. Expected ${stellarConfig.networkPassphrase}, got ${networkDetails.networkPassphrase}.`);
    }
    const route = resolveBridgeRoute(configuredAssets?.bridge, options.routeId);
    if (!route.id || !route.name)
        throw new Error("Each bridge route must have an id and name.");
    if (!route.resourceId || !/^0x[\da-fA-F]{64}$/.test(route.resourceId)) {
        throw new Error("The configured bridge resourceId must be a 32-byte hex value.");
    }
    const sourceConfig = route[from];
    const destinationConfig = route[to];
    if (!sourceConfig || !destinationConfig || sourceConfig.networkType !== "stellar" || destinationConfig.networkType !== "stellar") {
        throw new Error("Bridge internal and external settings must include valid Stellar network types.");
    }
    if (!sourceConfig.networkName || !sourceConfig.assetSymbol || !sourceConfig.bridgeAddress || !StrKey.isValidEd25519PublicKey(sourceConfig.bridgeAddress)) {
        throw new Error(`Configure a networkName, assetSymbol, and valid bridgeAddress for the ${from} bridge side.`);
    }
    if (!destinationConfig.networkName || !destinationConfig.assetSymbol) {
        throw new Error(`Configure a networkName and assetSymbol for the ${to} bridge side.`);
    }
    if (sourceConfig.assetSymbol.toLowerCase() !== destinationConfig.assetSymbol.toLowerCase()) {
        throw new Error("The bridge asset symbols must match on the internal and external networks.");
    }
    const server = new Horizon.Server(stellarConfig.horizonUrl);
    const sourceAccount = await server.loadAccount(sourceAddress);
    const assetConfig = (configuredAssets?.stellar ?? []).find((asset) => asset.symbol.toLowerCase() === sourceConfig.assetSymbol.toLowerCase() &&
        (!asset.networkPassphrase || asset.networkPassphrase === networkPassphrase)) ?? (sourceConfig.assetSymbol.toLowerCase() === "xlm" ? { symbol: "XLM", type: "native" } : undefined);
    if (!assetConfig)
        throw new Error(`No ${sourceConfig.assetSymbol} asset is configured for this Stellar network.`);
    const stellarAsset = assetConfig.type === "native"
        ? Asset.native()
        : new Asset(assetConfig.code, assetConfig.issuer);
    const assetBalance = assetConfig.type === "native"
        ? sourceAccount.balances.find((item) => item.asset_type === "native")
        : sourceAccount.balances.find((item) => (item.asset_type === "credit_alphanum4" || item.asset_type === "credit_alphanum12") &&
            item.asset_code === assetConfig.code &&
            item.asset_issuer === assetConfig.issuer);
    if (!assetBalance) {
        throw new Error(assetConfig.type === "native"
            ? `The connected Stellar account has no ${sourceConfig.assetSymbol} balance.`
            : `The connected Stellar account has no ${sourceConfig.assetSymbol} trustline from the configured issuer.`);
    }
    const requiredBalance = Number(amount) + (assetConfig.type === "native" ? 0.00001 : 0);
    if (Number(assetBalance.balance) < requiredBalance)
        throw new Error(`Insufficient ${sourceConfig.assetSymbol} balance for this transfer.`);
    const builder = new TransactionBuilder(sourceAccount, { fee: BASE_FEE, networkPassphrase })
        .addOperation(Operation.payment({
        destination: sourceConfig.bridgeAddress,
        asset: stellarAsset,
        amount: Number(amount).toFixed(7),
    }));
    if (sourceConfig.stellarMemo)
        builder.addMemo(Memo.text(sourceConfig.stellarMemo));
    builder.setTimeout(180);
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
        throw new Error("Stellar bridge deposit did not complete successfully.");
    return {
        success: true,
        asset: sourceConfig.assetSymbol,
        from,
        to,
        fromNetwork: sourceConfig.networkName,
        toNetwork: destinationConfig.networkName,
        routeId: route.id,
        routeName: route.name,
        amount: amount,
        transactionHash: receipt.hash,
        status: "submitted",
    };
}
/** Bridge a configured ERC-20 asset between the configured internal and external EVM sides. */
export async function cordy_bridge(amount, from, to, recipient, options = {}) {
    try {
        const normalized = normalizedAmount(amount);
        const route = resolveBridgeRoute(configuredAssets?.bridge, options.routeId);
        const sourceConfig = route[from];
        if (!sourceConfig) {
            throw new Error(`Bridge source configuration for '${from}' is missing.`);
        }
        const destinationConfig = route[to];
        if (!destinationConfig) {
            throw new Error(`Bridge destination configuration for '${to}' is missing.`);
        }
        const needsEvmWallet = sourceConfig.networkType === "evm"
            || (route.protocol === "cctp" && sourceConfig.networkType === "stellar" && destinationConfig.networkType === "evm");
        if (needsEvmWallet) {
            const walletConfig = getActiveWagmiConfig();
            const current = walletConfig.state.current;
            const connection = current ? walletConfig.state.connections.get(current) : undefined;
            let connectedAddress = connection?.accounts[0];
            if (!connectedAddress) {
                connectedAddress = await waitForBridgeEvmWallet({
                    routeId: route.id,
                    amount: normalized,
                    from,
                    to,
                    recipient,
                    sourceChainId: sourceConfig.networkType === "evm" ? sourceConfig.chainId : destinationConfig.chainId,
                    sourceNetworkType: sourceConfig.networkType,
                    destinationNetworkType: destinationConfig.networkType,
                });
            }
            if (!recipient && destinationConfig.networkType === "evm") {
                recipient = connectedAddress;
            }
        }
        if (route.protocol === "cctp") {
            return await cctpBridge(normalized, from, to, recipient, route);
        }
        else if (sourceConfig.networkType === "stellar") {
            return await bridgeStellar(normalized, from, to, recipient, options);
        }
        else if (sourceConfig.networkType === "evm") {
            return await bridgeEvm(normalized, from, to, recipient, options);
        }
        else {
            throw new Error(`Unsupported network type for bridging: ${sourceConfig.networkType}.`);
        }
    }
    catch (error) {
        const errorDetail = error instanceof Error ? error.message : String(error);
        return {
            success: false,
            error: errorDetail,
            errorDetail,
        };
    }
}
async function transferEvm(amount, recipient, requestedSymbol) {
    if (!isAddress(recipient))
        throw new Error("Recipient must be a valid EVM address.");
    const walletConfig = getActiveWagmiConfig();
    const current = walletConfig.state.current;
    const connection = current ? walletConfig.state.connections.get(current) : undefined;
    if (!connection)
        throw new Error("No EVM wallet is currently connected.");
    const rawProvider = await connection.connector.getProvider();
    const provider = new BrowserProvider(rawProvider);
    const chain = await provider.getNetwork();
    const chainId = Number(chain.chainId);
    requireConfiguredEvmNetwork(configuredAssets, chainId, chain.name);
    const tokenConfig = resolveEvmAsset(requestedSymbol, chainId, chain.name);
    const contractAddress = tokenConfig?.contractAddress || "";
    if (!contractAddress) {
        throw new Error(`No ${requestedSymbol || "default"} EVM token configured. Add it to the asset JSON.`);
    }
    if (!isAddress(contractAddress))
        throw new Error("The configured EVM token contract address is invalid.");
    const readProvider = await getEvmReadProvider(provider, chainId, chain.name, tokenConfig?.rpcUrl);
    const signer = await provider.getSigner(connection.accounts[0]);
    const from = await signer.getAddress();
    const balance = await readTokenBalance(from, {
        tokenAddress: contractAddress,
        rpcUrl: tokenConfig?.rpcUrl || configuredAssets?.networks?.find((network) => network.chainId === chainId)?.rpcUrl,
        provider: readProvider,
        fallbackProvider: provider,
        expectedChainId: chainId,
        networkName: chain.name,
        symbol: tokenConfig?.symbol,
        decimals: tokenConfig?.decimals,
    });
    if (requestedSymbol && balance.symbol.toLowerCase() !== requestedSymbol.toLowerCase()) {
        throw new Error(`The configured token is ${balance.symbol}, not ${requestedSymbol}. Add ${requestedSymbol} to the asset JSON.`);
    }
    const value = parseUnits(amount, balance.decimals);
    if (BigInt(balance.rawBalance) < value)
        throw new Error(`Insufficient ${balance.symbol} balance for this transfer.`);
    const writeToken = new Contract(contractAddress, tokenAbi, signer);
    const transaction = await writeToken.transfer(recipient, value);
    const receipt = await transaction.wait();
    if (!receipt || receipt.status !== 1)
        throw new Error("EVM transfer did not complete successfully.");
    return { success: true, asset: balance.symbol, network: "evm", transactionHash: receipt.hash || transaction.hash };
}
async function readEvmBalance(requestedSymbol) {
    const walletConfig = getActiveWagmiConfig();
    const current = walletConfig.state.current;
    const connection = current ? walletConfig.state.connections.get(current) : undefined;
    if (!connection)
        throw new Error("No EVM wallet is currently connected.");
    const rawProvider = await connection.connector.getProvider();
    const provider = new BrowserProvider(rawProvider);
    const chain = await provider.getNetwork();
    const chainId = Number(chain.chainId);
    requireConfiguredEvmNetwork(configuredAssets, chainId, chain.name);
    const tokenConfig = resolveEvmAsset(requestedSymbol, chainId, chain.name);
    const readProvider = await getEvmReadProvider(provider, chainId, chain.name, tokenConfig?.rpcUrl);
    const walletAddress = connection.accounts[0];
    if (!walletAddress)
        throw new Error("No EVM wallet account is currently connected.");
    if (tokenConfig?.type === "native") {
        return {
            success: true,
            network: chain.name,
            balance: formatUnits(await readProvider.getBalance(walletAddress), 18),
            asset: tokenConfig.symbol,
        };
    }
    const contractAddress = tokenConfig?.contractAddress || "";
    if (!contractAddress) {
        throw new Error(`No ${requestedSymbol || "default"} EVM token configured. Add it to the asset JSON.`);
    }
    if (!isAddress(contractAddress))
        throw new Error("The configured EVM token contract address is invalid.");
    const balance = await readTokenBalance(walletAddress, {
        tokenAddress: contractAddress,
        rpcUrl: tokenConfig?.rpcUrl || configuredAssets?.networks?.find((network) => network.chainId === chainId)?.rpcUrl,
        provider: readProvider,
        fallbackProvider: provider,
        expectedChainId: chainId,
        networkName: chain.name,
        symbol: tokenConfig?.symbol,
        decimals: tokenConfig?.decimals,
    });
    if (requestedSymbol && balance.symbol.toLowerCase() !== requestedSymbol.toLowerCase()) {
        throw new Error(`The configured token is ${balance.symbol}, not ${requestedSymbol}. Add ${requestedSymbol} to the asset JSON.`);
    }
    return {
        success: true,
        network: chain.name,
        balance: balance.balance,
        asset: balance.symbol,
    };
}
async function readStellarBalance(requestedSymbol) {
    const symbol = requestedSymbol || "XLM";
    const stellarConfig = requireStellarNetwork();
    const access = await requestAccess();
    const address = access.address;
    if (!address)
        throw new Error("Could not access the connected Stellar wallet.");
    const balance = await loadStellarBalance(address, {
        assetSymbol: symbol,
        assets: configuredAssets?.stellar,
        horizonUrl: stellarConfig.horizonUrl,
        networkPassphrase: stellarConfig.networkPassphrase,
    });
    return {
        success: true,
        network: balance.network,
        balance: balance.balance,
        asset: balance.asset,
    };
}
/** Read the full-precision balance for the active wallet and selected asset. */
export async function cordy_balance(options = {}) {
    try {
        const activeWallet = getActiveWallet();
        return activeWallet === "stellar"
            ? await readStellarBalance(options.asset)
            : await readEvmBalance(options.asset);
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Could not read wallet balance.",
        };
    }
}
async function transferStellar(amount, recipient, requestedSymbol, memo) {
    const stellarConfig = requireStellarNetwork();
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
    const networkPassphrase = networkDetails.networkPassphrase || stellarConfig.networkPassphrase;
    if (networkDetails.networkPassphrase && networkDetails.networkPassphrase !== stellarConfig.networkPassphrase) {
        throw new Error(`Stellar network mismatch. Expected ${stellarConfig.networkPassphrase}, got ${networkDetails.networkPassphrase}.`);
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
    const server = new Horizon.Server(stellarConfig.horizonUrl);
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
async function swapEvm(amount, fromSymbol, toSymbol, tolerancePercent, options = {}) {
    const walletConfig = getActiveWagmiConfig();
    const current = walletConfig.state.current;
    const connection = current ? walletConfig.state.connections.get(current) : undefined;
    if (!connection)
        throw new Error("No EVM wallet is currently connected.");
    const rawProvider = await connection.connector.getProvider();
    const provider = new BrowserProvider(rawProvider);
    const chain = await provider.getNetwork();
    const chainId = Number(chain.chainId);
    requireConfiguredEvmNetwork(configuredAssets, chainId, chain.name);
    const networkConfig = resolveEvmSwapNetworkConfig(chainId);
    const networkName = networkConfig?.name || chain.name;
    const fromAsset = resolveConfiguredEvmSwapAsset(fromSymbol, chainId);
    const toAsset = resolveConfiguredEvmSwapAsset(toSymbol, chainId);
    if (fromSymbol.toLowerCase() === toSymbol.toLowerCase())
        throw new Error("Choose two different assets to swap.");
    if (!networkConfig)
        throw new Error(`No swap network configuration found for ${networkName} (chain ID ${chainId}).`);
    const isNative = (asset) => asset.type === "native" || !asset.contractAddress;
    const fromNative = isNative(fromAsset);
    const toNative = isNative(toAsset);
    const wrappedNative = networkConfig.wrappedNativeTokenAddress;
    if ((fromNative || toNative) && (!wrappedNative || !isAddress(wrappedNative))) {
        throw new Error(`Configure wrappedNativeTokenAddress for ${networkName} in assets JSON to swap its native currency.`);
    }
    const fromAddress = fromNative ? wrappedNative : fromAsset.contractAddress;
    const toAddress = toNative ? wrappedNative : toAsset.contractAddress;
    if (!isAddress(fromAddress) || !isAddress(toAddress))
        throw new Error("A configured swap asset has an invalid token contract address.");
    if (fromAddress.toLowerCase() === toAddress.toLowerCase())
        throw new Error("These assets resolve to the same token contract and cannot be swapped.");
    const signer = await provider.getSigner(connection.accounts[0]);
    const sender = await signer.getAddress();
    const inputAmount = normalizedAmount(amount);
    const inputDecimals = fromNative ? 18 : fromAsset.decimals ?? Number(await new Contract(fromAddress, ERC20_SWAP_ABI, provider).decimals());
    const outputDecimals = toNative ? 18 : toAsset.decimals ?? Number(await new Contract(toAddress, ERC20_SWAP_ABI, provider).decimals());
    const amountIn = parseUnits(inputAmount, inputDecimals);
    const version = options.version ?? "auto";
    if (version !== "auto" && version !== "v2" && version !== "v3")
        throw new Error("Swap version must be auto, v2, or v3.");
    const candidates = [];
    const v2RouterAddress = networkConfig.swapRouterAddress;
    if ((version === "auto" || version === "v2") && v2RouterAddress && isAddress(v2RouterAddress)) {
        try {
            const router = new Contract(v2RouterAddress, V2_SWAP_ROUTER_ABI, provider);
            const amounts = await router.getFunction("getAmountsOut").staticCall(amountIn, [fromAddress, toAddress]);
            const quotedOut = BigInt(amounts[amounts.length - 1].toString());
            if (quotedOut > 0n)
                candidates.push({ version: "v2", quotedOut });
        }
        catch {
            // A missing pool or unsupported route should not prevent trying V3 in auto mode.
        }
    }
    const v3 = networkConfig.swapV3;
    if ((version === "auto" || version === "v3") && v3 && isAddress(v3.routerAddress) && isAddress(v3.quoterAddress)) {
        const feeTiers = options.feeTiers ?? (v3.feeTiers?.length ? v3.feeTiers : [500, 3000, 10000]);
        if (options.feeTiers && (!options.feeTiers.length || options.feeTiers.some((feeTier) => !Number.isInteger(feeTier) || feeTier <= 0 || feeTier >= 1000000))) {
            throw new Error("Per-swap feeTiers must be a non-empty array of integer pool fee values between 1 and 999999.");
        }
        const quoter = new Contract(v3.quoterAddress, V3_QUOTER_V2_ABI, provider);
        for (const feeTier of feeTiers) {
            if (!Number.isInteger(feeTier) || feeTier <= 0 || feeTier >= 1000000)
                continue;
            try {
                const quote = await quoter.getFunction("quoteExactInputSingle").staticCall({
                    tokenIn: fromAddress,
                    tokenOut: toAddress,
                    amountIn,
                    fee: feeTier,
                    sqrtPriceLimitX96: 0,
                });
                const quotedOut = BigInt(quote[0].toString());
                if (quotedOut > 0n)
                    candidates.push({ version: "v3", quotedOut, feeTier });
            }
            catch {
                // This fee tier may not have a pool or may not be enabled on this deployment.
            }
        }
    }
    const candidate = candidates
        .filter((item) => version === "auto" || item.version === version)
        .sort((a, b) => a.quotedOut === b.quotedOut ? 0 : a.quotedOut > b.quotedOut ? -1 : 1)[0];
    if (!candidate) {
        if (version === "v2" && (!v2RouterAddress || !isAddress(v2RouterAddress))) {
            throw new Error(`No valid V2 swap router is configured for ${networkName}. Add swapRouterAddress to its network entry.`);
        }
        if (version === "v3" && (!v3 || !isAddress(v3.routerAddress) || !isAddress(v3.quoterAddress))) {
            throw new Error(`No valid V3 router and QuoterV2 are configured for ${networkName}. Add swapV3 to its network entry.`);
        }
        throw new Error(`No V2 or V3 quote is available for ${fromSymbol} to ${toSymbol} on ${networkName}. Check the router configuration, fee tiers, and pool liquidity.`);
    }
    const quotedOut = candidate.quotedOut;
    const minOut = quotedOut * swapMinimumOutputBps(tolerancePercent) / SWAP_BPS_DENOMINATOR;
    const deadline = Math.floor(Date.now() / 1000) + 20 * 60;
    let transaction;
    let selectedRouterAddress;
    if (candidate.version === "v2") {
        selectedRouterAddress = v2RouterAddress;
        const router = new Contract(selectedRouterAddress, V2_SWAP_ROUTER_ABI, signer);
        const path = [fromAddress, toAddress];
        if (fromNative) {
            transaction = await router.getFunction("swapExactETHForTokens").send(minOut, path, sender, deadline, { value: amountIn });
        }
        else {
            const token = new Contract(fromAddress, ERC20_SWAP_ABI, signer);
            const allowance = BigInt((await token.allowance(sender, selectedRouterAddress)).toString());
            if (allowance < amountIn) {
                if (allowance > 0n) {
                    const reset = await token.approve(selectedRouterAddress, 0n);
                    const resetReceipt = await reset.wait();
                    if (!resetReceipt || resetReceipt.status !== 1)
                        throw new Error(`Could not reset the ${fromSymbol} swap allowance.`);
                }
                const approval = await token.approve(selectedRouterAddress, amountIn);
                const approvalReceipt = await approval.wait();
                if (!approvalReceipt || approvalReceipt.status !== 1)
                    throw new Error(`Could not approve ${fromSymbol} for the swap.`);
            }
            transaction = toNative
                ? await router.getFunction("swapExactTokensForETH").send(amountIn, minOut, path, sender, deadline)
                : await router.getFunction("swapExactTokensForTokens").send(amountIn, minOut, path, sender, deadline);
        }
    }
    else {
        selectedRouterAddress = v3.routerAddress;
        const routerAbi = v3.routerType === "swapRouter02" ? V3_ROUTER_02_ABI : V3_ROUTER_ABI;
        const router = new Contract(selectedRouterAddress, routerAbi, signer);
        if (!fromNative) {
            const token = new Contract(fromAddress, ERC20_SWAP_ABI, signer);
            const allowance = BigInt((await token.allowance(sender, selectedRouterAddress)).toString());
            if (allowance < amountIn) {
                if (allowance > 0n) {
                    const reset = await token.approve(selectedRouterAddress, 0n);
                    const resetReceipt = await reset.wait();
                    if (!resetReceipt || resetReceipt.status !== 1)
                        throw new Error(`Could not reset the ${fromSymbol} swap allowance.`);
                }
                const approval = await token.approve(selectedRouterAddress, amountIn);
                const approvalReceipt = await approval.wait();
                if (!approvalReceipt || approvalReceipt.status !== 1)
                    throw new Error(`Could not approve ${fromSymbol} for the swap.`);
            }
        }
        const routerRecipient = toNative ? selectedRouterAddress : sender;
        const params = v3.routerType === "swapRouter02"
            ? [fromAddress, toAddress, candidate.feeTier, routerRecipient, amountIn, minOut, 0n]
            : [fromAddress, toAddress, candidate.feeTier, routerRecipient, deadline, amountIn, minOut, 0n];
        const swapData = router.interface.encodeFunctionData("exactInputSingle", [params]);
        const overrides = fromNative ? { value: amountIn } : {};
        transaction = toNative
            ? await router.getFunction("multicall").send([
                swapData,
                router.interface.encodeFunctionData("unwrapWETH9", [minOut, sender]),
            ], overrides)
            : await router.getFunction("exactInputSingle").send(params, overrides);
    }
    const receipt = await transaction.wait();
    if (!receipt || receipt.status !== 1)
        throw new Error(`The ${fromSymbol} to ${toSymbol} swap failed on ${networkName}.`);
    return {
        success: true,
        network: "evm",
        from: fromAsset.symbol,
        to: toAsset.symbol,
        amountIn: inputAmount,
        estimatedAmountOut: formatUnits(quotedOut, outputDecimals),
        version: candidate.version,
        ...(candidate.feeTier ? { feeTier: candidate.feeTier } : {}),
        transactionHash: receipt.hash || transaction.hash,
    };
}
function stellarAssetFromConfig(asset) {
    return asset.type === "native" ? Asset.native() : new Asset(asset.code, asset.issuer);
}
async function swapStellar(amount, fromSymbol, toSymbol, tolerancePercent) {
    const stellarConfig = requireStellarNetwork();
    if (fromSymbol.toLowerCase() === toSymbol.toLowerCase())
        throw new Error("Choose two different assets to swap.");
    if (!/^\d+(\.\d{1,7})?$/.test(amount))
        throw new Error("Stellar swap amounts support up to 7 decimal places.");
    const access = await requestAccess();
    const source = access.address;
    if (!source)
        throw new Error("Could not access the connected Stellar wallet.");
    const networkDetails = await getNetworkDetails();
    const passphrase = networkDetails.networkPassphrase || stellarConfig.networkPassphrase;
    if (passphrase !== stellarConfig.networkPassphrase)
        throw new Error(`Stellar network mismatch. Expected ${stellarConfig.networkPassphrase}, got ${passphrase}.`);
    const fromAsset = resolveConfiguredStellarSwapAsset(fromSymbol, passphrase);
    const toAsset = resolveConfiguredStellarSwapAsset(toSymbol, passphrase);
    const stellarFrom = stellarAssetFromConfig(fromAsset);
    const stellarTo = stellarAssetFromConfig(toAsset);
    const server = new Horizon.Server(stellarConfig.horizonUrl);
    const sourceAccount = await server.loadAccount(source);
    const paths = await server.strictSendPaths(stellarFrom, amount, [stellarTo]).call();
    const route = paths.records[0];
    if (!route)
        throw new Error(`No Stellar path is available to swap ${fromSymbol} to ${toSymbol}.`);
    const minOut = (Number(route.destination_amount) * Number(swapMinimumOutputBps(tolerancePercent)) / Number(SWAP_BPS_DENOMINATOR)).toFixed(7);
    const routeAssets = route.path.map((item) => item.asset_type === "native"
        ? Asset.native()
        : new Asset(item.asset_code, item.asset_issuer));
    const transaction = new TransactionBuilder(sourceAccount, { fee: BASE_FEE, networkPassphrase: passphrase })
        .addOperation(Operation.pathPaymentStrictSend({
        sendAsset: stellarFrom,
        sendAmount: amount,
        destination: source,
        destAsset: stellarTo,
        destMin: minOut,
        path: routeAssets,
    }))
        .setTimeout(180)
        .build();
    const signed = await freighterSignTransaction(transaction.toXDR(), { networkPassphrase: passphrase, address: source });
    if (signed.error || !signed.signedTxXdr)
        throw new Error(signed.error?.message || "Stellar wallet signing was rejected.");
    const receipt = await server.submitTransaction(TransactionBuilder.fromXDR(signed.signedTxXdr, passphrase));
    if (!receipt.successful || !receipt.hash)
        throw new Error("The Stellar swap did not complete successfully.");
    return {
        success: true,
        network: "stellar",
        from: fromAsset.symbol,
        to: toAsset.symbol,
        amountIn: amount,
        estimatedAmountOut: route.destination_amount,
        transactionHash: receipt.hash,
    };
}
/** Swap two configured assets using the active EVM or Stellar wallet. */
export async function cordy_swap(amount, from, to, tolerancePercent = DEFAULT_SWAP_TOLERANCE_PERCENT, options = {}) {
    try {
        swapMinimumOutputBps(tolerancePercent);
        const normalized = normalizedAmount(amount);
        const activeWallet = getActiveWallet();
        return activeWallet === "stellar"
            ? await swapStellar(normalized, from, to, tolerancePercent)
            : await swapEvm(normalized, from, to, tolerancePercent, options);
    }
    catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Could not swap the selected assets." };
    }
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
