import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'

const POSTS_KEY = 'posts'
const POST_KEY_PREFIX = 'post:'
const REACTION_KEY_PREFIX = 'reaction:'

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const usernameParam = searchParams.get('username')
    const addressParam = searchParams.get('address')
    const fidParam = searchParams.get('fid')
    const fid = fidParam ? parseInt(fidParam, 10) : undefined
    
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'mynameisthe'
    const ADMIN_ADDRESS = process.env.ADMIN_ADDRESS || '0xCdBBdba01063a3A82f1D72Fb601fedFCff808183'
    const ADMIN_FID = process.env.ADMIN_FID ? parseInt(process.env.ADMIN_FID, 10) : undefined
    
    // Check admin by FID, username, or address
    const normalizedUsername = usernameParam?.replace(/^@/, '').toLowerCase() || ''
    const normalizedAdminUsername = ADMIN_USERNAME.replace(/^@/, '').toLowerCase()
    const isAdmin = 
      (ADMIN_FID && fid === ADMIN_FID) ||
      normalizedUsername === normalizedAdminUsername || 
      addressParam?.toLowerCase() === ADMIN_ADDRESS.toLowerCase()
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Only admin can clear all posts' }, { status: 403 })
    }

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

