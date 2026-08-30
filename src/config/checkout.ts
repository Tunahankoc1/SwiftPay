export type CheckoutItem = {
  id: string
  name: string
  description: string
  price: string
}

export const DEMO_ITEMS: CheckoutItem[] = [
  {
    id: 'starter',
    name: 'Arc Starter Kit',
    description: 'Testnet demo license — pay with Unified Balance',
    price: '1.00',
  },
  {
    id: 'pro',
    name: 'Arc Builder Pro',
    description: 'Developer tools bundle — cross-chain USDC checkout',
    price: '2.50',
  },
  {
    id: 'team',
    name: 'Arc Team Bundle',
    description: '5-user team bundle',
    price: '5.00',
  },
]

export const ARC_TESTNET = {
  chainId: 5042002,
  chainIdHex: '0x4CEF52',
  rpcUrl: 'https://rpc.testnet.arc.network',
  explorerUrl: 'https://testnet.arcscan.app',
  faucetUrl: 'https://faucet.circle.com',
  nativeSymbol: 'USDC',
} as const

export type DepositChain = 'Ethereum_Sepolia' | 'Base_Sepolia' | 'Solana_Devnet'

export const DEPOSIT_CHAINS: Record<
  DepositChain,
  { label: string; wallet: 'rabby' | 'phantom'; hint: string }
> = {
  Ethereum_Sepolia: {
    label: 'ETH Sepolia',
    wallet: 'rabby',
    hint: 'Deposit Ethereum Sepolia USDC with Rabby',
  },
  Base_Sepolia: {
    label: 'Base Sep.',
    wallet: 'rabby',
    hint: 'Deposit Base Sepolia USDC with Rabby',
  },
  Solana_Devnet: {
    label: 'Solana Dev.',
    wallet: 'phantom',
    hint: 'Deposit Solana Devnet USDC with Phantom',
  },
}
