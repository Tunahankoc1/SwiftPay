'use client'
import { useEffect } from 'react'
import type { Metadata } from 'next'
import { Providers } from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'SwiftPay',
  description:
    'USDC Ethereum, Base veya Solana üzerinde olsa bile Arc Testnet\'te tek tıkla ödeme — Circle App Kit Unified Balance',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual'
    }
    window.scrollTo(0, 0)
  }, [])
  return (
    <html lang="tr">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
