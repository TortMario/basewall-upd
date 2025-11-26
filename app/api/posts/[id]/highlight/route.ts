import { NextRequest, NextResponse } from 'next/server'
import * as kv from '@/lib/kv'

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'mynameisthe'
const ADMIN_ADDRESS = process.env.ADMIN_ADDRESS || '0xCdBBdba01063a3A82f1D72Fb601fedFCff808183'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const searchParams = request.nextUrl.searchParams
    const usernameParam = searchParams.get('username')
    const addressParam = searchParams.get('address')

    const post = await kv.getPost(id)
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Check admin by username or address (current user's credentials)
    // Normalize username: remove @ prefix and compare case-insensitive
    const normalizedUsername = usernameParam?.replace(/^@/, '').toLowerCase() || ''
    const normalizedAdminUsername = ADMIN_USERNAME.replace(/^@/, '').toLowerCase()
    const isAdmin = normalizedUsername === normalizedAdminUsername || 
                    addressParam?.toLowerCase() === ADMIN_ADDRESS.toLowerCase()

    // Debug logging
    console.log('Admin check (highlight):', {
      usernameParam,
      normalizedUsername,
      ADMIN_USERNAME,
      normalizedAdminUsername,
      addressParam,
      ADMIN_ADDRESS,
      isAdmin
    })

    if (!isAdmin) {
      return NextResponse.json({ 
        error: 'Only admin can highlight posts',
        debug: {
          received: { username: usernameParam, address: addressParam },
          expected: { username: ADMIN_USERNAME, address: ADMIN_ADDRESS }
        }
      }, { status: 403 })
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

