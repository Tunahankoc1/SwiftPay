/** Unified Balance onay polling — mümkün olan en kısa aralık (ms). */
export const BALANCE_CONFIRMATION = {
  /** Circle Gateway yanıtını kontrol aralığı */
  pollIntervalMs: 1_000,
  /** Maksimum bekleme süresi */
  maxWaitMs: 120_000,
} as const

export function parseUsdcAmount(value: string | undefined): number {
  const parsed = Number.parseFloat(value ?? '0')
  return Number.isFinite(parsed) ? parsed : 0
}
