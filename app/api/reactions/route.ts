import { NextRequest, NextResponse } from 'next/server'
import { getAuthFromRequest } from '@/lib/auth'
import { z } from 'zod'
import * as kv from '@/lib/kv'

const reactionSchema = z.object({
  postId: z.string().uuid(),
  type: z.enum(['like', 'dislike']),
})

// POST /api/reactions - Add or update reaction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { postId, type } = reactionSchema.parse(body)

    // Get auth if available, otherwise use address from request body
    const auth = await getAuthFromRequest(request)
    const userAddress = auth?.address && auth.address !== '0x0000000000000000000000000000000000000000'
      ? auth.address
      : body.userAddress || '0x0000000000000000000000000000000000000000'

    if (!userAddress || userAddress === '0x0000000000000000000000000000000000000000') {
      return NextResponse.json({ error: 'User address required' }, { status: 400 })
    }

    const result = await kv.setReaction(postId, userAddress, type)

    return NextResponse.json({
      success: true,
      likes: result.likes,
      dislikes: result.dislikes,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('POST /api/reactions error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET /api/reactions?postId=...&userAddress=... - Get user's reaction for a post
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const postId = searchParams.get('postId')
    const userAddress = searchParams.get('userAddress')

    if (!postId || !userAddress) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    const reaction = await kv.getReaction(postId, userAddress)

    return NextResponse.json({ reaction: reaction?.type || null })
  } catch (error) {
    console.error('GET /api/reactions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
