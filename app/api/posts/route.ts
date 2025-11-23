import { NextRequest, NextResponse } from 'next/server'
import { getAuthFromRequest } from '@/lib/auth'
import { z } from 'zod'
import * as kv from '@/lib/kv'

const createPostSchema = z.object({
  text: z.string().min(1).max(280),
  authorAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  author: z.object({
    fid: z.number().optional().nullable(),
    username: z.string().optional().nullable(),
    displayName: z.string().optional().nullable(),
    pfp: z.string().optional().nullable().refine(
      (val) => !val || val === '' || z.string().url().safeParse(val).success,
      { message: 'pfp must be a valid URL or empty string' }
    ),
    address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  }).optional().nullable(),
})

// POST /api/posts - Create a new post
export async function POST(request: NextRequest) {
  try {
    // Check KV connection
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      console.error('KV environment variables missing:', {
        hasUrl: !!process.env.KV_REST_API_URL,
        hasToken: !!process.env.KV_REST_API_TOKEN,
        hasReadOnlyToken: !!process.env.KV_REST_API_READ_ONLY_TOKEN,
      })
      return NextResponse.json({ 
        error: 'Database not configured',
        hint: 'KV_REST_API_URL and KV_REST_API_TOKEN must be set'
      }, { status: 500 })
    }

    const body = await request.json()
    console.log('Received POST request body:', JSON.stringify(body, null, 2))
    
    // Validate with better error handling
    let validatedData
    try {
      validatedData = createPostSchema.parse(body)
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        console.error('Validation error:', validationError.errors)
        return NextResponse.json({ 
          error: 'Invalid input', 
          details: validationError.errors 
        }, { status: 400 })
      }
      throw validationError
    }
    
    const { text, authorAddress, author } = validatedData

    // In Base App, we trust the client's authorAddress
    // In production with Quick Auth, verify JWT token
    const auth = await getAuthFromRequest(request)
    if (auth && auth.address !== '0x0000000000000000000000000000000000000000') {
      // If auth is provided and valid, verify address matches
      if (authorAddress.toLowerCase() !== auth.address.toLowerCase()) {
        return NextResponse.json({ error: 'Address mismatch' }, { status: 403 })
      }
    }
    // Otherwise, trust the client (Base App context provides the address)

    // Generate metadata URI (will be updated after mint)
    const localId = crypto.randomUUID()
    const metadataUri = `${process.env.NEXT_PUBLIC_MINIAPP_URL || 'http://localhost:3000'}/api/metadata/${localId}`

    // Clean up author data - remove null/empty values
    const cleanedAuthor = author ? {
      fid: author.fid ?? undefined,
      username: author.username || undefined,
      displayName: author.displayName || undefined,
      pfp: author.pfp && author.pfp.trim() !== '' ? author.pfp : undefined,
      address: author.address.toLowerCase(),
    } : undefined

    const newPost = await kv.createPost({
      text,
      authorAddress: authorAddress.toLowerCase(),
      author: cleanedAuthor,
      tokenId: null,
      tokenUri: metadataUri,
      mintStatus: 'pending',
      likes: 0,
      dislikes: 0,
    })

    return NextResponse.json({
      id: newPost.id,
      status: 'created',
      metadataUri,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('POST /api/posts error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET /api/posts - Get posts with pagination
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const posts = await kv.getPosts(limit, offset)

    return NextResponse.json({ posts })
  } catch (error) {
    console.error('GET /api/posts error:', error)
    return NextResponse.json({ 
      posts: [],
      error: 'Failed to fetch posts',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
