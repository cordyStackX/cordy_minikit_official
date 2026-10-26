let activeConfig;
export function setCordyRuntimeConfig(config) {
    activeConfig = config;
}
export function getCordyRuntimeConfig() {
    return activeConfig;
}
export function isEvmConfigReady() {
    return Boolean(activeConfig?.networks?.length && activeConfig.evm?.length);
}
export function isStellarConfigReady() {
    return Boolean(activeConfig?.stellarNetwork?.horizonUrl &&
        activeConfig.stellarNetwork.networkPassphrase &&
        activeConfig.stellar?.length);
}
