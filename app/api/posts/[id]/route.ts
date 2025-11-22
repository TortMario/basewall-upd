import { NextRequest, NextResponse } from 'next/server'
import { getAuthFromRequest } from '@/lib/auth'
import { createPublicClient, http } from 'viem'
import { base, baseSepolia } from 'viem/chains'
import { contractABI, contractAddress } from '@/lib/contract'
import * as kv from '@/lib/kv'

// PATCH /api/posts/:id - Update post (only owner)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthFromRequest(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { text, tokenId, mintStatus } = body

    const post = await kv.getPost(id)
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // If post has tokenId, verify ownership on-chain
    if (post.tokenId) {
      const chain = process.env.NEXT_PUBLIC_BASE_RPC_URL?.includes('sepolia')
        ? baseSepolia
        : base

      const client = createPublicClient({
        chain,
        transport: http(process.env.NEXT_PUBLIC_BASE_RPC_URL),
      })

      try {
        const owner = await client.readContract({
          address: contractAddress,
          abi: contractABI,
          functionName: 'ownerOf',
          args: [BigInt(post.tokenId)],
        })

        if (owner.toLowerCase() !== auth.address.toLowerCase()) {
          return NextResponse.json({ error: 'Only token owner can edit' }, { status: 403 })
        }
      } catch (error) {
        console.error('On-chain ownership check failed:', error)
        return NextResponse.json({ error: 'Failed to verify ownership' }, { status: 500 })
      }
    } else {
      // For unminted posts, check authorAddress
      if (post.authorAddress.toLowerCase() !== auth.address.toLowerCase()) {
        return NextResponse.json({ error: 'Only author can edit' }, { status: 403 })
      }
    }

    // Update post
    const updateData: any = {}
    if (text !== undefined) updateData.text = text
    if (tokenId !== undefined) updateData.tokenId = tokenId
    if (mintStatus !== undefined) updateData.mintStatus = mintStatus

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

// DELETE /api/posts/:id - Delete post (only owner)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthFromRequest(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    const post = await kv.getPost(id)
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Verify ownership (same logic as PATCH)
    if (post.tokenId) {
      const chain = process.env.NEXT_PUBLIC_BASE_RPC_URL?.includes('sepolia')
        ? baseSepolia
        : base

      const client = createPublicClient({
        chain,
        transport: http(process.env.NEXT_PUBLIC_BASE_RPC_URL),
      })

      try {
        const owner = await client.readContract({
          address: contractAddress,
          abi: contractABI,
          functionName: 'ownerOf',
          args: [BigInt(post.tokenId)],
        })

        if (owner.toLowerCase() !== auth.address.toLowerCase()) {
          return NextResponse.json({ error: 'Only token owner can delete' }, { status: 403 })
        }
      } catch (error) {
        console.error('On-chain ownership check failed:', error)
        return NextResponse.json({ error: 'Failed to verify ownership' }, { status: 500 })
      }
    } else {
      if (post.authorAddress.toLowerCase() !== auth.address.toLowerCase()) {
        return NextResponse.json({ error: 'Only author can delete' }, { status: 403 })
      }
    }

    // Delete post
    await kv.deletePost(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/posts/:id error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
