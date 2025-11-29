'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Post } from './Post'
import { Post as PostType } from '@/lib/kv'
import { sdk } from '@farcaster/miniapp-sdk'
import { useAccount } from 'wagmi'

interface PostListProps {
  onEdit: (post: PostType) => void
}

export function PostList({ onEdit }: PostListProps) {
  const [posts, setPosts] = useState<PostType[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const [userReactions, setUserReactions] = useState<Record<string, 'like' | 'dislike'>>({})
  const [currentUserFid, setCurrentUserFid] = useState<number | undefined>(undefined)
  const [currentUserUsername, setCurrentUserUsername] = useState<string | undefined>(undefined)
  const [currentUserAddress, setCurrentUserAddress] = useState<string | undefined>(undefined)
  const observerTarget = useRef<HTMLDivElement>(null)
  
  // Get wallet address from wagmi (for browser wallet connection)
  const { address: walletAddress, isConnected } = useAccount()

  useEffect(() => {
    const getUserData = async () => {
      try {
        console.log('🔍 Starting user data load...')
        // Always try to get context - it may be available even if isInMiniApp() is false
        let context = null
        
        try {
          console.log('🔍 Attempting to get SDK context directly...')
          // Try to get context directly - this works in Base App even if isInMiniApp() returns false
          context = await sdk.context
          console.log('✅ SDK context received:', context)
        } catch (e) {
          console.warn('⚠️ Direct context failed, trying isInMiniApp fallback...', e)
          // Context not available, try checking isInMiniApp first
          try {
            const isInMiniApp = await sdk.isInMiniApp()
            console.log('🔍 isInMiniApp result:', isInMiniApp)
            if (isInMiniApp) {
              // Retry context if confirmed in mini app
              console.log('🔍 Retrying context after isInMiniApp confirmation...')
              context = await sdk.context
              console.log('✅ SDK context received (retry):', context)
            }
          } catch (e2) {
            console.warn('⚠️ Both context methods failed:', e2)
          }
        }
        
        if (context?.user) {
          console.log('✅ Context user data loaded:', {
            fid: context.user.fid,
            username: context.user.username,
            displayName: context.user.displayName
          })
          
          if (context.user.fid) {
            console.log('✅ Setting FID:', context.user.fid)
            setCurrentUserFid(context.user.fid)
          }
          // username comes without @ symbol according to docs
          if (context.user.username) {
            console.log('✅ Setting username:', context.user.username)
            setCurrentUserUsername(context.user.username)
          }
          // Address is not available in context.user, it comes from wallet
        } else {
          console.warn('⚠️ Context user not available, context:', context)
        }
      } catch (error) {
        console.error('❌ Error getting user data:', error)
      }
    }
    getUserData()
  }, [])

  // Update address from wallet when connected (for browser)
  useEffect(() => {
    if (walletAddress && isConnected) {
      console.log('✅ Setting wallet address:', walletAddress)
      setCurrentUserAddress(walletAddress)
    } else if (!isConnected) {
      setCurrentUserAddress(undefined)
    }
  }, [walletAddress, isConnected])

  const loadPosts = useCallback(async (currentOffset: number, append = false) => {
    try {
      const response = await fetch(`/api/posts?limit=20&offset=${currentOffset}`)
      const data = await response.json()
      
      if (!response.ok) {
        if (data.error === 'Database not configured') return
        throw new Error(data.error || 'Failed to load posts')
      }
      
      const { posts: newPosts } = data

      if (newPosts.length === 0) {
        setHasMore(false)
        return
      }

      if (append) {
        setPosts((prev) => {
          const existingIds = new Set(prev.map((p: PostType) => p.id))
          const trulyNew = newPosts.filter((p: PostType) => !existingIds.has(p.id))
          if (trulyNew.length > 0) {
            // Add new posts at the beginning (newest first)
            return [...trulyNew, ...prev]
          }
          return prev
        })
      } else {
        setPosts(newPosts)
      }

      // Only fetch reactions if we have a valid FID (positive integer)
      if (currentUserFid && currentUserFid > 0) {
        const reactionPromises = newPosts.map((post: PostType) =>
          fetch(`/api/reactions?postId=${post.id}&fid=${currentUserFid}`)
            .then((res) => {
              if (!res.ok) {
                // Don't throw, just return null reaction
                return { postId: post.id, reaction: null }
              }
              return res.json().then((data) => ({ postId: post.id, reaction: data.reaction }))
            })
            .catch(() => ({ postId: post.id, reaction: null }))
        )
        const reactions = await Promise.all(reactionPromises)
        setUserReactions((prev) => {
          const updated = { ...prev }
          reactions.forEach(({ postId, reaction }) => {
            if (reaction) updated[postId] = reaction
          })
          return updated
        })
      }
    } catch {}
    finally {
      setLoading(false)
    }
  }, [currentUserFid])

  useEffect(() => {
    loadPosts(0, false)
  }, [loadPosts])

  // Live update: poll for new posts every 10 seconds
  useEffect(() => {
    if (loading) return
    
    const interval = setInterval(() => {
      // Check for new posts (only first page to avoid duplicates)
      fetch(`/api/posts?limit=20&offset=0`)
        .then((res) => res.json())
        .then((data) => {
          if (data.posts && data.posts.length > 0) {
            setPosts((prev) => {
              const existingIds = new Set(prev.map((p: PostType) => p.id))
              const trulyNew = data.posts.filter((p: PostType) => !existingIds.has(p.id))
              if (trulyNew.length > 0) {
                // Add new posts at the beginning (newest first)
                return [...trulyNew, ...prev]
              }
              return prev
            })
          }
        })
        .catch(() => {}) // Silent fail for polling
    }, 10000) // Poll every 10 seconds

    return () => clearInterval(interval)
  }, [loading])

  useEffect(() => {
    const target = observerTarget.current
    if (!target) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          const newOffset = offset + 20
          setOffset(newOffset)
          loadPosts(newOffset, true)
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(target)

    return () => {
      observer.unobserve(target)
    }
  }, [hasMore, loading, offset, loadPosts])

  const handleReaction = async (postId: string, type: 'like' | 'dislike') => {
    if (!currentUserFid) {
      alert('Please use Base App to react to posts')
      return
    }

    try {
      const response = await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, type, fid: currentUserFid }),
      })

      const data = await response.json()
      if (data.success) {
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? { ...post, likes: data.likes, dislikes: data.dislikes }
              : post
          )
        )

        setUserReactions((prev) => {
          const current = prev[postId]
          if (current === type) {
            const updated = { ...prev }
            delete updated[postId]
            return updated
          }
          return { ...prev, [postId]: type }
        })
      }
    } catch {}
  }

  const handleDelete = (postId: string) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId))
  }

  const handleEdit = (updatedPost: PostType) => {
    setPosts((prev) => prev.map((post) => post.id === updatedPost.id ? updatedPost : post))
  }

  // Check if current user is admin
  const ADMIN_USERNAME = process.env.NEXT_PUBLIC_ADMIN_USERNAME || 'mynameisthe'
  const ADMIN_ADDRESS = process.env.NEXT_PUBLIC_ADMIN_ADDRESS || '0xCdBBdba01063a3A82f1D72Fb601fedFCff808183'
  const ADMIN_FID = process.env.NEXT_PUBLIC_ADMIN_FID ? parseInt(process.env.NEXT_PUBLIC_ADMIN_FID, 10) : undefined
  
  // Normalize: username comes WITHOUT @ from SDK, ADMIN_USERNAME might have @
  const normalizedUsername = currentUserUsername?.replace(/^@/, '').toLowerCase().trim()
  const normalizedAdminUsername = ADMIN_USERNAME.replace(/^@/, '').toLowerCase().trim()
  
  const isAdmin = 
    (ADMIN_FID && currentUserFid === ADMIN_FID) ||
    (normalizedUsername && normalizedUsername === normalizedAdminUsername) ||
    (currentUserAddress && currentUserAddress.toLowerCase() === ADMIN_ADDRESS.toLowerCase())
  
  // Debug logging
  useEffect(() => {
    console.log('🔍 Admin check in PostList:', {
      currentUserFid,
      currentUserUsername,
      normalizedUsername,
      currentUserAddress,
      ADMIN_USERNAME,
      normalizedAdminUsername,
      ADMIN_ADDRESS,
      ADMIN_FID,
      isAdmin,
      fidMatch: ADMIN_FID ? currentUserFid === ADMIN_FID : false,
      usernameMatch: normalizedUsername === normalizedAdminUsername,
      addressMatch: currentUserAddress ? currentUserAddress.toLowerCase() === ADMIN_ADDRESS.toLowerCase() : false
    })
  }, [currentUserFid, currentUserUsername, currentUserAddress, isAdmin])

  if (loading && posts.length === 0) {
    return (
      <div className="flex justify-center items-center py-8">
        <span className="text-blue-600">Loading posts...</span>
      </div>
    )
  }

  // Filter posts: show hidden posts only to admin or author
  const visiblePosts = posts.filter((post) => {
    if (!post.isHidden) return true
    // Show hidden post to admin
    if (isAdmin) return true
    // Show hidden post to author
    if (currentUserFid && post.author?.fid === currentUserFid) return true
    // Hide from everyone else
    return false
  })

  return (
    <div>
      {visiblePosts.map((post) => (
        <Post
          key={post.id}
          post={post}
          userReaction={userReactions[post.id]}
          onReaction={handleReaction}
          onEdit={handleEdit}
          onDelete={handleDelete}
          currentUserFid={currentUserFid}
          currentUserUsername={currentUserUsername}
          currentUserAddress={currentUserAddress}
        />
      ))}
      <div ref={observerTarget} className="h-4" />
      {loading && posts.length > 0 && (
        <div className="text-center py-4 text-blue-600">Loading more...</div>
      )}
      <div className="h-32" />
    </div>
  )
}
