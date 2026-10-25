type ConnectWalletBTProps = {
    className?: string;
} & ({
    jwt_session: true;
    navigate: string;
} | {
    jwt_session?: false;
    navigate?: never;
});
export default function ConnectWalletBT({ className, jwt_session, navigate, }: ConnectWalletBTProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=Connect_wallet_bt.d.ts.map