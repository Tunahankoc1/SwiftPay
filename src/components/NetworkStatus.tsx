'use client'
import { useState, useEffect } from 'react'
import { createPublicClient, http } from 'viem'

const arcTestnet = {
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.testnet.arc.network'] } },
}

const client = createPublicClient({ chain: arcTestnet as any, transport: http() })

type NetworkData = {
  blockNumber: string
  gasPrice: string
  latency: string
  status: 'online' | 'offline' | 'loading'
}

export function NetworkStatus() {
  const [data, setData] = useState<NetworkData>({ blockNumber: '—', gasPrice: '—', latency: '—', status: 'loading' })

  async function fetchNetworkData() {
    try {
      const start = Date.now()
      const [blockNumber, gasPrice] = await Promise.all([
        client.getBlockNumber(),
        client.getGasPrice(),
      ])
      const latency = Date.now() - start
      setData({
        blockNumber: blockNumber.toString(),
        gasPrice: (Number(gasPrice) / 1e9).toFixed(4),
        latency: latency + 'ms',
        status: 'online'
      })
    } catch {
      setData(prev => ({ ...prev, status: 'offline' }))
    }
  }

  useEffect(() => {
    fetchNetworkData()
    const interval = setInterval(fetchNetworkData, 15000)
    return () => clearInterval(interval)
  }, [])

  const statusColor = data.status === 'online' ? '#10b981' : data.status === 'offline' ? '#ef4444' : '#f59e0b'
  const statusLabel = data.status === 'online' ? '● Online' : data.status === 'offline' ? '● Offline' : '● Loading'

  return (
    <div className="network-status-row">
      <div className="network-stat">
        <div className="network-stat-label">Network</div>
        <div className="network-stat-value" style={{ color: statusColor }}>{statusLabel}</div>
      </div>
      <div className="network-stat">
        <div className="network-stat-label">Latest Block</div>
        <div className="network-stat-value">#{data.blockNumber}</div>
      </div>
      <div className="network-stat">
        <div className="network-stat-label">Gas Price</div>
        <div className="network-stat-value">{data.gasPrice} Gwei</div>
      </div>
      <div className="network-stat">
        <div className="network-stat-label">Latency</div>
        <div className="network-stat-value">{data.latency}</div>
      </div>
    </div>
  )
}
