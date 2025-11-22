import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getAuthFromRequest } from '@/lib/auth'
import { z } from 'zod'

const reactionSchema = z.object({
  postId: z.string().uuid(),
  type: z.enum(['like', 'dislike']),
})

// POST /api/reactions - Add or update reaction
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { postId, type } = reactionSchema.parse(body)

    const supabaseAdmin = getSupabaseAdmin()

    // Check if reaction already exists
    const { data: existing } = await supabaseAdmin
      .from('reactions')
      .select('*')
      .eq('postId', postId)
      .eq('userAddress', auth.address.toLowerCase())
      .single()

    // Get current post to update counts
    const { data: post } = await supabaseAdmin
      .from('posts')
      .select('likes, dislikes')
      .eq('id', postId)
      .single()

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    let newLikes = post.likes
    let newDislikes = post.dislikes

    if (existing) {
      // Update existing reaction
      if (existing.type === type) {
        // Remove reaction (toggle off)
        await supabaseAdmin.from('reactions').delete().eq('id', existing.id)
        if (type === 'like') {
          newLikes = Math.max(0, newLikes - 1)
        } else {
          newDislikes = Math.max(0, newDislikes - 1)
        }
      } else {
        // Change reaction type
        await supabaseAdmin
          .from('reactions')
          .update({ type })
          .eq('id', existing.id)

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
      await supabaseAdmin.from('reactions').insert({
        postId,
        userAddress: auth.address.toLowerCase(),
        type,
      })

      if (type === 'like') {
        newLikes += 1
      } else {
        newDislikes += 1
      }
    }

    // Update post counts
    await supabaseAdmin
      .from('posts')
      .update({
        likes: newLikes,
        dislikes: newDislikes,
      })
      .eq('id', postId)

    return NextResponse.json({
      success: true,
      likes: newLikes,
      dislikes: newDislikes,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('POST /api/reactions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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

    const { data, error } = await getSupabaseAdmin()
      .from('reactions')
      .select('type')
      .eq('postId', postId)
      .eq('userAddress', userAddress.toLowerCase())
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = not found, which is fine
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to fetch reaction' }, { status: 500 })
    }

    return NextResponse.json({ reaction: data?.type || null })
  } catch (error) {
    console.error('GET /api/reactions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

