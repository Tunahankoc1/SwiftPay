'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { resolveChainIdentifier } from '@circle-fin/adapter-viem-v2'
import type { SpendParams } from '@circle-fin/app-kit'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import type { DepositChain } from '@/config/checkout'

type SpendParamsWithFrom = Extract<SpendParams, { from: unknown }>
import { parseUsdcAmount } from '@/config/balance'
import { kit } from '@/lib/appKit'
import {
  fetchUnifiedBalance,
  pollUntilConfirmed,
} from '@/lib/balancePolling'
import {
  createEvmAdapterFromConnector,
  createEvmAdapterFromProvider,
  getRabbyProvider,
} from '@/lib/evmWallet'
import { connectPhantomWallet, type SolanaWalletConnection } from '@/lib/solanaWallet'

type AnyAdapter =
  | Awaited<ReturnType<typeof createEvmAdapterFromConnector>>
  | SolanaWalletConnection['adapter']

export type AppStatus = 'idle' | 'loading' | 'success' | 'error'

export type UnifiedBalanceView = {
  totalConfirmedBalance: string
  totalPendingBalance: string
  token: string
}

export type TransactionResult = {
  txHash?: string
  explorerUrl?: string
  amount?: string
  chain?: string
}

type WalletContextValue = {
  evmAdapter: Awaited<ReturnType<typeof createEvmAdapterFromConnector>> | null
  evmAddress: string | null
  solanaAdapter: SolanaWalletConnection['adapter'] | null
  solanaAddress: string | null
  balance: UnifiedBalanceView | null
  isConfirming: boolean
  confirmingMessage: string
  status: AppStatus
  statusMessage: string
  lastResult: TransactionResult | null
  connectRabby: () => Promise<void>
  connectPhantom: () => Promise<void>
  disconnectRabby: () => void
  disconnectPhantom: () => void
  refreshBalance: (options?: { silent?: boolean }) => Promise<UnifiedBalanceView | null>
  deposit: (chain: DepositChain, amount: string) => Promise<void>
  payOnArc: (amount: string, recipientAddress: string) => Promise<void>
  transferArcToSolana: (amount: string, solanaRecipient: string) => Promise<void>
  debugInfo?: any | null
  setDebugInfo?: (obj: any) => void
}

const WalletContext = createContext<WalletContextValue | null>(null)

