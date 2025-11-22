import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin, supabase } from '@/lib/supabase'
import { getAuthFromRequest } from '@/lib/auth'
import { z } from 'zod'

const createPostSchema = z.object({
  text: z.string().min(1).max(280),
  authorAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
})

// POST /api/posts - Create a new post
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { text, authorAddress } = createPostSchema.parse(body)

    // Verify authorAddress matches authenticated address
    if (authorAddress.toLowerCase() !== auth.address.toLowerCase()) {
      return NextResponse.json({ error: 'Address mismatch' }, { status: 403 })
    }

    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    // Generate metadata URI (will be updated after mint)
    const localId = crypto.randomUUID()
    const metadataUri = `${process.env.NEXT_PUBLIC_MINIAPP_URL}/api/metadata/${localId}`

    const { data, error } = await supabaseAdmin
      .from('posts')
      .insert({
        text,
        authorAddress: authorAddress.toLowerCase(),
        tokenId: null,
        tokenUri: metadataUri,
        mintStatus: 'pending',
        likes: 0,
        dislikes: 0,
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
    }

    return NextResponse.json({
      id: data.id,
      status: 'created',
      metadataUri,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('POST /api/posts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/posts - Get posts with pagination
export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('createdAt', { ascending: true }) // Oldest first (top to bottom)
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
    }

    return NextResponse.json({ posts: data || [] })
  } catch (error) {
    console.error('GET /api/posts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

