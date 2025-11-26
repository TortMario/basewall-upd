'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { sdk } from '@farcaster/miniapp-sdk'
import { useState, useEffect } from 'react'

export function WalletButton() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const [isInMiniApp, setIsInMiniApp] = useState(false)

  useEffect(() => {
    const checkMiniApp = async () => {
      try {
        const inMiniApp = await sdk.isInMiniApp()
        setIsInMiniApp(inMiniApp)
      } catch {
        setIsInMiniApp(false)
      }
    }
    checkMiniApp()
  }, [])

  // Don't show wallet button in Mini App (uses SDK)
  if (isInMiniApp) {
    return null
  }

  // Show wallet connection in browser
  if (isConnected && address) {
    return (
      <div className="flex items-center justify-center gap-2">
        <span className="text-xs text-gray-600">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <button
          onClick={() => disconnect()}
          className="px-3 py-1 bg-gray-200 text-black rounded text-sm font-bold hover:bg-gray-300 border-2 border-black"
        >
          Disconnect
        </button>
      </div>
    )
  }

  const injectedConnector = connectors.find((c) => c.id === 'injected' || c.type === 'injected')

  return (
    <button
      onClick={() => injectedConnector && connect({ connector: injectedConnector })}
      disabled={isPending || !injectedConnector}
      className="px-4 py-2 bg-yellow-400 text-black rounded font-bold hover:bg-yellow-500 disabled:opacity-50 border-2 border-black text-sm"
    >
      {isPending ? 'Connecting...' : 'Connect Wallet'}
    </button>
  )
}

