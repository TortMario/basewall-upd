'use client'

import { useState, useEffect } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'
import { Composer } from '@/components/Composer'
import { PostList } from '@/components/PostList'
import { ScrollButtons } from '@/components/ScrollButtons'
import { Post as PostType } from '@/lib/kv'
import { WalletButton } from '@/components/WalletButton'

export default function Home() {
  const [editingPost, setEditingPost] = useState<PostType | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [isInMiniApp, setIsInMiniApp] = useState<boolean | null>(null)

  useEffect(() => {
    const checkMiniApp = async () => {
      try {
        const status = await sdk.isInMiniApp()
        setIsInMiniApp(status)
        // Call ready() only if we're in a mini app to hide splash screen
        if (status) {
          await sdk.actions.ready()
        }
      } catch (error) {
        console.error('Error checking mini app status:', error)
        setIsInMiniApp(false)
      }
    }
    checkMiniApp()
  }, [])

  const handlePostCreated = () => {
    setRefreshKey((prev) => prev + 1)
    setTimeout(() => {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })
    }, 100)
  }

  const handleEdit = (post: PostType) => {
    setEditingPost(post)
  }

  // Show message if not in mini app
  if (isInMiniApp === false) {
    return (
      <main className="min-h-screen bg-gray-100 p-4 max-w-2xl mx-auto flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">The Wall Base</h1>
          <p className="text-gray-600 mb-4">
            Please open this app in a Farcaster or Base client to use it.
          </p>
          <p className="text-sm text-gray-500">
            This mini app is designed to run within the Base app or other Farcaster clients.
          </p>
        </div>
      </main>
    )
  }

  // Show loading state while checking
  if (isInMiniApp === null) {
    return (
      <main className="min-h-screen bg-gray-100 p-4 max-w-2xl mx-auto flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4 max-w-2xl mx-auto">
      <header className="mb-6 text-center">
        <a 
          href="https://base.app/profile/base" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-block hover:opacity-80 transition-opacity"
        >
          <h1 className="text-4xl font-pixel text-blue-800 mb-2 cursor-pointer">The Wall Base</h1>
        </a>
        <p className="text-xs text-gray-400">Social Feed on Base</p>
        <div className="mt-2">
          <WalletButton />
        </div>
      </header>

        <Composer onPostCreated={handlePostCreated} />

      <PostList key={refreshKey} onEdit={handleEdit} />
      <ScrollButtons />
    </main>
  )
}

