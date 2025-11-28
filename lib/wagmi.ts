import { cookieStorage, createConfig, createStorage, http } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { baseAccount } from 'wagmi/connectors'

export function getConfig() {
  return createConfig({
    chains: [base, baseSepolia],
    multiInjectedProviderDiscovery: false,
    connectors: [
      baseAccount({
        appName: 'The Wall Base',
      }),
    ],
    storage: createStorage({
      storage: cookieStorage,
    }),
    ssr: true,
    transports: {
      [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'),
      [baseSepolia.id]: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://sepolia.base.org'),
    },
  })
}

declare module 'wagmi' {
  interface Register {
    config: ReturnType<typeof getConfig>
  }
}

