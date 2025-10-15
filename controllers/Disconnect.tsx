import { useDisconnect } from 'wagmi';

export default function Disconnect() {
  const { disconnect } = useDisconnect();

  return (
     <button onClick={() => disconnect()}>Disconnect</button>
  );
}