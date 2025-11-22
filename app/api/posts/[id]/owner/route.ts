import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'
import { base, baseSepolia } from 'viem/chains'
import { contractABI, contractAddress } from '@/lib/contract'
import * as kv from '@/lib/kv'

// GET /api/posts/:id/owner - Get on-chain owner of post NFT
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

    if (!post.tokenId) {
      return NextResponse.json({ error: 'Post not minted yet' }, { status: 400 })
    }

    const chain = process.env.NEXT_PUBLIC_BASE_RPC_URL?.includes('sepolia')
      ? baseSepolia
      : base

    const client = createPublicClient({
      chain,
      transport: http(process.env.NEXT_PUBLIC_BASE_RPC_URL),
    })

    const owner = await client.readContract({
      address: contractAddress,
      abi: contractABI,
      functionName: 'ownerOf',
      args: [BigInt(post.tokenId)],
    })

    return NextResponse.json({ owner })
  } catch (error) {
    console.error('GET /api/posts/:id/owner error:', error)
    return NextResponse.json({ error: 'Failed to fetch owner' }, { status: 500 })
  }
}
