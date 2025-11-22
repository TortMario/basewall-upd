import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createPublicClient, http } from 'viem'
import { base, baseSepolia } from 'viem/chains'
import { contractABI, contractAddress } from '@/lib/contract'

// GET /api/posts/:id/owner - Get on-chain owner of post NFT
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
      .select('tokenId')
      .eq('id', id)
      .single()

    if (error || !post) {
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

