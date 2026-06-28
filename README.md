# Arc Unified Balance Checkout

USDC'niz **Ethereum Sepolia**, **Base Sepolia** veya **Solana Devnet**'te olsa bile **Arc Testnet**'te tek tıkla ödeme yapın.

Stack: **Next.js + Wagmi + Circle App Kit Unified Balance**

Cüzdanlar: **Rabby** (EVM) + **Phantom** (Solana)

## Ne yapar?

1. **Rabby** ile EVM cüzdanını bağlayın (Ethereum Sepolia / Base Sepolia / Arc Testnet)
2. **Phantom** ile Solana Devnet cüzdanını bağlayın
3. Her iki cüzdandan **Unified Balance**'a USDC yatırın
4. App Kit, Rabby ve Phantom kaynaklarından otomatik USDC çeker
5. **Arc Testnet**'te tek tıkla checkout tamamlayın

## Gereksinimler

- Node.js 22+
- [Rabby](https://rabby.io/) tarayıcı eklentisi
- [Phantom](https://phantom.app/) tarayıcı eklentisi (Devnet modu)
- Testnet USDC: [Circle Faucet](https://faucet.circle.com)
- Base/Ethereum Sepolia için testnet ETH (gas)
- Solana Devnet için SOL

## Kurulum

```bash
cd ~/Projects/arc-unified-checkout
npm install
npm run dev
```

Tarayıcıda `http://localhost:3000` açın.

## Kullanım akışı

| Adım | Aksiyon |
|------|---------|
| 1 | Rabby ve Phantom cüzdanlarını bağla |
| 2 | Unified Balance bakiyesini yenile |
| 3 | Rabby (ETH/Base) veya Phantom (Solana) ile yatır |
| 4 | Ürün seç, alıcı Arc adresi gir, öde |

## Arc Testnet

| Alan | Değer |
|------|-------|
| Chain ID | `5042002` |
| RPC | `https://rpc.testnet.arc.network` |
| Gas token | USDC (18 decimals) |
| Explorer | https://testnet.arcscan.app |

## Komutlar

```bash
npm run dev        # Geliştirme sunucusu
npm run build      # Production build
npm run start      # Production sunucu
npm run typecheck  # TypeScript kontrolü
```

## Dokümantasyon

- [Unified Balance](https://docs.arc.io/app-kit/unified-balance)
- [Deposit & Spend Quickstart](https://docs.arc.io/app-kit/quickstarts/unified-balance-deposit-and-spend)
- [Arc Builder AI Guide](./ARC_BUILDER_AI_GUIDE.md)

## Notlar

- Bu uygulama **yalnızca testnet** içindir. Gerçek fon kullanmayın.
- Arc'ta gas **USDC** ile ödenir (ETH değil).
- Unified Balance, Rabby ↔ Phantom arası cross-chain USDC transferini App Kit üzerinden yönetir.
