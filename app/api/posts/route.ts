import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import * as kv from '@/lib/kv'

const createPostSchema = z.object({
  text: z.string().min(1).max(280),
  fid: z.number().int().positive(),
  author: z.union([
    z.object({
      fid: z.number().optional().nullable(),
      username: z.string().optional().nullable(),
      displayName: z.string().optional().nullable(),
      pfp: z.string().optional().nullable().refine(
        (val) => !val || val === '' || z.string().url().safeParse(val).success,
        { message: 'pfp must be a valid URL or empty string' }
      ),
      address: z.string().optional().nullable(),
    }),
    z.null(),
  ]).optional(),
})

export async function POST(request: NextRequest) {
  try {
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      return NextResponse.json({ 
        error: 'Database not configured',
      }, { status: 500 })
    }

    const body = await request.json()
    const validatedData = createPostSchema.parse(body)
    const { text, fid, author } = validatedData

    const allPosts = await kv.getPosts(1000, 0)
    const userPosts = allPosts.filter((post) => post.author?.fid === fid)

    if (userPosts.length > 0) {
      const lastPost = userPosts.reduce((latest, post) => {
        const postTime = new Date(post.createdAt).getTime()
        const latestTime = new Date(latest.createdAt).getTime()
        return postTime > latestTime ? post : latest
      })

      const lastPostTime = new Date(lastPost.createdAt).getTime()
      const now = Date.now()
      const timeSinceLastPost = now - lastPostTime
      const hours24 = 24 * 60 * 60 * 1000

      if (timeSinceLastPost < hours24) {
        const timeRemaining = hours24 - timeSinceLastPost
        const hoursLeft = Math.floor(timeRemaining / (60 * 60 * 1000))
        const minutesLeft = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000))
        
        return NextResponse.json({ 
          error: 'You can only post once per 24 hours',
          hoursLeft,
          minutesLeft,
        }, { status: 429 })
      }
    }

    const cleanedAuthor = author ? {
      fid: author.fid ?? fid,
      username: author.username || undefined,
      displayName: author.displayName || undefined,
      pfp: author.pfp && author.pfp.trim() !== '' ? author.pfp : undefined,
      address: author.address || undefined,
    } : { fid }

    const newPost = await kv.createPost({
      text,
      authorAddress: author?.address || `fid:${fid}`,
      author: cleanedAuthor,
      likes: 0,
      dislikes: 0,
    })

    return NextResponse.json({ id: newPost.id, status: 'created' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ 
      error: 'Internal server error',
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const allPosts = await kv.getPosts(1000, 0)
    allPosts.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    const paginatedPosts = allPosts.slice(offset, offset + limit)

    return NextResponse.json({ posts: paginatedPosts, total: allPosts.length })
  } catch {
    return NextResponse.json({ posts: [], error: 'Failed to fetch posts' })
  }
}
