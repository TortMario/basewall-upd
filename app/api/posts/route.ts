import { NextRequest, NextResponse } from 'next/server'
import { getAuthFromRequest } from '@/lib/auth'
import { z } from 'zod'
import * as kv from '@/lib/kv'

const createPostSchema = z.object({
  text: z.string().min(1).max(280),
  authorAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  author: z.union([
    z.object({
      fid: z.number().optional().nullable(),
      username: z.string().optional().nullable(),
      displayName: z.string().optional().nullable(),
      pfp: z.string().optional().nullable().refine(
        (val) => !val || val === '' || z.string().url().safeParse(val).success,
        { message: 'pfp must be a valid URL or empty string' }
      ),
      address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    }),
    z.null(),
  ]).optional(),
})

// POST /api/posts - Create a new post
export async function POST(request: NextRequest) {
  try {
    // Check KV connection
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      return NextResponse.json({ 
        error: 'Database not configured',
        hint: 'KV_REST_API_URL and KV_REST_API_TOKEN must be set'
      }, { status: 500 })
    }

    const body = await request.json()
    
    let validatedData
    try {
      validatedData = createPostSchema.parse(body)
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json({ 
          error: 'Invalid input', 
          details: validationError.errors 
        }, { status: 400 })
      }
      throw validationError
    }
    
    const { text, authorAddress, author } = validatedData

    // Verify auth if available
    const auth = await getAuthFromRequest(request)
    if (auth && auth.address !== '0x0000000000000000000000000000000000000000') {
      if (authorAddress.toLowerCase() !== auth.address.toLowerCase()) {
        return NextResponse.json({ error: 'Address mismatch' }, { status: 403 })
      }
    }

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

// GET /api/posts - Get posts with pagination (only posts with successful mint)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Get all posts (we'll filter them)
    const allPosts = await kv.getPosts(1000, 0) // Get more to filter properly
    
    // Filter: only show posts with mintStatus === 'success' AND tokenId is not null
    // This ensures only posts with successfully minted NFTs are shown
    const validPosts = allPosts.filter(
      (post) => post.mintStatus === 'success' && post.tokenId !== null && post.tokenId !== undefined
    )
    
    // Sort by createdAt descending (newest first)
    validPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    // Apply pagination after filtering
    const paginatedPosts = validPosts.slice(offset, offset + limit)

    return NextResponse.json({ posts: paginatedPosts, total: validPosts.length })
  } catch (error) {
    console.error('GET /api/posts error:', error)
    return NextResponse.json({ 
      posts: [],
      error: 'Failed to fetch posts',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
