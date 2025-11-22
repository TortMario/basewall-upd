// Vercel KV / Upstash Redis adapter
// Alternative to Supabase for storing posts and reactions

import { kv } from '@vercel/kv'

export interface Post {
  id: string
  text: string
  authorAddress: string
  createdAt: string
  tokenId: number | null
  tokenUri: string | null
  mintStatus: 'pending' | 'success' | 'failed'
  likes: number
  dislikes: number
}

export interface Reaction {
  id: string
  postId: string
  userAddress: string
  type: 'like' | 'dislike'
  createdAt: string
}

// Posts storage
const POSTS_KEY = 'posts'
const POST_KEY_PREFIX = 'post:'
const REACTION_KEY_PREFIX = 'reaction:'

export async function createPost(post: Omit<Post, 'id' | 'createdAt'>): Promise<Post> {
  const id = crypto.randomUUID()
  const createdAt = new Date().toISOString()
  const newPost: Post = {
    id,
    createdAt,
    ...post,
  }

  // Store individual post
  await kv.set(`${POST_KEY_PREFIX}${id}`, newPost)
  
  // Add to posts list (sorted by createdAt)
  await kv.zadd(POSTS_KEY, {
    score: new Date(createdAt).getTime(),
    member: id,
  })

  return newPost
}

export async function getPosts(limit = 20, offset = 0): Promise<Post[]> {
  // Get post IDs sorted by score (timestamp) ascending
  const postIds = await kv.zrange(POSTS_KEY, offset, offset + limit - 1, {
    rev: false, // ascending (oldest first)
  })

  if (postIds.length === 0) return []

  // Fetch all posts
  const posts = await Promise.all(
    postIds.map((id) => kv.get<Post>(`${POST_KEY_PREFIX}${id}`))
  )

  return posts.filter((post): post is Post => post !== null)
}

export async function getPost(id: string): Promise<Post | null> {
  return kv.get<Post>(`${POST_KEY_PREFIX}${id}`)
}

export async function updatePost(id: string, updates: Partial<Post>): Promise<Post | null> {
  const post = await getPost(id)
  if (!post) return null

  const updated = { ...post, ...updates }
  await kv.set(`${POST_KEY_PREFIX}${id}`, updated)
  return updated
}

export async function deletePost(id: string): Promise<boolean> {
  await kv.del(`${POST_KEY_PREFIX}${id}`)
  await kv.zrem(POSTS_KEY, id)
  
  // Delete all reactions for this post
  const reactionKeys = await kv.keys(`${REACTION_KEY_PREFIX}${id}:*`)
  if (reactionKeys.length > 0) {
    await kv.del(...reactionKeys)
  }

  return true
}

// Reactions storage
export async function getReaction(postId: string, userAddress: string): Promise<Reaction | null> {
  return kv.get<Reaction>(`${REACTION_KEY_PREFIX}${postId}:${userAddress.toLowerCase()}`)
}

export async function setReaction(
  postId: string,
  userAddress: string,
  type: 'like' | 'dislike'
): Promise<{ likes: number; dislikes: number }> {
  const key = `${REACTION_KEY_PREFIX}${postId}:${userAddress.toLowerCase()}`
  const existing = await getReaction(postId, userAddress)

  const post = await getPost(postId)
  if (!post) throw new Error('Post not found')

  let newLikes = post.likes
  let newDislikes = post.dislikes

  if (existing) {
    if (existing.type === type) {
      // Remove reaction (toggle off)
      await kv.del(key)
      if (type === 'like') {
        newLikes = Math.max(0, newLikes - 1)
      } else {
        newDislikes = Math.max(0, newDislikes - 1)
      }
    } else {
      // Change reaction type
      await kv.set(key, {
        ...existing,
        type,
      })
      if (existing.type === 'like') {
        newLikes = Math.max(0, newLikes - 1)
        newDislikes += 1
      } else {
        newDislikes = Math.max(0, newDislikes - 1)
        newLikes += 1
      }
    }
  } else {
    // Create new reaction
    await kv.set(key, {
      id: crypto.randomUUID(),
      postId,
      userAddress: userAddress.toLowerCase(),
      type,
      createdAt: new Date().toISOString(),
    })
    if (type === 'like') {
      newLikes += 1
    } else {
      newDislikes += 1
    }
  }

  // Update post counts
  await updatePost(postId, {
    likes: newLikes,
    dislikes: newDislikes,
  })

  return { likes: newLikes, dislikes: newDislikes }
}

