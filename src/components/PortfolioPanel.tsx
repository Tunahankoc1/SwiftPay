'use client'
import { useState, useEffect } from 'react'
import { useWallet } from '@/context/WalletContext'
import { createPublicClient, http, parseAbi } from 'viem'
import { sepolia, baseSepolia } from 'viem/chains'
import { Connection, PublicKey } from '@solana/web3.js'

const arcTestnet = {
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.testnet.arc.network'] } },
}

const USDC_ABI = parseAbi(['function balanceOf(address) view returns (uint256)'])

const EVM_CHAINS = [
  { chain: sepolia, name: 'Ethereum Sepolia', color: '#627EEA', usdcAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' as `0x${string}` },
  { chain: baseSepolia, name: 'Base Sepolia', color: '#0052FF', usdcAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as `0x${string}` },
  { chain: arcTestnet as any, name: 'Arc Testnet', color: '#10B981', usdcAddress: '0x3600000000000000000000000000000000000000' as `0x${string}` },
]

const SOLANA_USDC_DEVNET = 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr'

async function getSolanaUSDCBalance(walletAddress: string): Promise<string> {
  try {
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed')
    const wallet = new PublicKey(walletAddress)
    const mint = new PublicKey(SOLANA_USDC_DEVNET)
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(wallet, { mint })
    if (tokenAccounts.value.length === 0) return '0.00'
    const balance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount
    return (balance || 0).toFixed(2)
  } catch {
    return '—'
  }
}

export function PortfolioPanel() {
  const { evmAddress, solanaAddress } = useWallet()
  const [evmBalances, setEvmBalances] = useState(EVM_CHAINS.map(c => ({ name: c.name, color: c.color, balance: '—' })))
  const [solanaBalance, setSolanaBalance] = useState('—')
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  async function fetchBalances() {
    setLoading(true)
    try {
      if (evmAddress) {
        const results = await Promise.all(
          EVM_CHAINS.map(async ({ chain, usdcAddress, name, color }) => {
            try {
              const client = createPublicClient({ chain: chain as any, transport: http() })
              const raw = await client.readContract({ address: usdcAddress, abi: USDC_ABI, functionName: 'balanceOf', args: [evmAddress as `0x${string}`] })
              return { name, color, balance: (Number(raw) / 1e6).toFixed(2) }
            } catch {
              return { name, color, balance: '—' }
            }
          })
        )
        setEvmBalances(results)
      }
      if (solanaAddress) {
        const bal = await getSolanaUSDCBalance(solanaAddress)
        setSolanaBalance(bal)
      }
      setLastUpdated(new Date().toLocaleTimeString())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (evmAddress || solanaAddress) fetchBalances()
  }, [evmAddress, solanaAddress])

  const evmTotal = evmBalances.reduce((sum, c) => sum + (parseFloat(c.balance) || 0), 0)
  const solTotal = parseFloat(solanaBalance) || 0
  const total = evmTotal + solTotal

  const allBalances = [
    ...evmBalances,
    { name: 'Solana Devnet', color: '#9945FF', balance: solanaAddress ? solanaBalance : null }
  ]

  return (
    <section className="panel">
      <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>💼 Multi-Chain Portfolio</h2>
          <p>{evmAddress || solanaAddress ? 'USDC balances across all chains' : 'Connect a wallet to see your portfolio'}</p>
        </div>
        {(evmAddress || solanaAddress) && (
          <button className="button secondary" style={{ minHeight: '36px', padding: '0.4rem 0.9rem', fontSize: '0.8rem' }} onClick={fetchBalances} disabled={loading}>
            {loading ? '⏳' : '↻ Refresh'}
          </button>
        )}
      </div>

      {(evmAddress || solanaAddress) ? (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
            {allBalances.map((chain) => {
              if (chain.balance === null) return null
              const bal = parseFloat(chain.balance) || 0
              const pct = total > 0 ? (bal / total) * 100 : 0
              return (
                <div key={chain.name} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: chain.color, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.85rem', color: '#e2e8f0' }}>{chain.name}</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8' }}>{chain.balance} USDC</span>
                    </div>
                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '99px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: pct + '%', background: chain.color, borderRadius: '99px', transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{ padding: '1rem', background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 600 }}>Total USDC</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38bdf8' }}>{total.toFixed(2)} USDC</span>
            </div>
            {lastUpdated && <div style={{ fontSize: '0.7rem', color: '#475569', marginTop: '0.25rem', textAlign: 'right' }}>Updated {lastUpdated}</div>}
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#475569' }}>
          Connect your Rabby or Phantom wallet to see your multi-chain USDC portfolio.
        </div>
      )}
    </section>
  )
}
