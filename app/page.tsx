import { BalanceSection, DepositSection } from '@/components/BalanceSection'
import { CheckoutSection } from '@/components/CheckoutSection'
import { StatusBanner } from '@/components/StatusBanner'
import { WalletSection } from '@/components/WalletSection'
import { ARC_TESTNET } from '@/config/checkout'

export default function HomePage() {
  return (
    <div className="app">
      <header className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Arc Testnet · Unified Balance · Next.js + Wagmi</p>
          <h1>SwiftPay</h1>
          <p className="subtitle">
            Pay on Arc Testnet with a single click — even if your USDC is on
            Ethereum Sepolia, Base Sepolia, or Solana Devnet. Powered by Rabby (EVM),
            Phantom (Solana), and Circle App Kit Unified Balance.
          </p>
        </div>
      </header>

      <StatusBanner />

      <main className="layout">
        <WalletSection />
        <BalanceSection />
        <DepositSection />
        <CheckoutSection />
      </main>

      <footer className="footer">
        <p>
          Arc Testnet · Chain ID {ARC_TESTNET.chainId} · Gas token USDC ·{' '}
          <a
            href="https://docs.arc.io/app-kit/unified-balance"
            target="_blank"
            rel="noreferrer"
          >
            Unified Balance docs
          </a>
        </p>
      </footer>
    </div>
  )
}
