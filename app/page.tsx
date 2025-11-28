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
        // Check if we're in a mini app - this is the primary check
        let status = false
        try {
          status = await sdk.isInMiniApp()
        } catch {
          // If isInMiniApp fails, try other methods
        }
        
        // Check context - if it resolves, we're likely in a client
        let hasContext = false
        let contextValue = null
        try {
          contextValue = await Promise.race([
            sdk.context,
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500))
          ])
          hasContext = contextValue !== null && contextValue !== undefined
          console.log('SDK context:', contextValue)
        } catch {
          // Context not available - this is OK
        }
        
        // Check if we're in an iframe (common for mini apps)
        const isInIframe = typeof window !== 'undefined' && window.self !== window.top
        
        // Try to call ready() - if it works, we're definitely in a mini app
        let readyWorks = false
        if (!status && !hasContext) {
          try {
            // Try calling ready() with a short timeout
            await Promise.race([
              sdk.actions.ready(),
              new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 500))
            ])
            readyWorks = true
            console.log('ready() worked - we are in a mini app')
          } catch {
            // ready() failed or timed out - probably not in mini app
          }
        }
        
        // Determine if we're in a mini app
        // Primary: isInMiniApp() returns true
        // Fallback 1: context is available
        // Fallback 2: ready() works
        // Fallback 3: we're in an iframe (less reliable)
        const isActuallyInMiniApp = status || hasContext || readyWorks || isInIframe
        
        console.log('Mini app detection:', {
          isInMiniApp: status,
          hasContext,
          readyWorks,
          isInIframe,
          isActuallyInMiniApp
        })
        
        isResolved = true
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
        
        setIsInMiniApp(isActuallyInMiniApp)
        
        // Call ready() if we're in a mini app to hide splash screen
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
        // On error, check if we're in iframe as last resort
        const isInIframe = typeof window !== 'undefined' && window.self !== window.top
        setIsInMiniApp(isInIframe)
        
        // Try ready() anyway if in iframe
        if (isInIframe) {
          try {
            await sdk.actions.ready()
          } catch {
            // Ignore
          }
        }
      }
    }
    
    // Set a timeout to prevent infinite loading
    timeoutId = setTimeout(() => {
      if (!isResolved) {
        console.warn('Mini app check timeout - checking iframe as fallback')
        const isInIframe = typeof window !== 'undefined' && window.self !== window.top
        isResolved = true
        setIsInMiniApp(isInIframe)
        if (isInIframe) {
          // Try ready() anyway
          sdk.actions.ready().catch(() => {})
        }
      }
    }, 2000)
    
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

