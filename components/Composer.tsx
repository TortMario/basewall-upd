'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { contractABI, contractAddress } from '@/lib/onchain'
import { Address } from 'viem'

interface ComposerProps {
  onPostCreated: () => void
}

export function Composer({ onPostCreated }: ComposerProps) {
  const [text, setText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mintStatus, setMintStatus] = useState<'idle' | 'creating' | 'minting' | 'success' | 'error'>('idle')
  const { address } = useAccount()
  const { writeContract, data: hash } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!text.trim() || !address || text.length > 280) return

    setIsSubmitting(true)
    setMintStatus('creating')

    try {
      // Get user data from Base App MiniKit SDK
      let authorData = null
      try {
        if (typeof window !== 'undefined' && (window as any).farcaster?.sdk) {
          const sdk = (window as any).farcaster.sdk
          const user = await sdk.actions.requestUser({
            fields: ['fid', 'username', 'displayName', 'pfp', 'address'],
          })
          if (user) {
            authorData = {
              fid: user.fid,
              username: user.username,
              displayName: user.displayName,
              pfp: user.pfp,
              address: user.address || address,
            }
          }
        }
      } catch (error) {
        console.warn('Failed to get user data from MiniKit SDK:', error)
        // Continue without author data if SDK is not available
      }

      // Step 1: Create post in database
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // In production, get token from miniapp SDK
          // Authorization: `Bearer ${await sdk.quickAuth.getToken()}`,
        },
        body: JSON.stringify({
          text: text.trim(),
          authorAddress: address,
          author: authorData,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('API Error:', errorData)
        throw new Error(errorData.error || 'Failed to create post')
      }

      const { id, metadataUri } = await response.json()
      setPendingPostId(id)
      setMintStatus('minting')

      // Step 2: Mint NFT
      writeContract(
        {
          address: contractAddress,
          abi: contractABI,
          functionName: 'mintTo',
          args: [address as Address, metadataUri],
        },
        {
          onSuccess: async (txHash) => {
            // Wait for transaction confirmation
            // The useWaitForTransactionReceipt hook will handle this
          },
          onError: (error) => {
            console.error('Mint error:', error)
            setMintStatus('error')
            setIsSubmitting(false)
          },
        }
      )
    } catch (error) {
      console.error('Post creation error:', error)
      setMintStatus('error')
      setIsSubmitting(false)
      // Show error message to user
      alert(error instanceof Error ? error.message : 'Failed to create post. Please check database configuration.')
    }
  }

  // Store postId for updating after mint
  const [pendingPostId, setPendingPostId] = useState<string | null>(null)

  // Handle transaction confirmation
  useEffect(() => {
    if (isSuccess && mintStatus === 'minting' && hash && pendingPostId) {
      // Extract tokenId from Transfer event or contract state
      const extractTokenId = async () => {
        try {
          const { createPublicClient, http, parseEventLogs } = await import('viem')
          const { base, baseSepolia } = await import('wagmi/chains')
          const { contractAddress, contractABI } = await import('@/lib/onchain')
          
          const chain = process.env.NEXT_PUBLIC_BASE_RPC_URL?.includes('sepolia')
            ? baseSepolia
            : base

          const client = createPublicClient({
            chain,
            transport: http(process.env.NEXT_PUBLIC_BASE_RPC_URL),
          })

          const receipt = await client.getTransactionReceipt({ hash })
          
          // Try to parse Transfer event to get tokenId
          let tokenId: number | null = null
          try {
            const parsed = parseEventLogs({
              abi: contractABI,
              logs: receipt.logs,
              eventName: 'Transfer',
            })
            if (parsed.length > 0 && parsed[0].args.tokenId) {
              tokenId = Number(parsed[0].args.tokenId)
            }
          } catch (e) {
            // Event parsing failed, use fallback
          }

          // Fallback: read nextTokenId and subtract 1
          if (!tokenId) {
            const nextId = await client.readContract({
              address: contractAddress,
              abi: contractABI,
              functionName: 'nextTokenId',
            })
            tokenId = Number(nextId) - 1 // Last minted token
          }

          // Update post with tokenId
          await fetch(`/api/posts/${pendingPostId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              mintStatus: 'success',
              tokenId,
            }),
          })

          setMintStatus('success')
          setText('')
          setIsSubmitting(false)
          setPendingPostId(null)
          onPostCreated()
          setTimeout(() => setMintStatus('idle'), 2000)
        } catch (error) {
          console.error('Failed to extract tokenId:', error)
          setMintStatus('error')
          setIsSubmitting(false)
        }
      }

      extractTokenId()
    }
  }, [isSuccess, hash, mintStatus, pendingPostId, onPostCreated])

  const remainingChars = 280 - text.length
  const canSubmit = text.trim().length > 0 && text.length <= 280 && !isSubmitting && address

  return (
    <div className="mb-4">
      <form onSubmit={handleSubmit} className="pixel-card">
        <div className="flex flex-col gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What's on your mind? (max 280 chars)"
            maxLength={280}
            className="pixel-input w-full resize-none"
            disabled={isSubmitting}
            style={{ 
              fontSize: '16px', 
              lineHeight: '1.4',
              transform: 'scale(0.625)',
              transformOrigin: 'left top',
              width: '160%',
              minHeight: '80px', // Увеличено
              maxHeight: '160px', // Увеличено
            }}
          />
          <div className="flex items-center justify-between">
            <span className={`text-xs ${remainingChars < 20 ? 'text-pixel-yellow' : ''}`}>
              {remainingChars} chars
            </span>
            <div className="flex items-center gap-2">
              {mintStatus === 'minting' && (
                <span className="text-xs text-pixel-teal">Minting...</span>
              )}
              {mintStatus === 'success' && (
                <span className="text-xs text-pixel-yellow">✓ Minted!</span>
              )}
              {mintStatus === 'error' && (
                <span className="text-xs text-red-500">✗ Error</span>
              )}
            </div>
          </div>
        </div>
      </form>
      <button
        type="button"
        onClick={() => handleSubmit()}
        disabled={!canSubmit}
        className="pixel-button w-full mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Publishing...' : 'Publish'}
      </button>
    </div>
  )
}

