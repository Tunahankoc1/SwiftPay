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
          <h1>Cross-chain USDC Checkout</h1>
          <p className="subtitle">
            USDC&apos;niz Ethereum Sepolia, Base Sepolia veya Solana Devnet&apos;te
            olsa bile Arc Testnet&apos;te tek tıkla ödeme yapın. Rabby (EVM) ve
            Phantom (Solana) ile Circle App Kit Unified Balance.
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
