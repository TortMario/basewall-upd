'use client'

import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { wagmiConfig } from '@/lib/wagmi'
import { useState, useEffect } from 'react'
import { useConnect, useAccount } from 'wagmi'

// Auto-connect component (only runs on client)
function AutoConnect() {
  const { connect, connectors } = useConnect()
  const { isConnected } = useAccount()

  useEffect(() => {
    // Only auto-connect if not already connected and we're in a browser
    if (typeof window === 'undefined' || isConnected) return

    // Try to find an injected wallet (MetaMask, Coinbase Wallet, etc.)
    const injectedConnector = connectors.find(
      (connector) => connector.type === 'injected'
    )

    if (injectedConnector) {
      // Check if wallet is available
      const ethereum = (window as any).ethereum
      if (ethereum) {
        // Small delay to ensure everything is ready
        const timer = setTimeout(() => {
          try {
            connect({ connector: injectedConnector })
          } catch (error) {
            console.log('Auto-connect skipped:', error)
          }
        }, 100)

        return () => clearTimeout(timer)
      }
    }
  }, [connect, connectors, isConnected])

  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <AutoConnect />
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}