function getSpendSources(
  evmAdapter: WalletContextValue['evmAdapter'],
  solanaAdapter: WalletContextValue['solanaAdapter'],
): Array<{ adapter: AnyAdapter }> {
  const sources: Array<{ adapter: AnyAdapter }> = []
  if (evmAdapter) sources.push({ adapter: evmAdapter })
  if (solanaAdapter) sources.push({ adapter: solanaAdapter })
  return sources
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const { address, connector, isConnected } = useAccount()
  const { connectAsync, connectors } = useConnect()
  const { disconnectAsync } = useDisconnect()

  const [evmAdapter, setEvmAdapter] = useState<
    Awaited<ReturnType<typeof createEvmAdapterFromConnector>> | null
  >(null)
  const [solanaAdapter, setSolanaAdapter] = useState<
    SolanaWalletConnection['adapter'] | null
  >(null)
  const [solanaAddress, setSolanaAddress] = useState<string | null>(null)
  const [balance, setBalance] = useState<UnifiedBalanceView | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)
  const [confirmingMessage, setConfirmingMessage] = useState('')
  const [status, setStatus] = useState<AppStatus>('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const [lastResult, setLastResult] = useState<TransactionResult | null>(null)
  const [debugInfo, setDebugInfo] = useState<any | null>(null)

  const setLoading = (message: string) => {
    setStatus('loading')
    setStatusMessage(message)
  }

  const setSuccess = (message: string, result?: TransactionResult) => {
    setStatus('success')
    setStatusMessage(message)
    if (result) setLastResult(result)
  }

  const setError = (message: string) => {
    setStatus('error')
    setStatusMessage(message)
  }

  const setDebug = (obj: any) => setDebugInfo(obj)

  const connectRabby = useCallback(async () => {
    try {
      setLoading('Rabby cüzdanı bağlanıyor...')

      const rabbyConnector =
        connectors.find((item) => item.id === 'injected') ?? connectors[0]

      if (rabbyConnector) {
        const connection = await connectAsync({ connector: rabbyConnector })
        const adapter = await createEvmAdapterFromConnector(rabbyConnector)
        setEvmAdapter(adapter)
        setSuccess('Rabby bağlandı')
        return
      }

      const provider = await getRabbyProvider()
      await provider.request({
        method: 'eth_requestAccounts',
        params: undefined,
      })
      const adapter = await createEvmAdapterFromProvider(provider)
      setEvmAdapter(adapter)
      setSuccess('Rabby bağlandı')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Rabby bağlantısı başarısız')
    }
  }, [connectAsync, connectors])

  const connectPhantom = useCallback(async () => {
    try {
      setLoading('Phantom cüzdanı bağlanıyor...')
      const connection = await connectPhantomWallet()
      setSolanaAdapter(connection.adapter)
      setSolanaAddress(connection.connectedAddress)
      setSuccess('Phantom bağlandı')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Phantom bağlantısı başarısız')
    }
  }, [])

  const disconnectRabby = useCallback(() => {
    void disconnectAsync()
    setEvmAdapter(null)
    setBalance(null)
    setStatus('idle')
    setStatusMessage('')
  }, [disconnectAsync])

  const disconnectPhantom = useCallback(() => {
    setSolanaAdapter(null)
    setSolanaAddress(null)
    setBalance(null)
    setStatus('idle')
    setStatusMessage('')
  }, [])

  const refreshBalance = useCallback(
    async (options?: { silent?: boolean }) => {
      let activeEvmAdapter = evmAdapter

      if (!activeEvmAdapter && isConnected && connector) {
        activeEvmAdapter = await createEvmAdapterFromConnector(connector)
        setEvmAdapter(activeEvmAdapter)
      }

      const sources = getSpendSources(activeEvmAdapter, solanaAdapter)
      if (sources.length === 0) {
        if (!options?.silent) {
          setError('Önce Rabby veya Phantom cüzdanını bağlayın')
        }
        return null
      }

      try {
        if (!options?.silent) {
          setLoading('Unified Balance sorgulanıyor...')
        }

        const nextBalance = await fetchUnifiedBalance(sources)
        setBalance(nextBalance)

        if (!options?.silent) {
          setSuccess('Bakiye güncellendi')
        }

        return nextBalance
      } catch (error) {
        if (!options?.silent) {
          setError(error instanceof Error ? error.message : 'Bakiye alınamadı')
        }
        return null
      }
    },
    [connector, evmAdapter, isConnected, solanaAdapter],
  )

  const waitForConfirmation = useCallback(
    async (sources: Array<{ adapter: AnyAdapter }>, minConfirmed = 0) => {
      setIsConfirming(true)
      setConfirmingMessage('Onaylanmış bakiye bekleniyor...')

      try {
        const confirmedBalance = await pollUntilConfirmed(sources, {
          minConfirmed,
          onUpdate: (nextBalance) => {
            setBalance(nextBalance)
            const pending = parseUsdcAmount(nextBalance.totalPendingBalance)
            const confirmed = parseUsdcAmount(nextBalance.totalConfirmedBalance)
            setConfirmingMessage(
              pending > 0
                ? `Onay bekleniyor… ${confirmed.toFixed(2)} onaylı, ${pending.toFixed(2)} bekliyor`
                : `Onaylandı — ${confirmed.toFixed(2)} USDC kullanılabilir`,
            )
          },
          onTick: (attempt) => {
            setConfirmingMessage(
              `Onay kontrol ediliyor (${attempt}) — 1 sn aralıkla`,
            )
          },
        })

        return confirmedBalance
      } finally {
        setIsConfirming(false)
        setConfirmingMessage('')
      }
    },
    [],
  )

  const deposit = useCallback(
    async (chain: DepositChain, amount: string) => {
      if (chain === 'Solana_Devnet') {
        if (!solanaAdapter) {
          setError('Solana yatırımı için Phantom gerekli')
          return
        }

        try {
          setLoading(`Solana Devnet'ten ${amount} USDC yatırılıyor...`)
          const result = await kit.unifiedBalance.deposit({
            from: { adapter: solanaAdapter, chain },
            amount,
            token: 'USDC',
          })

          setSuccess('Phantom → Unified Balance yatırımı tamamlandı', {
            txHash: result.txHash,
            explorerUrl: result.explorerUrl,
            amount: result.amount,
            chain: result.chain,
          })

          const sources = getSpendSources(evmAdapter, solanaAdapter)
          if (sources.length > 0) {
            await waitForConfirmation(sources)
            setSuccess('Phantom yatırımı onaylandı — checkout için hazır')
          }
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Solana yatırımı başarısız')
        }
        return
      }

      let activeEvmAdapter = evmAdapter
      if (!activeEvmAdapter) {
        if (!connector) {
          setError('EVM yatırımı için Rabby gerekli')
          return
        }
        activeEvmAdapter = await createEvmAdapterFromConnector(connector)
        setEvmAdapter(activeEvmAdapter)
      }

      try {
        setLoading(`${chain.replace('_', ' ')} üzerinden ${amount} USDC yatırılıyor...`)
        const resolved = resolveChainIdentifier(chain)

        if (resolved.type !== 'evm') {
          throw new Error(`${resolved.name} EVM zinciri değil`)
        }

        await activeEvmAdapter.ensureChain(resolved)

        const result = await kit.unifiedBalance.deposit({
          from: { adapter: activeEvmAdapter, chain },
          amount,
          token: 'USDC',
        })

        setSuccess('Rabby → Unified Balance yatırımı tamamlandı', {
          txHash: result.txHash,
          explorerUrl: result.explorerUrl,
          amount: result.amount,
          chain: result.chain,
        })

        const sources = getSpendSources(activeEvmAdapter, solanaAdapter)
        if (sources.length > 0) {
          await waitForConfirmation(sources)
          setSuccess('Rabby yatırımı onaylandı — checkout için hazır')
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'EVM yatırımı başarısız')
      }
    },
    [connector, evmAdapter, solanaAdapter, waitForConfirmation],
  )

  const payOnArc = useCallback(
    async (amount: string, recipientAddress: string) => {
      let activeEvmAdapter = evmAdapter

      if (!activeEvmAdapter) {
        if (!connector) {
          setError('Arc ödemesi için Rabby gerekli')
          return
        }
        activeEvmAdapter = await createEvmAdapterFromConnector(connector)
        setEvmAdapter(activeEvmAdapter)
      }

      const sources = getSpendSources(activeEvmAdapter, solanaAdapter)
      if (sources.length === 0) {
        setError('Ödeme için en az bir cüzdan bağlayın')
        return
      }

      if (!/^0x[a-fA-F0-9]{40}$/.test(recipientAddress)) {
        setError('Geçerli bir Arc alıcı adresi girin (0x...)')
        return
      }

      try {
        setLoading(`Arc Testnet'te ${amount} USDC ödeniyor...`)

        const required = parseUsdcAmount(amount)
        const currentConfirmed = parseUsdcAmount(balance?.totalConfirmedBalance)
        const prep = { required, currentConfirmed, balance, sources }
        console.debug('[payOnArc] preparing spend', prep)
        setDebug(prep)
        if (currentConfirmed < required) {
          setLoading('Onaylanmış bakiye bekleniyor (hızlı kontrol)...')
          await waitForConfirmation(sources, required)
        }

        const arcResolved = resolveChainIdentifier('Arc_Testnet')
        if (arcResolved.type !== 'evm') {
          throw new Error('Arc Testnet geçerli bir EVM zinciri değil')
        }
        await activeEvmAdapter.ensureChain(arcResolved)

        // Recompute confirmed balance after any wait
        const refreshed = await fetchUnifiedBalance(sources)
        const refreshedConfirmed = parseUsdcAmount(refreshed?.totalConfirmedBalance)
        const refreshedPrep = { refreshed, refreshedConfirmed }
        console.debug('[payOnArc] refreshed balance before spend', refreshedPrep)
        setDebug((d: any) => ({ ...d, refreshed: refreshedPrep }))
        setStatusMessage(`Preparing to spend — onaylı bakiye: ${refreshedConfirmed.toFixed(2)} USDC`)
        if (refreshedConfirmed < required) {
          setError(
            `Yetersiz onaylı bakiye: gerekli ${required.toFixed(2)} USDC, onaylı ${refreshedConfirmed.toFixed(2)} USDC. Lütfen önce yatırma işlemi yapın.`,
          )
          return
        }

        const baseSpendParams: SpendParamsWithFrom = {
          amount,
          token: 'USDC',
          from: sources as SpendParamsWithFrom['from'],
          to: {
            adapter: activeEvmAdapter,
            chain: 'Arc_Testnet' as const,
            recipientAddress,
          },
        }

        const tryEstimate = async (useForwarder: boolean) => {
          const params: SpendParams = {
            ...baseSpendParams,
            to: {
              ...baseSpendParams.to,
              useForwarder,
            },
          }
          return kit.unifiedBalance.estimateSpend(params)
        }

        setStatusMessage('Ödeme maliyeti hesaplanıyor...')
        let spendParams: SpendParamsWithFrom = {
          ...baseSpendParams,
          to: {
            ...baseSpendParams.to,
            useForwarder: true,
          },
        }

        try {
          const estimate = await tryEstimate(true)
          console.debug('[payOnArc] spend estimate (forwarder)', estimate)
          setDebug((d: any) => ({ ...d, estimate }))
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error)
          if (msg.toLowerCase().includes('insufficient')) {
            setStatusMessage('Forwarder maliyeti fazla olabilir; doğrudan Arc işlemi deneniyor...')
            spendParams = {
              ...baseSpendParams,
              to: {
                ...baseSpendParams.to,
                useForwarder: false,
              },
            }
            const fallbackEstimate = await tryEstimate(false)
            console.debug('[payOnArc] spend estimate (direct)', fallbackEstimate)
            setDebug((d: any) => ({ ...d, estimate: fallbackEstimate, forwarderFallback: true }))
          } else {
            throw error
          }
        }

        const result = await kit.unifiedBalance.spend(spendParams)

        setSuccess('Arc Testnet ödemesi tamamlandı', {
          txHash: result.txHash,
          explorerUrl: result.explorerUrl,
          amount,
          chain: 'Arc_Testnet',
        })
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Ödeme başarısız'
        if (msg.toLowerCase().includes('insufficient')) {
          const confirmed = parseUsdcAmount(balance?.totalConfirmedBalance)
          const pending = parseUsdcAmount(balance?.totalPendingBalance)
          setError(
            `${msg} (onaylı: ${confirmed.toFixed(2)} USDC, bekleyen: ${pending.toFixed(2)} USDC)`,
          )
        } else {
          setError(msg)
        }
      }
    },
    [balance?.totalConfirmedBalance, connector, evmAdapter, solanaAdapter, waitForConfirmation],
  )

  const transferArcToSolana = useCallback(
    async (amount: string, solanaRecipient: string) => {
      // Basic Solana address validation (base58, typical length 32-44)
      const isBase58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(solanaRecipient)
      if (!isBase58) {
        setError('Geçersiz Solana adresi. Lütfen geçerli bir Devnet adresi girin.')
        return
      }
      let activeEvmAdapter = evmAdapter

      if (!activeEvmAdapter) {
        if (!connector) {
          setError('Arc transferi için Rabby gerekli')
          return
        }
        activeEvmAdapter = await createEvmAdapterFromConnector(connector)
        setEvmAdapter(activeEvmAdapter)
      }

      if (!solanaAdapter) {
        setError('Solana alıcısı için Phantom gerekli')
        return
      }

      try {
        setLoading(`Arc Testnet'ten Solana Devnet'e ${amount} USDC transfer ediliyor...`)

        // Ensure we're on Arc Testnet for the EVM adapter
        const resolved = resolveChainIdentifier('Arc_Testnet')
        if (resolved.type !== 'evm') {
          throw new Error('Arc Testnet geçerli bir EVM zinciri değil')
        }

        await activeEvmAdapter.ensureChain(resolved)

        const required = parseUsdcAmount(amount)
        const sources = getSpendSources(activeEvmAdapter, solanaAdapter)

        const prep = { required, sourcesPresent: !!sources.length, balance }
        console.debug('[transferArcToSolana] preparing transfer', prep)
        setDebug(prep)

        const refreshed = await fetchUnifiedBalance(sources)
        const refreshedConfirmed = parseUsdcAmount(refreshed?.totalConfirmedBalance)
        const refreshedPrep = { refreshed, refreshedConfirmed }
        console.debug('[transferArcToSolana] refreshed balance before spend', refreshedPrep)
        setDebug((d: any) => ({ ...d, refreshed: refreshedPrep }))
        setStatusMessage(`Preparing Arc→Solana — onaylı bakiye: ${refreshedConfirmed.toFixed(2)} USDC`)

        if (refreshedConfirmed < required) {
          setError(
            `Yetersiz onaylı bakiye: gerekli ${required.toFixed(2)} USDC, onaylı ${refreshedConfirmed.toFixed(2)} USDC. Lütfen önce Unified Balance'a yatırın.`,
          )
          return
        }

        const spendParams: SpendParamsWithFrom = {
          amount,
          token: 'USDC',
          from: [{ adapter: activeEvmAdapter }] as SpendParamsWithFrom['from'],
          to: {
            adapter: solanaAdapter,
            chain: 'Solana_Devnet' as const,
            recipientAddress: solanaRecipient,
          },
        }

        setStatusMessage('Transfer maliyeti hesaplanıyor...')
        const estimate = await kit.unifiedBalance.estimateSpend(spendParams)
        console.debug('[transferArcToSolana] spend estimate', estimate)
        setDebug((d: any) => ({ ...d, estimate }))

        const result = await kit.unifiedBalance.spend(spendParams)

        setSuccess('Arc → Solana transferi başlatıldı', {
          txHash: result.txHash,
          explorerUrl: result.explorerUrl,
          chain: 'Arc_Testnet → Solana_Devnet',
        })
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Transfer başarısız'
        if (msg.toLowerCase().includes('insufficient')) {
          const confirmed = parseUsdcAmount(balance?.totalConfirmedBalance)
          const pending = parseUsdcAmount(balance?.totalPendingBalance)
          setError(
            `${msg} (onaylı: ${confirmed.toFixed(2)} USDC, bekleyen: ${pending.toFixed(2)} USDC)`,
          )
        } else {
          setError(msg)
        }
      }
    },
    [connector, evmAdapter, solanaAdapter],
  )

  const value = useMemo<WalletContextValue>(
    () => ({
      evmAdapter,
      evmAddress: address ?? null,
      solanaAdapter,
      solanaAddress,
      balance,
      isConfirming,
      confirmingMessage,
      status,
      statusMessage,
      lastResult,
      connectRabby,
      connectPhantom,
      disconnectRabby,
      disconnectPhantom,
      refreshBalance,
      deposit,
      payOnArc,
      transferArcToSolana,
      debugInfo: debugInfo,
      setDebugInfo: setDebug,
    }),
    [
      address,
      balance,
      confirmingMessage,
      connectPhantom,
      connectRabby,
      deposit,
      disconnectPhantom,
      disconnectRabby,
      evmAdapter,
      isConfirming,
      lastResult,
      payOnArc,
      refreshBalance,
      solanaAdapter,
      solanaAddress,
      status,
      statusMessage,
    ],
  )

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider')
  }
  return context
}
