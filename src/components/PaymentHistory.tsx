'use client'
import { useEffect, useState } from 'react'
import { ARC_TESTNET } from '@/config/checkout'

type TxRecord = {
  id: string
  to: string
  amount: string
  txHash: string
  timestamp: string
  status: 'success' | 'pending'
}

export function PaymentHistory() {
  const [history, setHistory] = useState<TxRecord[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('swiftpay_history')
    if (saved) setHistory(JSON.parse(saved))
  }, [])

  if (history.length === 0) {
    return (
      <section className="panel" id="history">
        <div className="panel-header">
          <h2>📋 Payment History</h2>
          <p>No transactions yet. Send your first USDC payment!</p>
        </div>
        <div style={{ textAlign: 'center', padding: '2rem', color: '#475569', fontSize: '2rem' }}>
          🕳️
        </div>
      </section>
    )
  }

  return (
    <section className="panel" id="history">
      <div className="panel-header">
        <h2>📋 Payment History</h2>
        <p>{history.length} transaction{history.length > 1 ? 's' : ''}</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {history.map((tx) => (
          <div key={tx.id} style={{
            padding: '1rem',
            borderRadius: '12px',
            background: 'rgba(2, 6, 23, 0.6)',
            border: '1px solid rgba(148, 163, 184, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>
                {new Date(tx.timestamp).toLocaleString()}
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#94a3b8' }}>
                To: {tx.to.slice(0, 8)}...{tx.to.slice(-6)}
              </div>
              {tx.txHash && (
                
                  href={`${ARC_TESTNET.explorerUrl}/tx/${tx.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: '0.75rem', color: '#7dd3fc' }}
                >
                  View on Explorer ↗
                </a>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#38bdf8' }}>
                {tx.amount} USDC
              </div>
              <div style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '99px',
                background: tx.status === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                color: tx.status === 'success' ? '#10b981' : '#f59e0b',
                display: 'inline-block',
                marginTop: '0.25rem'
              }}>
                {tx.status === 'success' ? '✓ Success' : '⏳ Pending'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
