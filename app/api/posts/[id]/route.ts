import { NextRequest, NextResponse } from 'next/server'
import * as kv from '@/lib/kv'

// PATCH /api/posts/:id - Update post (only author by fid)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { text, fid } = body

    if (!fid) {
      return NextResponse.json({ error: 'FID is required' }, { status: 400 })
    }

    const post = await kv.getPost(id)
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Verify ownership by fid
    if (post.author?.fid !== fid) {
      return NextResponse.json({ error: 'Only post author can edit' }, { status: 403 })
    }

    // Update post
    const updateData: any = {}
    if (text !== undefined) updateData.text = text

    const updated = await kv.updatePost(id, updateData)
    if (!updated) {
      return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('PATCH /api/posts/:id error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/posts/:id - Delete post (only author by fid)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const searchParams = request.nextUrl.searchParams
    const fidParam = searchParams.get('fid')

    if (!fidParam) {
      return NextResponse.json({ error: 'FID is required' }, { status: 400 })
    }

    const fid = parseInt(fidParam, 10)
    if (isNaN(fid) || fid <= 0) {
      return NextResponse.json({ error: 'Invalid FID' }, { status: 400 })
    }

    const post = await kv.getPost(id)
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Verify ownership by fid
    if (post.author?.fid !== fid) {
      return NextResponse.json({ error: 'Only post author can delete' }, { status: 403 })
    }

    // Delete post
    await kv.deletePost(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/posts/:id error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
