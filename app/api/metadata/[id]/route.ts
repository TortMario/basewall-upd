import { NextRequest, NextResponse } from 'next/server'
import * as kv from '@/lib/kv'

// GET /api/metadata/:id - Get NFT metadata JSON
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const post = await kv.getPost(id)
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Generate metadata according to ERC-721 metadata standard
    const metadata = {
      name: `The Wall Base Post #${post.tokenId || 'Pending'}`,
      description: post.text,
      image: `${process.env.NEXT_PUBLIC_MINIAPP_URL || 'http://localhost:3000'}/api/og-image?id=${id}`, // Placeholder
      external_url: `${process.env.NEXT_PUBLIC_MINIAPP_URL || 'http://localhost:3000'}/posts/${id}`,
      attributes: [
        {
          trait_type: 'Author',
          value: post.authorAddress,
        },
        {
          trait_type: 'Created',
          value: new Date(post.createdAt).toISOString(),
        },
        {
          trait_type: 'Likes',
          value: post.likes,
        },
        {
          trait_type: 'Dislikes',
          value: post.dislikes,
        },
      ],
    }

    return NextResponse.json(metadata, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('GET /api/metadata/:id error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
