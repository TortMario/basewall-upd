import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'

const POSTS_KEY = 'posts'
const POST_KEY_PREFIX = 'post:'
const REACTION_KEY_PREFIX = 'reaction:'

export async function DELETE(request: NextRequest) {
  try {
    // TEMPORARY: Admin check disabled for clearing posts
    // TODO: Re-enable admin check after clearing posts
    // const searchParams = request.nextUrl.searchParams
    // const usernameParam = searchParams.get('username')
    // 
    // const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'mynameisthe'
    // const normalizedUsername = usernameParam?.replace(/^@/, '').toLowerCase() || ''
    // const normalizedAdminUsername = ADMIN_USERNAME.replace(/^@/, '').toLowerCase()
    // 
    // if (normalizedUsername !== normalizedAdminUsername) {
    //   return NextResponse.json({ error: 'Only admin can clear all posts' }, { status: 403 })
    // }

    // Get all post IDs from sorted set
    const postIds = await kv.zrange(POSTS_KEY, 0, -1)
    
    if (postIds.length === 0) {
      return NextResponse.json({ success: true, deleted: 0, message: 'No posts to delete' })
    }

    // Delete all post keys
    const postKeys = (postIds as string[]).map((id: string) => `${POST_KEY_PREFIX}${id}`)
    if (postKeys.length > 0) {
      await kv.del(...postKeys)
    }

    // Delete all reaction keys
    const reactionKeys: string[] = []
    for (const postId of postIds as string[]) {
      const keys = await kv.keys(`${REACTION_KEY_PREFIX}${postId}:*`)
      reactionKeys.push(...keys)
    }
    if (reactionKeys.length > 0) {
      await kv.del(...reactionKeys)
    }

    // Delete the posts sorted set
    await kv.del(POSTS_KEY)

    return NextResponse.json({ 
      success: true, 
      deleted: postIds.length,
      message: `Deleted ${postIds.length} posts` 
    })
  } catch (error) {
    console.error('Error clearing posts:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

