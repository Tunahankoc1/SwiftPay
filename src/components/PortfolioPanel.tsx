'use client'
import { useState, useEffect } from 'react'
import { useWallet } from '@/context/WalletContext'

type ChainBalance = {
  chain: string
  balance: string
  color: string
  rpc: string
  usdcAddress: string
}

const CHAINS: ChainBalance[] = [
  { chain: 'Ethereum Sepolia', balance: '0', color: '#627EEA', rpc: 'https://rpc.sepolia.org', usdcAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' },
  { chain: 'Base Sepolia', balance: '0', color: '#0052FF', rpc: 'https://sepolia.base.org', usdcAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' },
  { chain: 'Arc Testnet', balance: '0', color: '#10B981', rpc: 'https://rpc.testnet.arc.network', usdcAddress: '0x3600000000000000000000000000000000000000' },
]

async function getUSDCBalance(rpc: string, usdcAddress: string, walletAddress: string): Promise<string> {
  try {
    const paddedAddress = '0x' + '0'.repeat(24) + walletAddress.slice(2)
    const res = await fetch(rpc, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_call', id: 1, params: [{ to: usdcAddress, data: '0x70a08231' + paddedAddress }, 'latest'] })
    })
    const data = await res.json()
    if (data.result && data.result !== '0x') return (parseInt(data.result, 16) / 1e6).toFixed(2)
    return '0.00'
  } catch { return '—' }
}

export function PortfolioPanel() {
  const { evmAddress, solanaAddress } = useWallet()
  const [balances, setBalances] = useState<ChainBalance[]>(CHAINS)
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  async function fetchBalances() {
    if (!evmAddress) return
    setLoading(true)
    try {
      const updated = await Promise.all(CHAINS.map(async (chain) => ({ ...chain, balance: await getUSDCBalance(chain.rpc, chain.usdcAddress, evmAddress) })))
      setBalances(updated)
      setLastUpdated(new Date().toLocaleTimeString())
    } finally { setLoading(false) }
  }

  useEffect(() => { if (evmAddress) fetchBalances() }, [evmAddress])

  const total = balances.reduce((sum, c) => sum + (parseFloat(c.balance) || 0), 0)

  return (
    <section className="panel">
      <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>💼 Multi-Chain Portfolio</h2>
          <p>{evmAddress ? 'USDC balances across all chains' : 'Connect Rabby to see your portfolio'}</p>
        </div>
        {evmAddress && (
          <button className="button secondary" style={{ minHeight: '36px', padding: '0.4rem 0.9rem', fontSize: '0.8rem' }} onClick={fetchBalances} disabled={loading}>
            {loading ? '⏳' : '↻ Refresh'}
          </button>
        )}
      </div>
      {evmAddress ? (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
            {balances.map((chain) => {
              const bal = parseFloat(chain.balance) || 0
              const pct = total > 0 ? (bal / total) * 100 : 0
              return (
                <div key={chain.chain} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: chain.color, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.85rem', color: '#e2e8f0' }}>{chain.chain}</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8' }}>{chain.balance} USDC</span>
                    </div>
                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '99px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: pct + '%', background: chain.color, borderRadius: '99px', transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                </div>
              )
            })}
            {solanaAddress && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#9945FF', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.85rem', color: '#e2e8f0' }}>Solana Devnet</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8' }}>— USDC</span>
                  </div>
                </div>
              </div>
            )}
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
        <div style={{ textAlign: 'center', padding: '2rem', color: '#475569' }}>Connect your Rabby wallet to see your multi-chain USDC portfolio.</div>
      )}
    </section>
  )
}
