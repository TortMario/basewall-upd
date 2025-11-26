import { NextRequest, NextResponse } from 'next/server'
import * as kv from '@/lib/kv'

const ADMIN_USERNAME = 'mynameisthe'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const searchParams = request.nextUrl.searchParams
    const usernameParam = searchParams.get('username')

    if (usernameParam !== ADMIN_USERNAME) {
      return NextResponse.json({ error: 'Only admin can highlight posts' }, { status: 403 })
    }

    const post = await kv.getPost(id)
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const updated = await kv.updatePost(id, { isHighlighted: !post.isHighlighted })
    if (!updated) {
      return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
    }

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

