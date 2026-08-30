import { BALANCE_CONFIRMATION, parseUsdcAmount } from '@/config/balance'
import type { UnifiedBalanceView } from '@/context/WalletContext'
import { kit } from '@/lib/appKit'

type BalanceSources = NonNullable<
  Parameters<typeof kit.unifiedBalance.getBalances>[0]['sources']
>

export async function fetchUnifiedBalance(
  sources: BalanceSources,
): Promise<UnifiedBalanceView> {
  const balances = await kit.unifiedBalance.getBalances({
    sources,
    networkType: 'testnet',
    includePending: true,
  })

  return {
    totalConfirmedBalance: balances.totalConfirmedBalance ?? '0.00',
    totalPendingBalance: balances.totalPendingBalance ?? '0.00',
    token: balances.token ?? 'USDC',
  }
}

export function hasPendingBalance(balance: UnifiedBalanceView): boolean {
  return parseUsdcAmount(balance.totalPendingBalance) > 0
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

/**
 * Bekleyen bakiye sıfırlanana veya minConfirmed karşılanana kadar
 * minimum aralıkla poll eder.
 */
export async function pollUntilConfirmed(
  sources: BalanceSources,
  options: {
    minConfirmed?: number
    onUpdate?: (balance: UnifiedBalanceView) => void
    onTick?: (attempt: number, balance: UnifiedBalanceView) => void
  } = {},
): Promise<UnifiedBalanceView> {
  const { pollIntervalMs, maxWaitMs } = BALANCE_CONFIRMATION
  const minConfirmed = options.minConfirmed ?? 0
  const deadline = Date.now() + maxWaitMs
  let attempt = 0
  let latest = await fetchUnifiedBalance(sources)

  options.onUpdate?.(latest)
  options.onTick?.(attempt, latest)

  while (Date.now() < deadline) {
    const confirmed = parseUsdcAmount(latest.totalConfirmedBalance)
    const pending = parseUsdcAmount(latest.totalPendingBalance)

    if (confirmed >= minConfirmed && pending === 0) {
      return latest
    }

    if (minConfirmed > 0 && confirmed >= minConfirmed) {
      return latest
    }

    if (minConfirmed === 0 && pending === 0) {
      return latest
    }

    await sleep(pollIntervalMs)
    attempt += 1
    latest = await fetchUnifiedBalance(sources)
    options.onUpdate?.(latest)
    options.onTick?.(attempt, latest)
  }

  throw new Error(
    'Onaylanmış bakiye zaman aşımına uğradı. Birkaç dakika bekleyip tekrar deneyin.',
  )
}
