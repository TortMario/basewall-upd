import { NextRequest, NextResponse } from 'next/server'
import * as kv from '@/lib/kv'

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

    if (post.author?.fid !== fid) {
      return NextResponse.json({ error: 'Only post author can edit' }, { status: 403 })
    }

    const updateData: any = {}
    if (text !== undefined) updateData.text = text

    const updated = await kv.updatePost(id, updateData)
    if (!updated) {
      return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
    }

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const searchParams = request.nextUrl.searchParams
    const fidParam = searchParams.get('fid')
    const usernameParam = searchParams.get('username')

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

    const ADMIN_USERNAME = 'mynameisthe'
    const ADMIN_ADDRESS = '0xCdBBdba01063a3A82f1D72Fb601fedFCff808183'
    const isAdmin = usernameParam === ADMIN_USERNAME || 
                    post.author?.address?.toLowerCase() === ADMIN_ADDRESS.toLowerCase() ||
                    post.authorAddress?.toLowerCase() === ADMIN_ADDRESS.toLowerCase()
    
    if (post.author?.fid !== fid && !isAdmin) {
      return NextResponse.json({ error: 'Only post author can delete' }, { status: 403 })
    }

    await kv.deletePost(id)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
