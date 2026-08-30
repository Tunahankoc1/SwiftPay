'use client'

import { useMemo, useState } from 'react'
import { DEMO_ITEMS } from '@/config/checkout'
import { useWallet } from '@/context/WalletContext'

export function CheckoutSection() {
  const { payOnArc, evmAddress, solanaAddress, balance, status, isConfirming, transferArcToSolana, debugInfo } = useWallet()
  const [selectedId, setSelectedId] = useState(DEMO_ITEMS[1]?.id ?? 'pro')
  const [merchantAddress, setMerchantAddress] = useState('')
  const isLoading = status === 'loading'
  const [solanaRecipient, setSolanaRecipient] = useState('')
  const [solanaError, setSolanaError] = useState('')

  const selectedItem = useMemo(
    () => DEMO_ITEMS.find((item) => item.id === selectedId) ?? DEMO_ITEMS[0],
    [selectedId],
  )

  const confirmed = Number.parseFloat(balance?.totalConfirmedBalance ?? '0')
  const pending = Number.parseFloat(balance?.totalPendingBalance ?? '0')
  const price = Number.parseFloat(selectedItem.price)
  const hasEnoughBalance = confirmed >= price
  const willAutoWait = pending > 0 && confirmed < price
  const canPay = Boolean(evmAddress || solanaAddress)

  return (
    <section className="panel checkout-panel">
      <div className="panel-header">
        <h2>4. Arc Checkout</h2>
        <p>
          Your USDC from Rabby (Ethereum/Base) or Phantom (Solana) is
          automatically pulled by Unified Balance for one-click payment on Arc Testnet.
        </p>
      </div>

      <div className="product-grid">
        {DEMO_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`product-card ${selectedId === item.id ? 'selected' : ''}`}
            onClick={() => setSelectedId(item.id)}
          >
            <strong>{item.name}</strong>
            <span className="price">{item.price} USDC</span>
            <p>{item.description}</p>
          </button>
        ))}
      </div>

      <div className="checkout-summary">
        <div className="summary-row">
          <span>Selected product</span>
          <strong>{selectedItem.name}</strong>
        </div>
        <div className="summary-row total">
          <span>Toplam</span>
          <strong>{selectedItem.price} USDC</strong>
        </div>
      </div>

      <label htmlFor="merchant-address">Merchant / recipient Arc address</label>
      <input
        id="merchant-address"
        type="text"
        placeholder="0x..."
        value={merchantAddress}
        onChange={(event) => setMerchantAddress(event.target.value.trim())}
        disabled={isLoading}
      />
      <p className="hint">
        You can enter your own Arc Testnet address or another test wallet
        for testing purposes.
      </p>

      {!hasEnoughBalance && balance && !willAutoWait && (
        <p className="warning">
        Insufficient confirmed balance. Please deposit first using Rabby or Phantom.
        </p>
      )}

      {willAutoWait && (
        <p className="hint confirming-hint">
          Pending balance detected — confirmation is automatically awaited at 1s intervals when payment is clicked.
        </p>
      )}

      <button
        type="button"
        className="button primary pay-button"
        onClick={() => void payOnArc(selectedItem.price, merchantAddress)}
        disabled={!canPay || isLoading || isConfirming || !merchantAddress}
      >
        Pay on Arc Testnet — {selectedItem.price} USDC
      </button>

      <hr style={{ marginTop: 20, marginBottom: 12 }} />

      <label htmlFor="solana-recipient">Arc → Solana transfer (recipient Phantom address)</label>
      <input
        id="solana-recipient"
        type="text"
        placeholder="Enter Solana address"
        value={solanaRecipient}
        onChange={(e) => setSolanaRecipient(e.target.value.trim())}
        disabled={isLoading}
      />

      <button
        type="button"
        className="button secondary"
        onClick={() => {
          setSolanaError('')
          const isBase58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(solanaRecipient)
          if (!isBase58) {
            setSolanaError('Invalid Solana address — base58 format, ~44 characters expected.')
            return
          }
          void transferArcToSolana(selectedItem.price, solanaRecipient)
        }}
        disabled={!evmAddress || !solanaAddress || isLoading || !solanaRecipient}
      >
        Send Arc → Solana Devnet — {selectedItem.price} USDC
      </button>

      {solanaError && <p className="warning">{solanaError}</p>}
    </section>
  )
}
