import { cookieStorage, createConfig, createStorage, http } from 'wagmi'
import { baseSepolia, sepolia } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'
import { arcTestnet } from './chains'

export const wagmiConfig = createConfig({
  chains: [arcTestnet, baseSepolia, sepolia],
  connectors: [
    injected({
      target: 'rabby',
    }),
  ],
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  transports: {
    [arcTestnet.id]: http('https://rpc.testnet.arc.network'),
    [baseSepolia.id]: http(),
    [sepolia.id]: http(),
  },
})
