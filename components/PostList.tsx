'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAccount } from 'wagmi'
import { Post } from './Post'
import { Post as PostType } from '@/lib/supabase'
import { Address } from 'viem'

interface PostListProps {
  onEdit: (post: PostType) => void
}

export function PostList({ onEdit }: PostListProps) {
  const [posts, setPosts] = useState<PostType[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const [userReactions, setUserReactions] = useState<Record<string, 'like' | 'dislike'>>({})
  const [postOwners, setPostOwners] = useState<Record<string, Address>>({})
  const { address } = useAccount()
  const observerTarget = useRef<HTMLDivElement>(null)

  const loadPosts = useCallback(async (currentOffset: number, append = false) => {
    try {
      const response = await fetch(`/api/posts?limit=20&offset=${currentOffset}`)
      const data = await response.json()
      
      if (!response.ok) {
        console.error('Failed to load posts:', data)
        if (data.error === 'Database not configured') {
          // Show user-friendly message
          return
        }
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

      // Load user reactions for new posts
      if (address) {
        const reactionPromises = newPosts.map((post: PostType) =>
          fetch(`/api/reactions?postId=${post.id}&userAddress=${address}`)
            .then((res) => res.json())
            .then((data) => ({ postId: post.id, reaction: data.reaction }))
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

      // Load on-chain owners for minted posts
      const ownerPromises = newPosts
        .filter((post: PostType) => post.tokenId)
        .map((post: PostType) =>
          fetch(`/api/posts/${post.id}/owner`)
            .then((res) => res.json())
            .then((data) => ({ postId: post.id, owner: data.owner }))
            .catch(() => ({ postId: post.id, owner: null }))
        )
      const owners = await Promise.all(ownerPromises)
      setPostOwners((prev) => {
        const updated = { ...prev }
        owners.forEach(({ postId, owner }) => {
          if (owner) updated[postId] = owner as Address
        })
        return updated
      })
    } catch (error) {
      console.error('Failed to load posts:', error)
    } finally {
      setLoading(false)
    }
  }, [address])

  useEffect(() => {
    loadPosts(0, false)
  }, [loadPosts])

  // Infinite scroll
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
    if (!address) return

    try {
      const response = await fetch('/api/reactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Authorization: `Bearer ${await sdk.quickAuth.getToken()}`,
        },
        body: JSON.stringify({ postId, type }),
      })

      const data = await response.json()
      if (data.success) {
        // Update post counts
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? { ...post, likes: data.likes, dislikes: data.dislikes }
              : post
          )
        )

        // Update user reaction
        setUserReactions((prev) => {
          const current = prev[postId]
          if (current === type) {
            // Toggle off
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
          currentOwner={postOwners[post.id]}
        />
      ))}
      <div ref={observerTarget} className="h-4" />
      {loading && posts.length > 0 && (
        <div className="text-center py-4 text-blue-600">Loading more...</div>
      )}
    </div>
  )
}

