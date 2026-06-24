import { Horizon, Networks } from "@stellar/stellar-sdk";
import { getNetworkDetails } from "@stellar/freighter-api";
const STELLAR_HORIZON = process.env.NEXT_PUBLIC_STELLAR_HORIZON || "https://horizon-testnet.stellar.org";
const STELLAR_NETWORK_PASSPHRASE = process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE || Networks.TESTNET;
export default async function loadStellarBalance(accountId) {
    const networkDetails = await getNetworkDetails();
    const freighterPassphrase = networkDetails.networkPassphrase;
    console.log("Freighter network details:", networkDetails);
    console.log("Freighter passphrase:", freighterPassphrase);
    console.log("App passphrase:", STELLAR_NETWORK_PASSPHRASE);
    if (freighterPassphrase &&
        freighterPassphrase !== STELLAR_NETWORK_PASSPHRASE) {
        throw new Error(`Freighter network mismatch. Freighter: ${freighterPassphrase}, App: ${STELLAR_NETWORK_PASSPHRASE}`);
    }
    const server = new Horizon.Server(STELLAR_HORIZON);
    const account = await server.loadAccount(accountId);
    const native = account.balances.find((item) => item.asset_type === "native");
    return {
        address: accountId,
        network: networkDetails.network || "TESTNET",
        balance: native?.balance ?? "0",
    };
}
