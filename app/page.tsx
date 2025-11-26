'use client'

import { useState, useEffect } from 'react'
import { Composer } from '@/components/Composer'
import { PostList } from '@/components/PostList'
import { ScrollButtons } from '@/components/ScrollButtons'
import { Post as PostType } from '@/lib/kv'
import { sdk } from '@farcaster/miniapp-sdk'

export default function Home() {
  const [editingPost, setEditingPost] = useState<PostType | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [currentUserUsername, setCurrentUserUsername] = useState<string | undefined>(undefined)
  const [isClearing, setIsClearing] = useState(false)

  useEffect(() => {
    const getUserData = async () => {
      try {
        const isInMiniApp = await sdk.isInMiniApp()
        console.log('🔍 Home: SDK check:', { isInMiniApp })
        if (isInMiniApp) {
          const context = await sdk.context
          console.log('🔍 Home: SDK context:', context)
          if (context?.user?.username) {
            console.log('✅ Home: Setting username:', context.user.username)
            setCurrentUserUsername(context.user.username)
          } else {
            console.warn('⚠️ Home: Username not found')
          }
        }
      } catch (error) {
        console.error('❌ Home: Error getting user data:', error)
      }
    }
    getUserData()
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

  const handleClearAllPosts = async () => {
    if (!window.confirm('Are you sure you want to delete ALL posts? This action cannot be undone.')) {
      return
    }

    setIsClearing(true)
    try {
      const params = new URLSearchParams({
        username: currentUserUsername || ''
      })
      const response = await fetch(`/api/posts/clear?${params.toString()}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to clear posts')
      }

      const data = await response.json()
      alert(data.message || `Deleted ${data.deleted || 0} posts`)
      setRefreshKey((prev) => prev + 1)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to clear posts')
    } finally {
      setIsClearing(false)
    }
  }

  const ADMIN_USERNAME = process.env.NEXT_PUBLIC_ADMIN_USERNAME || 'mynameisthe'
  const normalizedUsername = currentUserUsername?.replace(/^@/, '').toLowerCase()
  const normalizedAdminUsername = ADMIN_USERNAME.replace(/^@/, '').toLowerCase()
  const isAdmin = normalizedUsername === normalizedAdminUsername

  return (
    <main className="min-h-screen bg-gray-100 p-4 max-w-2xl mx-auto">
      <header className="mb-6 text-center">
        <a 
          href="https://base.app/profile/mynameisthe" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-block hover:opacity-80 transition-opacity"
        >
          <h1 className="text-4xl font-pixel text-blue-800 mb-2 cursor-pointer">The Wall Base</h1>
        </a>
        <p className="text-xs text-gray-400">Social Feed on Base</p>
        {isAdmin && (
          <button
            onClick={handleClearAllPosts}
            disabled={isClearing}
            className="mt-2 px-4 py-2 bg-red-500 text-white rounded font-bold hover:bg-red-600 disabled:opacity-50 text-sm"
          >
            {isClearing ? 'Clearing...' : '🗑️ Clear All Posts'}
          </button>
        )}
      </header>

        <Composer onPostCreated={handlePostCreated} />

      <PostList key={refreshKey} onEdit={handleEdit} />
      <ScrollButtons />
    </main>
  )
}

