'use client'

import { shortenAddress } from '@/lib/evmWallet'
import { useWallet } from '@/context/WalletContext'
import { ARC_TESTNET } from '@/config/checkout'

export function WalletSection() {
  const {
    evmAddress,
    solanaAddress,
    connectRabby,
    connectPhantom,
    disconnectRabby,
    disconnectPhantom,
    status,
  } = useWallet()

  const isLoading = status === 'loading'

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>1. Cüzdanları bağla</h2>
        <p>
          Rabby (EVM) ve Phantom (Solana) cüzdanlarını bağlayın. USDC&apos;niz
          Ethereum Sepolia, Base Sepolia veya Solana Devnet&apos;te olsa bile Arc
          Testnet&apos;te tek tıkla ödeyebilirsiniz.
        </p>
      </div>

      <div className="wallet-grid">
        <div className="wallet-card">
          <div className="wallet-card-top">
            <span className="badge">EVM</span>
            <strong>Rabby</strong>
          </div>
          {evmAddress ? (
            <>
              <p className="wallet-address">Rabby: {shortenAddress(evmAddress)}</p>
              <button
                type="button"
                className="button secondary"
                onClick={disconnectRabby}
                disabled={isLoading}
              >
                Bağlantıyı kes
              </button>
            </>
          ) : (
            <button
              type="button"
              className="button primary"
              onClick={() => void connectRabby()}
              disabled={isLoading}
            >
              Rabby bağla
            </button>
          )}
          <p className="hint">
            Ethereum Sepolia, Base Sepolia ve Arc Testnet ağlarını ekleyin.
          </p>
        </div>

        <div className="wallet-card">
          <div className="wallet-card-top">
            <span className="badge">Solana</span>
            <strong>Phantom</strong>
          </div>
          {solanaAddress ? (
            <>
              <p className="wallet-address">Phantom: {shortenAddress(solanaAddress)}</p>
              <button
                type="button"
                className="button secondary"
                onClick={disconnectPhantom}
                disabled={isLoading}
              >
                Bağlantıyı kes
              </button>
            </>
          ) : (
            <button
              type="button"
              className="button secondary"
              onClick={() => void connectPhantom()}
              disabled={isLoading}
            >
              Phantom bağla
            </button>
          )}
          <p className="hint">Phantom Devnet modunda olmalı.</p>
        </div>
      </div>

      <div className="info-box">
        <strong>Cross-chain akış (Rabby ↔ Phantom)</strong>
        <ul>
          <li>
            <strong>Rabby → Unified Balance:</strong> Ethereum Sepolia veya Base
            Sepolia USDC yatırın
          </li>
          <li>
            <strong>Phantom → Unified Balance:</strong> Solana Devnet USDC yatırın
          </li>
          <li>
            <strong>Checkout:</strong> App Kit, Rabby ve Phantom kaynaklarından
            otomatik USDC çeker ve Arc Testnet&apos;te öder
          </li>
        </ul>
      </div>

      <div className="info-box">
        <strong>Testnet hazırlığı (ücretsiz)</strong>
        <ul>
          <li>
            <a href={ARC_TESTNET.faucetUrl} target="_blank" rel="noreferrer">
              Circle Faucet
            </a>{' '}
            — Ethereum Sepolia, Base Sepolia, Solana Devnet USDC
          </li>
          <li>Base/Ethereum Sepolia için testnet ETH (gas) — public faucet</li>
          <li>Solana Devnet için SOL — Solana faucet</li>
          <li>
            Arc Testnet: Chain ID {ARC_TESTNET.chainId}, gas token USDC
          </li>
        </ul>
      </div>
    </section>
  )
}
