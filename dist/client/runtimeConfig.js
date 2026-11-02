let activeConfig;
export function setCordyRuntimeConfig(config) {
    activeConfig = config;
}
export function getCordyRuntimeConfig() {
    return activeConfig;
}
export function isEvmConfigReady() {
    return Boolean(activeConfig?.networks?.length &&
        activeConfig.evm &&
        Object.keys(activeConfig.evm).length > 0);
}
export function getConfiguredEvmAssets(assets) {
    return Object.entries(assets?.evm ?? {}).flatMap(([chainId, entries]) => entries.map((asset) => ({ ...asset, chainId: Number(chainId) })));
}
export function requireConfiguredEvmNetwork(assets, chainId, networkName) {
    const network = assets?.networks?.find((candidate) => candidate.chainId === chainId);
    if (!network) {
        const configured = (assets?.networks ?? []).map((candidate) => `${candidate.name} (${candidate.chainId})`).join(", ");
        throw new Error(`${networkName} (chain ID ${chainId}) is not configured in Cordy Minikit. ` +
            `Add it to assets.networks before using EVM assets. Configured networks: ${configured || "none"}.`);
    }
    return network;
}
export function isStellarConfigReady() {
    return Boolean(activeConfig?.stellarNetwork?.horizonUrl &&
        activeConfig.stellarNetwork.networkPassphrase &&
        activeConfig.stellar?.length);
}
