# Network Enforcement Guide

## Overview
The network enforcement system automatically detects the correct network for your token contract and forces users to stay on that network.

## Features

### 1. Automatic Network Detection
- Detects which network (Base Mainnet or Base Sepolia) your contract is deployed on
- Validates contract existence before allowing transactions

### 2. Forced Network Switching
- Automatically switches wallet to the correct network
- Prompts user to add network if not already added
- Blocks transactions on wrong networks

### 3. Network Guard Hook
- Monitors network changes in real-time
- Automatically switches back if user tries to change network
- Shows UI feedback during network switching

## Usage

### Basic (Automatic)
The network enforcement is **automatically enabled** when you use `CordyStackTrans`:

```tsx
import { CordyStackTrans } from '@cordystackx/cordy_minikit';

async function handlePayment() {
  const success = await CordyStackTrans(recipientAddress, amount);
  // Network will be automatically enforced before transaction
}
```

### With UI Component
The `UI_Comp` component includes automatic network monitoring:

```tsx
import { UI_Comp } from '@cordystackx/cordy_minikit';

export default function App() {
  return <UI_Comp />;
  // Shows "🔄 Switching to correct network..." when wrong network detected
}
```

### Manual Network Guard (Advanced)
Use the hook in custom components:

```tsx
import { useNetworkGuard } from '@cordystackx/cordy_minikit';

function MyComponent() {
  const { isEnforcing, isCorrectNetwork, requiredChainId } = useNetworkGuard({
    enabled: true,
    onWrongNetwork: () => {
      console.log("User tried to switch network!");
    }
  });

  return (
    <div>
      {isEnforcing && <p>Switching network...</p>}
      {!isCorrectNetwork && <p>Wrong network!</p>}
    </div>
  );
}
```

### Manual Network Utilities
For advanced use cases:

```tsx
import { 
  detectContractNetwork, 
  enforceNetwork,
  setupNetworkGuard,
  NETWORKS 
} from '@cordystackx/cordy_minikit';

// Detect which network a contract is on
const network = await detectContractNetwork(contractAddress);

// Force switch to a specific network
await enforceNetwork(8453, NETWORKS.BASE_MAINNET);

// Set up continuous monitoring
const cleanup = setupNetworkGuard(
  8453,
  NETWORKS.BASE_MAINNET,
  () => console.log("Wrong network!")
);
```

## Supported Networks

- **Base Mainnet** (Chain ID: 8453)
- **Base Sepolia** (Chain ID: 84532)

## How It Works

1. **Detection Phase**
   - Checks contract code on both Base Mainnet and Base Sepolia
   - Identifies which network has the deployed contract

2. **Validation Phase**
   - Verifies current wallet network matches contract network
   - If mismatch, triggers network switch

3. **Enforcement Phase**
   - Requests wallet to switch to correct network
   - If network not added, prompts user to add it
   - Monitors for any future network changes

4. **Guard Phase**
   - Continuously listens for `chainChanged` events
   - Automatically switches back if user changes network
   - Shows UI feedback during switching

## Error Handling

The system handles common errors gracefully:

- ❌ **Contract not found** - Shows which networks were checked
- ❌ **User rejected switch** - Returns false and logs error
- ❌ **Network not supported** - Lists supported networks
- ❌ **Invalid contract** - Validates ERC20 implementation

## Environment Variables

Required in `.env.local`:

```bash
NEXT_PUBLIC_TOKENADDRESS=0x...  # Your token contract address
NEXT_PUBLIC_RPC_ENDPOINT=https://...  # RPC URL for the network
```

## User Experience

When a user tries to make a transaction on the wrong network:

1. 🔍 System detects contract network
2. ⚠️ Warns user they're on wrong network
3. 🔄 Prompts wallet to switch
4. ✅ Proceeds with transaction once switched

If user manually changes network after connecting:

1. ⚠️ Guard detects network change
2. 🔄 Automatically switches back
3. 💬 Shows "Switching to correct network..." message
4. ✅ Returns to correct network

## Benefits

- 🛡️ **Security** - Prevents transactions on wrong networks
- 🎯 **Accuracy** - Ensures contract calls hit correct chain
- 👤 **UX** - Users don't need to know which network to use
- 🔒 **Protection** - Blocks accidental wrong-network transactions
- ⚡ **Automatic** - No manual configuration needed
