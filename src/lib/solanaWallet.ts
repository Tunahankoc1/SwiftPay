import { SolanaDevnet } from '@circle-fin/app-kit/chains'
import { createSolanaAdapterFromProvider } from '@circle-fin/adapter-solana'
import type { CreateSolanaAdapterFromProviderParams } from '@circle-fin/adapter-solana'

type SolanaWalletProvider = CreateSolanaAdapterFromProviderParams['provider']

declare global {
  interface Window {
    phantom?: {
      solana?: SolanaWalletProvider & { isPhantom?: boolean }
    }
    solana?: SolanaWalletProvider & { isPhantom?: boolean }
  }
}

export function getPhantomProvider(): SolanaWalletProvider {
  const provider = window.phantom?.solana ?? window.solana

  if (!provider?.isPhantom) {
    throw new Error(
      'Phantom cüzdanı bulunamadı. Phantom eklentisini yükleyin ve Devnet modunda açın.',
    )
  }

  return provider
}

async function connectSolanaProvider(provider: SolanaWalletProvider) {
  const connection = await provider.connect()

  return (
    connection.publicKey?.toString() ??
    provider.publicKey?.toString() ??
    null
  )
}

export async function connectPhantomWallet() {
  const provider = getPhantomProvider()
  const connectedAddress = await connectSolanaProvider(provider)

  if (!connectedAddress) {
    throw new Error('Phantom cüzdan adresi alınamadı')
  }

  const adapter = await createSolanaAdapterFromProvider({
    provider,
    capabilities: {
      supportedChains: [SolanaDevnet],
    },
  })

  return {
    adapter,
    connectedAddress,
  }
}

export type SolanaWalletConnection = Awaited<ReturnType<typeof connectPhantomWallet>>
