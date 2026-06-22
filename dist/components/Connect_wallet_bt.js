"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { getTokenBalance } from "../controllers";
import { useWalletModal } from "../wagmi__providers";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { isConnected as stellarIsConnected, getAddress as stellarGetAddress } from "@stellar/freighter-api";
import { Horizon } from "@stellar/stellar-sdk";
const STELLAR_ADDRESS_KEY = "cordy_minikit:stellar_address";
const STELLAR_RPC = process.env.NEXT_PUBLIC_STELLAR_RPC || "https://soroban-testnet.stellar.org";
export default function ConnectWalletBT({ className, }) {
    const { openModal } = useWalletModal();
    const { isConnected, address } = useAccount();
    const [balance, setBalance] = useState("");
    const [symbol, setSymbol] = useState("");
    const [stellarAddress, setStellarAddress] = useState(null);
    const [stellarBalance, setStellarBalance] = useState("");
    useEffect(() => {
        if (isConnected && address) {
            Get_Balance();
        }
    }, [isConnected, address]);
    useEffect(() => {
        const hydrateStellar = async () => {
            const storedAddress = window.localStorage.getItem(STELLAR_ADDRESS_KEY);
            if (storedAddress) {
                setStellarAddress(storedAddress);
                return;
            }
            try {
                const connected = await stellarIsConnected();
                if (!connected.isConnected)
                    return;
                const account = await stellarGetAddress();
                setStellarAddress(account.address);
                window.localStorage.setItem(STELLAR_ADDRESS_KEY, account.address);
                void loadStellarBalance(account.address);
            }
            catch {
                return;
            }
        };
        void hydrateStellar();
    }, []);
    const Get_Balance = async () => {
        if (!address)
            return;
        const { balance, symbol } = await getTokenBalance(address);
        setBalance(balance);
        setSymbol(symbol);
        return;
    };
    const loadStellarBalance = async (accountId) => {
        try {
            const server = new Horizon.Server(STELLAR_RPC);
            const account = await server.loadAccount(accountId);
            const native = account.balances.find((item) => item.asset_type === "native");
            setStellarBalance(native?.balance ?? "0");
        }
        catch (err) {
            console.error("Failed to load Stellar balance:", err);
            setStellarBalance("0");
        }
    };
    useEffect(() => {
        if (stellarAddress) {
            void loadStellarBalance(stellarAddress);
        }
    }, [stellarAddress]);
    return (_jsx("button", { className: className, onClick: openModal, children: isConnected
            ? `BAL ${balance} ${symbol ?? ""}`
            : stellarAddress
                ? `BAL ${stellarBalance} XLM`
                : "Connect Wallet" }));
}
