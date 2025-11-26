'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Post } from './Post'
import { Post as PostType } from '@/lib/kv'
import { sdk } from '@farcaster/miniapp-sdk'

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
  const observerTarget = useRef<HTMLDivElement>(null)

  // Get current user fid from Base App
  useEffect(() => {
    const getUserFid = async () => {
      try {
        const isInMiniApp = await sdk.isInMiniApp()
        if (isInMiniApp) {
          const context = await sdk.context
          if (context?.user?.fid) {
            setCurrentUserFid(context.user.fid)
          }
        }
      } catch (error) {
        console.warn('Failed to get user fid:', error)
      }
    }
    getUserFid()
  }, [])

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
        setPosts((prev) => [...prev, ...newPosts])
      } else {
        setPosts(newPosts)
      }

      // Load reactions for current user (if fid is available)
      if (currentUserFid) {
        const reactionPromises = newPosts.map((post: PostType) =>
          fetch(`/api/reactions?postId=${post.id}&fid=${currentUserFid}`)
            .then((res) => res.json())
            .then((data) => ({ postId: post.id, reaction: data.reaction }))
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
    } catch (error) {
      console.error('Failed to load posts:', error)
    } finally {
      setLoading(false)
    }
  }, [currentUserFid])

  useEffect(() => {
    loadPosts(0, false)
  }, [loadPosts])

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
    } catch (error) {
      console.error('Reaction error:', error)
    }
  }

  const handleDelete = (postId: string) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId))
  }

  if (loading && posts.length === 0) {
    return (
      <div className="flex justify-center items-center py-8">
        <span className="text-blue-600">Loading posts...</span>
      </div>
    )
  }

  return (
    <div>
      {posts.map((post) => (
        <Post
          key={post.id}
          post={post}
          userReaction={userReactions[post.id]}
          onReaction={handleReaction}
          onEdit={onEdit}
          onDelete={handleDelete}
          currentUserFid={currentUserFid}
        />
      ))}
      <div ref={observerTarget} className="h-4" />
      {loading && posts.length > 0 && (
        <div className="text-center py-4 text-blue-600">Loading more...</div>
      )}
      {/* Extra space at the bottom for better scrolling experience */}
      <div className="h-32" />
    </div>
  )
}
