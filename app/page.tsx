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
  const { address, isConnected } = useAccount()
  const [editingPost, setEditingPost] = useState<PostType | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const handlePostCreated = () => {
    setRefreshKey((prev) => prev + 1)
    // Scroll to bottom to see new post
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
        headers: {
          'Content-Type': 'application/json',
          // Authorization: `Bearer ${await sdk.quickAuth.getToken()}`,
        },
        body: JSON.stringify({ text }),
      })
      setEditingPost(null)
      setRefreshKey((prev) => prev + 1)
    } catch (error) {
      console.error('Edit error:', error)
    }
  }

  return (
    <main className="min-h-screen bg-pixel-bg p-4 max-w-2xl mx-auto">
      <header className="mb-6 text-center">
        <h1 className="text-2xl font-pixel text-pixel-yellow mb-2">The Wall Base</h1>
        <p className="text-xs text-gray-400">NFT Social Feed on Base</p>
      </header>

      {isConnected && address && (
        <>
          {editingPost ? (
            <div className="pixel-card mb-4">
              <h2 className="mb-2 text-sm">Edit Post</h2>
              <textarea
                defaultValue={editingPost.text}
                maxLength={280}
                className="pixel-input w-full min-h-[60px] max-h-[120px] mb-2 text-xs resize-none"
                id="edit-textarea"
                style={{ fontSize: '10px', lineHeight: '1.4' }}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const textarea = document.getElementById('edit-textarea') as HTMLTextAreaElement
                    handleEditSubmit(textarea.value)
                  }}
                  className="pixel-button"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingPost(null)}
                  className="pixel-button bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <Composer onPostCreated={handlePostCreated} />
          )}
        </>
      )}

      {!isConnected && (
        <div className="pixel-card mb-4 text-center">
          <p className="text-sm text-gray-400 mb-3">
            Connect your Base Account to start posting
          </p>
          <ConnectWalletButton />
        </div>
      )}

      <PostList key={refreshKey} onEdit={handleEdit} />
      <ScrollButtons />
    </main>
  )
}

