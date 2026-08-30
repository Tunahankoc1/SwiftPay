import { BalanceSection, DepositSection } from '@/components/BalanceSection'
import { CheckoutSection } from '@/components/CheckoutSection'
import { StatusBanner } from '@/components/StatusBanner'
import { WalletSection } from '@/components/WalletSection'
import { AgentChat } from '@/components/AgentChat'
import { PaymentHistory } from '@/components/PaymentHistory'
import { ARC_TESTNET } from '@/config/checkout'

export default function HomePage() {
  return (
    <div className="dashboard-root">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="sidebar-logo-icon">⚡</span>
          <span className="sidebar-logo-text">SwiftPay</span>
        </div>
        <nav className="sidebar-nav">
          <a href="#home" className="sidebar-link active">
            <span>🏠</span> Home
          </a>
          <a href="#send" className="sidebar-link">
            <span>💸</span> Send
          </a>
          <a href="#agent" className="sidebar-link">
            <span>🤖</span> Agent
          </a>
          <a href="#history" className="sidebar-link">
            <span>📋</span> History
          </a>
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-network">
            <span className="network-dot"></span>
            Arc Testnet
          </div>
        </div>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-title">SwiftPay</h1>
            <p className="dashboard-subtitle">Cross-chain USDC payments on Arc · Built on Arc</p>
          </div>
          <StatusBanner />
        </header>

        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-label">Network</div>
            <div className="stat-value">Arc Testnet</div>
            <div className="stat-sub">Chain ID {ARC_TESTNET.chainId}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Gas Token</div>
            <div className="stat-value">USDC</div>
            <div className="stat-sub">No ETH needed</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Supported Chains</div>
            <div className="stat-value">3 Chains</div>
            <div className="stat-sub">ETH · Base · Solana</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Status</div>
            <div className="stat-value stat-green">● Live</div>
            <div className="stat-sub">Testnet active</div>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-col-left">
            <div id="home"><WalletSection /></div>
            <BalanceSection />
            <DepositSection />
            <div id="history"><PaymentHistory /></div>
          </div>
          <div className="dashboard-col-right">
            <div id="send"><CheckoutSection /></div>
            <div id="agent"><AgentChat /></div>
          </div>
        </div>

        <footer className="dashboard-footer">
          <p>
            Arc Testnet · Chain ID {ARC_TESTNET.chainId} · Gas token USDC ·{' '}
            <a href="https://docs.arc.io/app-kit/unified-balance" target="_blank" rel="noreferrer">Unified Balance docs</a>
            {' '}· Built on Arc
          </p>
        </footer>
      </div>
    </div>
  )
}
