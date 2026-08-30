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
        <h2>1. Connect Wallets</h2>
        <p>
          Connect your Rabby (EVM) and Phantom (Solana) wallets. Pay on Arc
          Testnet with a single click — even if your USDC is on
          Ethereum Sepolia, Base Sepolia, or Solana Devnet.
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
                Disconnect
              </button>
            </>
          ) : (
            <button
              type="button"
              className="button primary"
              onClick={() => void connectRabby()}
              disabled={isLoading}
            >
              Connect Rabby
            </button>
          )}
          <p className="hint">
            Add Ethereum Sepolia, Base Sepolia, and Arc Testnet networks.
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
                Disconnect
              </button>
            </>
          ) : (
            <button
              type="button"
              className="button secondary"
              onClick={() => void connectPhantom()}
              disabled={isLoading}
            >
              Connect Phantom
            </button>
          )}
          <p className="hint">Phantom must be in Devnet mode.</p>
        </div>
      </div>
      <div className="info-box">
        <strong>Cross-chain flow (Rabby ↔ Phantom)</strong>
        <ul>
          <li>
            <strong>Rabby → Unified Balance:</strong> Deposit USDC from Ethereum Sepolia or Base Sepolia
          </li>
          <li>
            <strong>Phantom → Unified Balance:</strong> Deposit USDC from Solana Devnet
          </li>
          <li>
            <strong>Checkout:</strong> App Kit automatically pulls USDC from Rabby and Phantom sources and pays on Arc Testnet
          </li>
        </ul>
      </div>
      <div className="info-box">
        <strong>Testnet setup (free)</strong>
        <ul>
          <li>
            <a href={ARC_TESTNET.faucetUrl} target="_blank" rel="noreferrer">
              Circle Faucet
            </a>{' '}
            — Ethereum Sepolia, Base Sepolia, Solana Devnet USDC
          </li>
          <li>Testnet ETH for gas (Base/Ethereum Sepolia) — public faucet</li>
          <li>SOL for Solana Devnet — Solana faucet</li>
          <li>
            Arc Testnet: Chain ID {ARC_TESTNET.chainId}, gas token USDC
          </li>
        </ul>
      </div>
    </section>
  )
}
