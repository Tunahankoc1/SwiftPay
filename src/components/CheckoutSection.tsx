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
          USDC&apos;niz Rabby (Ethereum/Base) veya Phantom (Solana)&apos;da olsa
          bile Unified Balance Arc Testnet&apos;te tek tıkla ödeme yapar.
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
          <span>Seçilen ürün</span>
          <strong>{selectedItem.name}</strong>
        </div>
        <div className="summary-row total">
          <span>Toplam</span>
          <strong>{selectedItem.price} USDC</strong>
        </div>
      </div>

      <label htmlFor="merchant-address">Satıcı / alıcı Arc adresi</label>
      <input
        id="merchant-address"
        type="text"
        placeholder="0x..."
        value={merchantAddress}
        onChange={(event) => setMerchantAddress(event.target.value.trim())}
        disabled={isLoading}
      />
      <p className="hint">
        Test için kendi Arc Testnet adresinizi veya başka bir test cüzdanını
        girebilirsiniz.
      </p>

      {!hasEnoughBalance && balance && !willAutoWait && (
        <p className="warning">
          Onaylanmış bakiye yetersiz. Önce Rabby veya Phantom ile yatırım yapın.
        </p>
      )}

      {willAutoWait && (
        <p className="hint confirming-hint">
          Bekleyen bakiye var — ödeme tıklandığında onay 1 sn aralıkla otomatik
          beklenir.
        </p>
      )}

      <button
        type="button"
        className="button primary pay-button"
        onClick={() => void payOnArc(selectedItem.price, merchantAddress)}
        disabled={!canPay || isLoading || isConfirming || !merchantAddress}
      >
        Arc Testnet&apos;te öde — {selectedItem.price} USDC
      </button>

      <hr style={{ marginTop: 20, marginBottom: 12 }} />

      <label htmlFor="solana-recipient">Arc → Solana transferi (alıcı Phantom adresi)</label>
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
            setSolanaError('Geçersiz Solana adresi — base58, ~44 karakter bekleniyor.')
            return
          }
          void transferArcToSolana(selectedItem.price, solanaRecipient)
        }}
        disabled={!evmAddress || !solanaAddress || isLoading || !solanaRecipient}
      >
        Arc → Solana Devnet'e gönder — {selectedItem.price} USDC
      </button>

      {solanaError && <p className="warning">{solanaError}</p>}
    </section>
  )
}
