import { ArcTestnet, BaseSepolia, EthereumSepolia } from '@circle-fin/app-kit/chains'
import { createViemAdapterFromProvider } from '@circle-fin/adapter-viem-v2'
import type { Connector } from 'wagmi'
import type { EIP1193Provider } from 'viem'

const RABBY_RDNS = 'io.rabby'

type EIP6963ProviderInfo = {
  uuid: string
  name: string
  icon: string
  rdns: string
}

export type EIP6963ProviderDetail = {
  info: EIP6963ProviderInfo
  provider: EIP1193Provider
}

declare global {
  interface WindowEventMap {
    'eip6963:announceProvider': CustomEvent<EIP6963ProviderDetail>
  }
}

export async function discoverBrowserWallets(): Promise<EIP6963ProviderDetail[]> {
  const providers = new Map<string, EIP6963ProviderDetail>()

  const handleProviderAnnouncement = (
    event: WindowEventMap['eip6963:announceProvider'],
  ) => {
    providers.set(event.detail.info.uuid, event.detail)
  }

  window.addEventListener('eip6963:announceProvider', handleProviderAnnouncement)
  window.dispatchEvent(new Event('eip6963:requestProvider'))

  await new Promise((resolve) => window.setTimeout(resolve, 250))
  window.removeEventListener(
    'eip6963:announceProvider',
    handleProviderAnnouncement,
  )

  return [...providers.values()]
}

export async function getRabbyProvider(): Promise<EIP1193Provider> {
  if (typeof window === 'undefined') {
    throw new Error('Rabby cüzdanı yalnızca tarayıcıda kullanılabilir')
  }

  const globalEthereum = (window as any).ethereum as any
  if (globalEthereum?.isRabby) {
    return globalEthereum as EIP1193Provider
  }

  if (globalEthereum && Array.isArray(globalEthereum.providers)) {
    const providers = globalEthereum.providers as Array<any>
    const rabbyProvider = providers.find((provider) => provider?.isRabby)
    if (rabbyProvider) {
      return rabbyProvider as EIP1193Provider
    }
  }

  const providers = await discoverBrowserWallets()
  const rabby =
    providers.find(({ info }) => info.rdns === RABBY_RDNS || info.name === 'Rabby Wallet') ??
    providers.find(({ info }) => info.name.toLowerCase().includes('rabby'))

  if (!rabby) {
    throw new Error(
      'Rabby cüzdanı bulunamadı. Rabby eklentisini yükleyin ve sayfayı yenileyin.',
    )
  }

  return rabby.provider
}

export async function createEvmAdapterFromProvider(provider: EIP1193Provider) {
  return createViemAdapterFromProvider({
    provider,
    capabilities: {
      supportedChains: [EthereumSepolia, BaseSepolia, ArcTestnet],
    },
  })
}

export async function createEvmAdapterFromConnector(connector: Connector) {
  const provider = (await connector.getProvider()) as EIP1193Provider | undefined

  if (!provider) {
    throw new Error('Rabby provider alınamadı')
  }

  return createEvmAdapterFromProvider(provider)
}

export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}
