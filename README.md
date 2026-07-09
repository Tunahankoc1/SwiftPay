# Arc Unified Balance Checkout

Pay on Arc Testnet with a single click — even if your USDC is on Ethereum Sepolia, Base Sepolia, or Solana Devnet.

**Stack:** Next.js + Wagmi + Circle App Kit Unified Balance  
**Wallets:** Rabby (EVM) + Phantom (Solana)

---

## What It Does

- Connect your EVM wallet via **Rabby** (Ethereum Sepolia / Base Sepolia / Arc Testnet)
- Connect your Solana wallet via **Phantom** (Devnet mode)
- Deposit USDC from either wallet into **Unified Balance**
- Circle App Kit automatically pulls USDC from Rabby and Phantom sources
- Complete checkout on Arc Testnet in a single click

---

## Prerequisites

- Node.js 22+
- Rabby browser extension
- Phantom browser extension (Devnet mode enabled)
- Testnet USDC: [Circle Faucet](https://faucet.circle.com)
- Testnet ETH for gas (Base / Ethereum Sepolia)
- SOL for gas (Solana Devnet)

---

## Setup

```bash
cd ~/Projects/arc-unified-checkout
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Usage Flow

| Step | Action |
|------|--------|
| 1 | Connect Rabby and Phantom wallets |
| 2 | Refresh your Unified Balance |
| 3 | Deposit USDC via Rabby (ETH/Base) or Phantom (Solana) |
| 4 | Select a product, enter recipient Arc address, and pay |

---

## Arc Testnet Details

| Field | Value |
|-------|-------|
| Chain ID | `5042002` |
| RPC | `https://rpc.testnet.arc.network` |
| Gas Token | USDC (18 decimals) |
| Explorer | [testnet.arcscan.app](https://testnet.arcscan.app) |

---

## Commands

```bash
npm run dev        # Start development server
npm run build      # Production build
npm run start      # Start production server
npm run typecheck  # TypeScript type check
```

---

## Circle Products Used

- **USDC** — primary stablecoin rail for all payments
- **Circle App Kit (Unified Balance)** — aggregates USDC across EVM and Solana wallets into a single spendable balance
- **CCTP / Bridge Kit** — powers cross-chain USDC movement under the hood

---

## Architecture

```
User
 ├── Rabby Wallet (Ethereum Sepolia / Base Sepolia / Arc Testnet)
 └── Phantom Wallet (Solana Devnet)
        │
        ▼
Circle App Kit — Unified Balance
        │
        ▼
Arc Testnet — Single-click USDC Checkout
```

---

## Circle Product Feedback

**Why we chose these products:**  
Unified Balance solves a real UX problem — users shouldn't need to bridge manually before paying. Circle App Kit made it possible to abstract away multi-chain complexity into a single checkout experience.

**What worked well:**  
- App Kit's Unified Balance API was straightforward to integrate with Wagmi and Phantom adapters
- USDC as the gas token on Arc removes the need to manage a separate native token, which simplifies the UX significantly

**What could be improved:**  
- Better error messages when wallet chain doesn't match expected network
- More detailed logging in the Unified Balance deposit flow for debugging

---

## Documentation

- [Unified Balance](https://developers.circle.com/w3s/docs/unified-balance)
- [Deposit & Spend Quickstart](https://developers.circle.com/w3s/docs/deposit-and-spend)
- [Arc Builder AI Guide](https://docs.arc.network)

---

## Notes

> This application is for **testnet purposes only**. Do not use real funds.  
> Gas on Arc is paid in USDC, not ETH.  
> Unified Balance manages cross-chain USDC transfers between Rabby and Phantom via Circle App Kit.
