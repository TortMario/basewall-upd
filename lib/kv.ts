import { kv } from '@vercel/kv'

export interface Author {
  fid?: number
  username?: string
  displayName?: string
  pfp?: string
  address?: string
}

export interface Post {
  id: string
  text: string
  authorAddress: string
  author?: Author
  createdAt: string
  likes: number
  dislikes: number
}

export interface Reaction {
  id: string
  postId: string
  fid: number
  type: 'like' | 'dislike'
  createdAt: string
}

const POSTS_KEY = 'posts'
const POST_KEY_PREFIX = 'post:'
const REACTION_KEY_PREFIX = 'reaction:'

export async function createPost(post: Omit<Post, 'id' | 'createdAt'>): Promise<Post> {
  const id = crypto.randomUUID()
  const createdAt = new Date().toISOString()
  const newPost: Post = { id, createdAt, ...post }

  await kv.set(`${POST_KEY_PREFIX}${id}`, newPost)
  await kv.zadd(POSTS_KEY, {
    score: new Date(createdAt).getTime(),
    member: id,
  })

  return newPost
}

export async function getPosts(limit = 20, offset = 0): Promise<Post[]> {
  try {
    const postIds = await kv.zrange(POSTS_KEY, offset, offset + limit - 1, {
      rev: false,
    })

    if (postIds.length === 0) return []

    const posts = await Promise.all(
      (postIds as string[]).map((id: string) => kv.get<Post>(`${POST_KEY_PREFIX}${id}`))
    )

    return posts.filter((post): post is Post => post !== null)
  } catch (error: any) {
    if (error?.message?.includes('WRONGTYPE')) {
      try {
        await kv.del(POSTS_KEY)
      } catch {}
    }
    return []
  }
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
  
  const reactionKeys = await kv.keys(`${REACTION_KEY_PREFIX}${id}:*`)
  if (reactionKeys.length > 0) {
    await kv.del(...reactionKeys)
  }

  return true
}

export async function getReaction(postId: string, fid: number): Promise<Reaction | null> {
  return kv.get<Reaction>(`${REACTION_KEY_PREFIX}${postId}:fid:${fid}`)
}

export async function setReaction(
  postId: string,
  fid: number,
  type: 'like' | 'dislike'
): Promise<{ likes: number; dislikes: number }> {
  const key = `${REACTION_KEY_PREFIX}${postId}:fid:${fid}`
  const existing = await getReaction(postId, fid)

  const post = await getPost(postId)
  if (!post) throw new Error('Post not found')

  let newLikes = post.likes
  let newDislikes = post.dislikes

  if (existing) {
    if (existing.type === type) {
      await kv.del(key)
      if (type === 'like') {
        newLikes = Math.max(0, newLikes - 1)
      } else {
        newDislikes = Math.max(0, newDislikes - 1)
      }
    } else {
      await kv.set(key, { ...existing, type })
      if (existing.type === 'like') {
        newLikes = Math.max(0, newLikes - 1)
        newDislikes += 1
      } else {
        newDislikes = Math.max(0, newDislikes - 1)
        newLikes += 1
      }
    }
  } else {
    await kv.set(key, {
      id: crypto.randomUUID(),
      postId,
      fid,
      type,
      createdAt: new Date().toISOString(),
    })
    if (type === 'like') {
      newLikes += 1
    } else {
      newDislikes += 1
    }
  }

  await updatePost(postId, { likes: newLikes, dislikes: newDislikes })
  return { likes: newLikes, dislikes: newDislikes }
}
