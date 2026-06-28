'use client'

import { useEffect, useState } from 'react'
import type { DepositChain } from '@/config/checkout'
import { DEPOSIT_CHAINS } from '@/config/checkout'
import { parseUsdcAmount } from '@/config/balance'
import { useWallet } from '@/context/WalletContext'

export function BalanceSection() {
  const {
    balance,
    refreshBalance,
    evmAddress,
    solanaAddress,
    status,
    isConfirming,
    confirmingMessage,
  } = useWallet()
  const isLoading = status === 'loading'
  const canRefresh = Boolean(evmAddress || solanaAddress)
  const pending = parseUsdcAmount(balance?.totalPendingBalance)

  useEffect(() => {
    if (!canRefresh || pending <= 0 || isConfirming || isLoading) {
      return
    }

    const timer = window.setInterval(() => {
      void refreshBalance({ silent: true })
    }, 1_000)

    return () => window.clearInterval(timer)
  }, [canRefresh, isConfirming, isLoading, pending, refreshBalance])

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>2. Unified Balance</h2>
        <p>
          Rabby ve Phantom&apos;daki USDC yatırımları tek havuzda birleşir.
          Onay beklerken bakiye 1 sn aralıkla otomatik güncellenir.
        </p>
      </div>

      <div className="balance-card">
        <div className="balance-row">
          <span>Onaylanmış</span>
          <strong>{balance?.totalConfirmedBalance ?? '—'} USDC</strong>
        </div>
        <div className="balance-row pending">
          <span>Bekleyen</span>
          <strong>{balance?.totalPendingBalance ?? '—'} USDC</strong>
        </div>
      </div>

      {isConfirming && confirmingMessage && (
        <p className="confirming-message">{confirmingMessage}</p>
      )}

      {pending > 0 && !isConfirming && (
        <p className="hint confirming-hint">
          Bekleyen bakiye onaylanıyor — otomatik kontrol aktif (1 sn).
        </p>
      )}

      <button
        type="button"
        className="button primary"
        onClick={() => void refreshBalance()}
        disabled={!canRefresh || isLoading || isConfirming}
      >
        Bakiyeyi yenile
      </button>
    </section>
  )
}

const DEFAULT_AMOUNTS: Record<DepositChain, string> = {
  Ethereum_Sepolia: '1.00',
  Base_Sepolia: '2.00',
  Solana_Devnet: '1.00',
}

export function DepositSection() {
  const { deposit, evmAddress, solanaAddress, status, isConfirming } = useWallet()
  const [amounts, setAmounts] = useState(DEFAULT_AMOUNTS)
  const isLoading = status === 'loading'

  const chains = Object.entries(DEPOSIT_CHAINS) as Array<
    [DepositChain, (typeof DEPOSIT_CHAINS)[DepositChain]]
  >

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>3. Unified Balance&apos;a yatır</h2>
        <p>
          Yatırım sonrası onay otomatik takip edilir — manuel yenilemeye gerek
          kalmadan checkout için hazır olur.
        </p>
      </div>

      <div className="deposit-grid deposit-grid-three">
        {chains.map(([chainId, meta]) => {
          const disabled =
            isLoading ||
            isConfirming ||
            (meta.wallet === 'rabby' ? !evmAddress : !solanaAddress)

          return (
            <div className="deposit-card" key={chainId}>
              <div className="wallet-card-top">
                <span className="badge">
                  {meta.wallet === 'rabby' ? 'Rabby' : 'Phantom'}
                </span>
                <strong>{meta.label}</strong>
              </div>
              <label htmlFor={`amount-${chainId}`}>Miktar</label>
              <div className="input-row">
                <input
                  id={`amount-${chainId}`}
                  type="text"
                  inputMode="decimal"
                  value={amounts[chainId]}
                  onChange={(event) =>
                    setAmounts((prev) => ({
                      ...prev,
                      [chainId]: event.target.value,
                    }))
                  }
                  disabled={disabled}
                />
                <span>USDC</span>
              </div>
              <p className="hint">{meta.hint}</p>
              <button
                type="button"
                className="button secondary"
                onClick={() => void deposit(chainId, amounts[chainId])}
                disabled={disabled}
              >
                Yatır ve onayı bekle
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}
