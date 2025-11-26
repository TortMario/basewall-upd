import { kv } from '@vercel/kv'

const POSTS_KEY = 'posts'
const POST_KEY_PREFIX = 'post:'
const REACTION_KEY_PREFIX = 'reaction:'

async function clearAllPosts() {
  try {
    console.log('Starting to clear all posts...')
    
    // Get all post IDs from sorted set
    const postIds = await kv.zrange(POSTS_KEY, 0, -1)
    console.log(`Found ${postIds.length} posts to delete`)
    
    if (postIds.length === 0) {
      console.log('No posts to delete')
      return
    }

    // Delete all post keys
    const postKeys = (postIds as string[]).map((id: string) => `${POST_KEY_PREFIX}${id}`)
    if (postKeys.length > 0) {
      console.log(`Deleting ${postKeys.length} post keys...`)
      await kv.del(...postKeys)
    }

    // Delete all reaction keys
    const reactionKeys: string[] = []
    for (const postId of postIds as string[]) {
      const keys = await kv.keys(`${REACTION_KEY_PREFIX}${postId}:*`)
      reactionKeys.push(...keys)
    }
    if (reactionKeys.length > 0) {
      console.log(`Deleting ${reactionKeys.length} reaction keys...`)
      await kv.del(...reactionKeys)
    }

    // Delete the posts sorted set
    await kv.del(POSTS_KEY)
    console.log('✅ All posts cleared successfully!')
    console.log(`Deleted ${postIds.length} posts and ${reactionKeys.length} reactions`)
  } catch (error) {
    console.error('❌ Error clearing posts:', error)
    throw error
  }
}

clearAllPosts()
  .then(() => {
    console.log('Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Failed:', error)
    process.exit(1)
  })

