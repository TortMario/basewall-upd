'use client'

import { createConfig, http } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { injected, metaMask, coinbaseWallet } from 'wagmi/connectors'

// Determine which network to use based on environment
const isMainnet = !process.env.NEXT_PUBLIC_BASE_RPC_URL?.includes('sepolia')
const defaultChain = isMainnet ? base : baseSepolia

// Get RPC URL
const rpcUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL || (isMainnet ? 'https://mainnet.base.org' : 'https://sepolia.base.org')

// Create connectors array with multiple wallet options
const connectors = [
  // Injected connector (works with Base App and browser extensions)
  injected({
    target: 'metaMask',
  }),
  // MetaMask connector
  metaMask({
    dappMetadata: {
      name: 'The Wall Base',
      url: typeof window !== 'undefined' ? window.location.origin : '',
    },
  }),
  // Coinbase Wallet connector
  coinbaseWallet({
    appName: 'The Wall Base',
    appLogoUrl: typeof window !== 'undefined' ? `${window.location.origin}/icon.png` : '',
  }),
]

// For Base App, the wallet is automatically injected
// In production, use the Farcaster Mini App connector when available
// Now supports multiple wallets: MetaMask, Coinbase Wallet, and injected wallets
export const wagmiConfig = createConfig({
  chains: [base, baseSepolia],
  connectors,
  transports: {
    [base.id]: http(rpcUrl),
    [baseSepolia.id]: http(rpcUrl),
  },
  ssr: true,
})

export const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`

