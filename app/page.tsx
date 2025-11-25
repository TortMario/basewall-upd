'use client'

import { useState, useEffect } from 'react'
import { useAccount, useConnect } from 'wagmi'
import { Composer } from '@/components/Composer'
import { PostList } from '@/components/PostList'
import { ScrollButtons } from '@/components/ScrollButtons'
import { Post as PostType } from '@/lib/supabase'

function ConnectWalletButton() {
  const { connect, connectors, isPending, error } = useConnect()
  const [showWalletList, setShowWalletList] = useState(false)

  // Filter out connectors that aren't available
  const availableConnectors = connectors.filter((connector) => {
    // Check if connector is available
    if (connector.type === 'injected') {
      return typeof window !== 'undefined' && (window as any).ethereum
    }
    return true
  })

  const getWalletName = (connector: any) => {
    if (connector.name) return connector.name
    if (connector.id === 'injected') {
      // Try to detect the wallet
      const ethereum = typeof window !== 'undefined' ? (window as any).ethereum : null
      if (ethereum?.isMetaMask) return 'MetaMask'
      if (ethereum?.isCoinbaseWallet) return 'Coinbase Wallet'
      if (ethereum?.isBraveWallet) return 'Brave Wallet'
      return 'Browser Wallet'
    }
    return 'Wallet'
  }

  const getWalletIcon = (connector: any) => {
    const name = getWalletName(connector).toLowerCase()
    if (name.includes('metamask')) return '🦊'
    if (name.includes('coinbase')) return '🔵'
    if (name.includes('brave')) return '🦁'
    if (name.includes('walletconnect')) return '🔗'
    return '💼'
  }

  const handleConnect = (connector: any) => {
    connect({ connector })
    setShowWalletList(false)
  }

  if (availableConnectors.length === 0) {
    return (
      <div className="pixel-card bg-yellow-50 border-yellow-200">
        <p className="text-sm text-yellow-800 mb-2">
          No wallet found. Please install a wallet extension:
        </p>
        <div className="flex flex-col gap-2 text-xs">
          <a
            href="https://metamask.io/download/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            📥 Install MetaMask
          </a>
          <a
            href="https://www.coinbase.com/wallet"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            📥 Install Coinbase Wallet
          </a>
        </div>
      </div>
    )
  }

  if (availableConnectors.length === 1) {
    return (
      <button
        onClick={() => handleConnect(availableConnectors[0])}
        disabled={isPending}
        className="pixel-button w-full"
      >
        {isPending ? 'Connecting...' : `Connect ${getWalletName(availableConnectors[0])}`}
      </button>
    )
  }

  return (
    <div className="space-y-2">
      <button
        onClick={() => setShowWalletList(!showWalletList)}
        disabled={isPending}
        className="pixel-button w-full"
      >
        {isPending ? 'Connecting...' : 'Connect Wallet'}
      </button>

      {showWalletList && (
        <div className="pixel-card bg-white space-y-2">
          <p className="text-xs text-gray-600 mb-2">Select a wallet:</p>
          {availableConnectors.map((connector) => (
            <button
              key={connector.uid}
              onClick={() => handleConnect(connector)}
              disabled={isPending}
              className="w-full pixel-button flex items-center justify-between text-left"
            >
              <span>
                {getWalletIcon(connector)} {getWalletName(connector)}
              </span>
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="pixel-card bg-red-50 border-red-200">
          <p className="text-xs text-red-800">
            Connection failed: {error.message}
          </p>
        </div>
      )}
    </div>
  )
}

export default function Home() {
  const { address, isConnected, connector } = useAccount()
  const [editingPost, setEditingPost] = useState<PostType | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // Log connection status for debugging
  useEffect(() => {
    console.log('Wallet connection status:', { isConnected, address, connector: connector?.name })
  }, [isConnected, address, connector])

  const handlePostCreated = () => {
    setRefreshKey((prev) => prev + 1)
    setTimeout(() => {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })
    }, 100)
  }

  const handleEdit = (post: PostType) => {
    setEditingPost(post)
  }

  const handleEditSubmit = async (text: string) => {
    if (!editingPost) return

    try {
      await fetch(`/api/posts/${editingPost.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      setEditingPost(null)
      setRefreshKey((prev) => prev + 1)
    } catch (error) {
      console.error('Edit error:', error)
    }
  }

  return (
    <main className="min-h-screen bg-white p-4 max-w-2xl mx-auto">
      <header className="mb-6 text-center">
        <a 
          href="https://base.app/profile/mynameisthe" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-block hover:opacity-80 transition-opacity"
        >
          <h1 className="text-4xl font-pixel text-blue-800 mb-2 cursor-pointer">The Wall Base</h1>
        </a>
        <p className="text-xs text-gray-400">NFT Social Feed on Base</p>
      </header>

      {isConnected && address && (
        <Composer onPostCreated={handlePostCreated} />
      )}

      {!isConnected && (
        <div className="pixel-card mb-4 bg-white">
          <div className="text-center mb-3">
            <p className="text-sm text-gray-400 mb-2">
              Connect your wallet to create posts
            </p>
            <p className="text-xs text-gray-500">
              Works with MetaMask, Coinbase Wallet, and more
            </p>
          </div>
          <ConnectWalletButton />
        </div>
      )}

      <PostList key={refreshKey} onEdit={handleEdit} />
      <ScrollButtons />
    </main>
  )
}

