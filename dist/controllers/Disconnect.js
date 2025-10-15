import { jsx as _jsx } from "react/jsx-runtime";
import { useDisconnect } from 'wagmi';
export default function Disconnect() {
    const { disconnect } = useDisconnect();
    return (_jsx("button", { onClick: () => disconnect(), children: "Disconnect" }));
}
