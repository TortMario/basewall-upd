'use client'

import { createConfig, http } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

// Determine which network to use based on environment
const isMainnet = !process.env.NEXT_PUBLIC_BASE_RPC_URL?.includes('sepolia')
const defaultChain = isMainnet ? base : baseSepolia

// For Base App, the wallet is automatically injected
// In production, use the Farcaster Mini App connector when available
// For now, we use injected connector which works with Base App's injected wallet
export const wagmiConfig = createConfig({
  chains: [base, baseSepolia],
  connectors: [
    injected({
      target: 'metaMask', // Base App injects a wallet compatible with MetaMask
    }),
  ],
  transports: {
    [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'),
    [baseSepolia.id]: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://sepolia.base.org'),
  },
  ssr: true,
})

export const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`

