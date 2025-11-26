import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import * as kv from '@/lib/kv'

const reactionSchema = z.object({
  postId: z.string().uuid(),
  type: z.enum(['like', 'dislike']),
  fid: z.number().int().positive(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { postId, type, fid } = reactionSchema.parse(body)

    if (!fid) {
      return NextResponse.json({ error: 'FID is required' }, { status: 400 })
    }

    const result = await kv.setReaction(postId, fid, type)

    return NextResponse.json({
      success: true,
      likes: result.likes,
      dislikes: result.dislikes,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const postId = searchParams.get('postId')
    const fidParam = searchParams.get('fid')

    if (!postId || !fidParam) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    const fid = parseInt(fidParam, 10)
    if (isNaN(fid) || fid <= 0) {
      return NextResponse.json({ error: 'Invalid FID' }, { status: 400 })
    }

    const reaction = await kv.getReaction(postId, fid)
    return NextResponse.json({ reaction: reaction?.type || null })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
