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
        // Check if we're in a mini app
        const status = await sdk.isInMiniApp()
        
        // Also check context to detect Base App even if isInMiniApp returns false
        let context = null
        try {
          context = await sdk.context
          console.log('SDK context:', context)
        } catch {
          // Context might not be available
        }
        
        // Check for Base App indicators
        const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : ''
        const referrer = typeof window !== 'undefined' ? document.referrer : ''
        const isBaseAppUA = userAgent.includes('BaseApp') || userAgent.includes('Farcaster')
        const isBaseAppReferrer = referrer.includes('base.app') || referrer.includes('farcaster')
        
        console.log('Mini app detection:', {
          isInMiniApp: status,
          hasContext: context !== null,
          userAgent: userAgent.substring(0, 100),
          referrer,
          isBaseAppUA,
          isBaseAppReferrer
        })
        
        // Consider it a mini app if:
        // 1. isInMiniApp returns true, OR
        // 2. We have context (which means we're in Base App/Farcaster client), OR
        // 3. User agent or referrer indicates Base App
        const isActuallyInMiniApp = status || (context !== null && context !== undefined) || isBaseAppUA || isBaseAppReferrer
        
        setIsInMiniApp(isActuallyInMiniApp)
        
        // Always try to call ready() if we detect any Base App indicators
        // This ensures the app works even when opened from search
        if (isActuallyInMiniApp) {
          try {
            await sdk.actions.ready()
            console.log('SDK ready() called successfully')
          } catch (readyError) {
            console.warn('SDK ready() failed, but continuing:', readyError)
            // Continue anyway - app should still work
          }
        }
      } catch (error) {
        console.error('Error checking mini app status:', error)
        // Even on error, try to detect Base App and call ready()
        const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : ''
        const referrer = typeof window !== 'undefined' ? document.referrer : ''
        const isBaseApp = userAgent.includes('BaseApp') || 
                         userAgent.includes('Farcaster') ||
                         referrer.includes('base.app') ||
                         referrer.includes('farcaster')
        
        if (isBaseApp) {
          try {
            await sdk.actions.ready()
            setIsInMiniApp(true)
            console.log('SDK ready() called via fallback detection')
          } catch {
            setIsInMiniApp(false)
          }
        } else {
          setIsInMiniApp(false)
        }
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

