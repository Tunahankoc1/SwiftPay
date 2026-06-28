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
    description: 'Testnet demo lisansı — Unified Balance ile ödeme',
    price: '1.00',
  },
  {
    id: 'pro',
    name: 'Arc Builder Pro',
    description: 'Geliştirici araçları paketi — cross-chain USDC checkout',
    price: '2.50',
  },
  {
    id: 'team',
    name: 'Arc Team Bundle',
    description: '5 kullanıcılık ekip paketi',
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
    label: 'Ethereum Sepolia',
    wallet: 'rabby',
    hint: 'Rabby ile Ethereum Sepolia USDC yatırın',
  },
  Base_Sepolia: {
    label: 'Base Sepolia',
    wallet: 'rabby',
    hint: 'Rabby ile Base Sepolia USDC yatırın',
  },
  Solana_Devnet: {
    label: 'Solana Devnet',
    wallet: 'phantom',
    hint: 'Phantom ile Solana Devnet USDC yatırın',
  },
}
