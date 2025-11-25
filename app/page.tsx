'use client'

import { useState, useEffect } from 'react'
import { useAccount, useConnect } from 'wagmi'
import { Composer } from '@/components/Composer'
import { PostList } from '@/components/PostList'
import { ScrollButtons } from '@/components/ScrollButtons'
import { Post as PostType } from '@/lib/supabase'

function ConnectWalletButton() {
  const { connect, connectors, isPending } = useConnect()

  return (
    <button
      onClick={() => connect({ connector: connectors[0] })}
      disabled={isPending}
      className="pixel-button"
    >
      {isPending ? 'Connecting...' : 'Connect Wallet'}
    </button>
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

      {isConnected && address && !editingPost && (
        <Composer onPostCreated={handlePostCreated} />
      )}

      {!isConnected && (
        <div className="pixel-card mb-4 text-center bg-white">
          <p className="text-sm text-gray-400 mb-3">
            Wallet connected automatically in Base App
          </p>
          <ConnectWalletButton />
        </div>
      )}

      <PostList key={refreshKey} onEdit={handleEdit} />
      <ScrollButtons />
    </main>
  )
}

