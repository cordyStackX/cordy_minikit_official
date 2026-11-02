type ConnectWalletBTProps = {
    className?: string;
} & ({
    cons_session: true;
    navigate: string;
} | {
    cons_session?: false;
    navigate?: never;
});
export default function ConnectWalletBT({ className, cons_session, navigate, }: ConnectWalletBTProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=Connect_wallet_bt.d.ts.map