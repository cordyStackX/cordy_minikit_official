import { useDisconnect } from 'wagmi';

export default function Disconnect() {
  const { disconnect } = useDisconnect();

  window.location.reload();

  return (
     <button onClick={() => disconnect()}>Disconnect</button>
  );
}