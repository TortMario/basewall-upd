import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/metadata/:id - Get NFT metadata JSON
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { data: post, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Generate metadata according to ERC-721 metadata standard
    const metadata = {
      name: `The Wall Base Post #${post.tokenId || 'Pending'}`,
      description: post.text,
      image: `${process.env.NEXT_PUBLIC_MINIAPP_URL}/api/og-image?id=${id}`, // Placeholder
      external_url: `${process.env.NEXT_PUBLIC_MINIAPP_URL}/posts/${id}`,
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

