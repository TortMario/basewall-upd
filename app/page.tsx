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
    let timeoutId: NodeJS.Timeout | null = null
    let isResolved = false
    
    const checkMiniApp = async () => {
      try {
        // Primary check: isInMiniApp() - most reliable
        let status = false
        try {
          status = await Promise.race([
            sdk.isInMiniApp(),
            new Promise<boolean>((_, reject) => setTimeout(() => reject(new Error('timeout')), 2500))
          ])
          console.log('isInMiniApp result:', status)
        } catch (err) {
          console.log('isInMiniApp check failed or timed out:', err)
        }
        
        // Secondary check: context availability - if context resolves with user data, we're in mini app
        let hasValidContext = false
        let contextValue = null
        try {
          contextValue = await Promise.race([
            sdk.context,
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2500))
          ])
          // Context is valid if it has user property (not just empty object)
          hasValidContext = contextValue !== null && 
                           contextValue !== undefined && 
                           typeof contextValue === 'object' &&
                           'user' in contextValue
          if (hasValidContext) {
            console.log('SDK context available with user:', contextValue)
          }
        } catch (err) {
          console.log('SDK context not available or invalid')
        }
        
        // Only consider it a mini app if isInMiniApp() returns true OR context has user
        // Do NOT use ready() test - it can work in regular browsers too
        const isActuallyInMiniApp = status || hasValidContext
        
        console.log('Mini app detection result:', {
          isInMiniApp: status,
          hasValidContext,
          isActuallyInMiniApp
        })
        
        isResolved = true
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
        
        setIsInMiniApp(isActuallyInMiniApp)
        
        // Call ready() only if we confirmed we're in a mini app
        if (isActuallyInMiniApp) {
          try {
            await sdk.actions.ready()
            console.log('SDK ready() called successfully')
          } catch (readyError) {
            console.warn('SDK ready() failed:', readyError)
            // Continue anyway - app should still work
          }
        }
      } catch (error) {
        console.error('Error checking mini app status:', error)
        isResolved = true
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
        // On error, assume NOT in mini app (strict check)
        setIsInMiniApp(false)
      }
    }
    
    // Set a timeout to prevent infinite loading
    timeoutId = setTimeout(() => {
      if (!isResolved) {
        console.warn('Mini app check timeout - assuming NOT in mini app')
        isResolved = true
        setIsInMiniApp(false)
      }
    }, 4000)
    
    checkMiniApp()
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
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

