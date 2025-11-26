import * as kv from '../lib/kv'

async function clearAllPosts() {
  console.log('🗑️  Clearing all posts from database...')
  
  try {
    // Check KV connection
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      console.error('❌ Database not configured')
      console.error('   KV_REST_API_URL and KV_REST_API_TOKEN must be set')
      process.exit(1)
    }

    // Get all posts
    const allPosts = await kv.getPosts(10000, 0)
    console.log(`📋 Found ${allPosts.posts.length} posts`)

    if (allPosts.posts.length === 0) {
      console.log('✅ No posts to delete')
      return
    }

    // Delete each post
    let deleted = 0
    for (const post of allPosts.posts) {
      try {
        await kv.deletePost(post.id)
        deleted++
        console.log(`  ✓ Deleted post: ${post.id} (${post.text.substring(0, 30)}...)`)
      } catch (error) {
        console.error(`  ✗ Failed to delete post ${post.id}:`, error)
      }
    }

    console.log(`\n✅ Successfully deleted ${deleted} posts`)
    console.log('📋 Database cleared. Only posts with successful NFT mint will appear now.')
  } catch (error) {
    console.error('❌ Error clearing posts:', error)
    process.exit(1)
  }
}

clearAllPosts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

