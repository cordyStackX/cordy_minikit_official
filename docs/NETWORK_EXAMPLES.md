# Network Configuration Examples

## Using Different Networks

The Cordy MiniKit automatically detects which network your contract is deployed on from the following supported networks:

### 🌐 All Supported Networks

| Network | Chain ID | Native Token | Explorer |
|---------|----------|--------------|----------|
| Ethereum Mainnet | 1 | ETH | etherscan.io |
| Sepolia Testnet | 11155111 | ETH | sepolia.etherscan.io |
| Base Mainnet | 8453 | ETH | basescan.org |
| Base Sepolia | 84532 | ETH | sepolia.basescan.org |
| Core Mainnet | 1116 | CORE | scan.coredao.org |
| Core Testnet | 1115 | tCORE | scan.test.btcs.network |
| Polygon Mainnet | 137 | MATIC | polygonscan.com |
| Polygon Amoy | 80002 | MATIC | amoy.polygonscan.com |
| Arbitrum One | 42161 | ETH | arbiscan.io |
| Arbitrum Sepolia | 421614 | ETH | sepolia.arbiscan.io |
| Optimism Mainnet | 10 | ETH | optimistic.etherscan.io |
| Optimism Sepolia | 11155420 | ETH | sepolia-optimism.etherscan.io |
| Avalanche C-Chain | 43114 | AVAX | snowtrace.io |
| Avalanche Fuji | 43113 | AVAX | testnet.snowtrace.io |
| BNB Smart Chain | 56 | BNB | bscscan.com |
| BNB Testnet | 97 | tBNB | testnet.bscscan.com |

## Configuration Examples

### Example 1: Core Blockchain Testnet

```bash
# .env.local
NEXT_PUBLIC_TOKENADDRESS=0x09fDA914e378a9d0F2900A93F5bC947596dD45F0
NEXT_PUBLIC_RPC_ENDPOINT=https://rpc.test.btcs.network
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

```tsx
import { ProvidersClientWrapper } from '@cordystackx/cordy_minikit';

// The system will automatically detect Core Testnet (Chain ID: 1115)
// and enforce users stay on this network
```

### Example 2: Ethereum Mainnet

```bash
# .env.local
NEXT_PUBLIC_TOKENADDRESS=0x6B175474E89094C44Da98b954EedeAC495271d0F  # DAI
NEXT_PUBLIC_RPC_ENDPOINT=https://eth.llamarpc.com
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

### Example 3: Polygon Mainnet

```bash
# .env.local
NEXT_PUBLIC_TOKENADDRESS=0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174  # USDC
NEXT_PUBLIC_RPC_ENDPOINT=https://polygon-rpc.com
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

### Example 4: Arbitrum One

```bash
# .env.local
NEXT_PUBLIC_TOKENADDRESS=0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9  # USDT
NEXT_PUBLIC_RPC_ENDPOINT=https://arb1.arbitrum.io/rpc
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

## Advanced: Check Network Support

```tsx
import { isNetworkSupported, getNetworkByChainId, NETWORKS } from '@cordystackx/cordy_minikit';

// Check if a network is supported
const supported = isNetworkSupported(1116);  // Core Mainnet
console.log(supported);  // true

// Get network details by chain ID
const network = getNetworkByChainId(1116);
console.log(network?.chainName);  // "Core Blockchain Mainnet"

// Access all networks
console.log(NETWORKS.CORE_MAINNET);
// {
//   chainId: 1116,
//   chainName: "Core Blockchain Mainnet",
//   nativeCurrency: { name: "Core", symbol: "CORE", decimals: 18 },
//   rpcUrls: ["https://rpc.coredao.org"],
//   blockExplorerUrls: ["https://scan.coredao.org"]
// }
```

## Network Detection Flow

1. **Deploy Contract** - Your ERC20 contract is deployed on any supported network
2. **Set Environment** - Configure `NEXT_PUBLIC_TOKENADDRESS` and `NEXT_PUBLIC_RPC_ENDPOINT`
3. **Auto-Detection** - System scans all 16 networks to find your contract
4. **Enforcement** - Users are forced to use the detected network
5. **Guard** - Network changes are blocked and auto-reverted

## Multi-Network Support

If you want to support multiple networks, deploy your contract on multiple chains and configure accordingly:

```tsx
// For Core Testnet deployment
const coreConfig = {
  tokenAddress: "0x09fDA914e378a9d0F2900A93F5bC947596dD45F0",
  rpcUrl: "https://rpc.test.btcs.network"
};

// For Ethereum Sepolia deployment
const sepoliaConfig = {
  tokenAddress: "0x1234567890123456789012345678901234567890",
  rpcUrl: "https://rpc.sepolia.org"
};

// The system will detect which network each contract is on
```

## Testing on Testnets

Recommended testnets for development:

- **Sepolia** (Ethereum) - Free ETH from faucets
- **Base Sepolia** - Bridged ETH from Sepolia
- **Core Testnet** - Free tCORE from faucet
- **Polygon Amoy** - Free MATIC from faucet
- **Avalanche Fuji** - Free AVAX from faucet
- **BNB Testnet** - Free tBNB from faucet

## Network-Specific Features

### Core Blockchain
- Native CORE token staking
- Bitcoin-secured consensus
- Low transaction fees

### Polygon
- High throughput
- Low fees
- EVM compatible

### Arbitrum & Optimism
- Ethereum L2 scaling
- Lower gas fees than mainnet
- Full EVM compatibility

### Avalanche
- Sub-second finality
- Customizable subnets
- High transaction throughput

### BNB Chain
- Fast block times
- Low transaction costs
- Large ecosystem

## Need More Networks?

Open an issue on [GitHub](https://github.com/cordyStackX/cordy_minikit_official/issues) to request additional network support!
