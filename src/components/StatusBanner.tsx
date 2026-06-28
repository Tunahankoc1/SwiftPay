'use client'

import { useWallet } from '@/context/WalletContext'

export function StatusBanner() {
  const { status, statusMessage, lastResult } = useWallet()

  if (status === 'idle' && !lastResult?.explorerUrl) {
    return null
  }

  return (
    <div className={`status-banner status-${status}`} role="status">
      {statusMessage && <p className="status-message">{statusMessage}</p>}
      {lastResult?.explorerUrl && (
        <a
          className="explorer-link"
          href={lastResult.explorerUrl}
          target="_blank"
          rel="noreferrer"
        >
          İşlemi explorer&apos;da görüntüle
        </a>
      )}
    </div>
  )
}
