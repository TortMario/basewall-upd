import * as kv from '../lib/kv'

async function deletePendingPosts() {
  console.log('🗑️  Deleting posts without successful NFT mint...')
  
  try {
    // Check KV connection
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      console.error('❌ Database not configured')
      console.error('   KV_REST_API_URL and KV_REST_API_TOKEN must be set')
      console.error('   Note: This script requires Vercel KV environment variables')
      console.error('   You can run it via Vercel CLI or add variables to .env.local')
      process.exit(1)
    }

    // Get all posts
    const allPosts = await kv.getPosts(10000, 0)
    console.log(`📋 Found ${allPosts.length} total posts`)

    // Filter posts that should be deleted (not successful mint)
    const postsToDelete = allPosts.filter(
      (post) => post.mintStatus !== 'success' || post.tokenId === null
    )

    if (postsToDelete.length === 0) {
      console.log('✅ No posts to delete - all posts have successful mints')
      return
    }

    console.log(`🗑️  Found ${postsToDelete.length} posts to delete:`)
    postsToDelete.forEach((post, index) => {
      console.log(`  ${index + 1}. ${post.id} - Status: ${post.mintStatus}, TokenId: ${post.tokenId || 'null'}`)
    })

    // Delete each post
    let deleted = 0
    for (const post of postsToDelete) {
      try {
        await kv.deletePost(post.id)
        deleted++
        console.log(`  ✓ Deleted: ${post.id}`)
      } catch (error) {
        console.error(`  ✗ Failed to delete ${post.id}:`, error)
      }
    }

    console.log(`\n✅ Successfully deleted ${deleted} posts`)
    console.log(`📋 Remaining posts: ${allPosts.length - deleted}`)
    console.log('📋 Only posts with successful NFT mint will appear now.')
  } catch (error) {
    console.error('❌ Error deleting posts:', error)
    process.exit(1)
  }
}

deletePendingPosts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

