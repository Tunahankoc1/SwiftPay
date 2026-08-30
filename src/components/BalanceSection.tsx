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
          USDC deposits from Rabby and Phantom are combined into a single pool.
          Balance updates automatically every 1s while awaiting confirmation.
        </p>
      </div>

      <div className="balance-card">
        <div className="balance-row">
          <span>Confirmed</span>
          <strong>{balance?.totalConfirmedBalance ?? '—'} USDC</strong>
        </div>
        <div className="balance-row pending">
          <span>Pending</span>
          <strong>{balance?.totalPendingBalance ?? '—'} USDC</strong>
        </div>
      </div>

      {isConfirming && confirmingMessage && (
        <p className="confirming-message">{confirmingMessage}</p>
      )}

      {pending > 0 && !isConfirming && (
        <p className="hint confirming-hint">
          Pending balance confirming — auto-check active (1s).
        </p>
      )}

      <button
        type="button"
        className="button primary"
        onClick={() => void refreshBalance()}
        disabled={!canRefresh || isLoading || isConfirming}
      >
        Refresh Balance
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
        <h2>3. Deposit to Unified Balance</h2>
        <p>
         After deposit, confirmation is tracked automatically — ready for checkout without manual refresh.
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
              <label htmlFor={`amount-${chainId}`}>Amount</label>
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
                Deposit
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}
