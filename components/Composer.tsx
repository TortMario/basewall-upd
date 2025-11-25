'use client'

import { useState, useEffect } from 'react'
import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { contractABI, contractAddress } from '@/lib/onchain'
import { Address } from 'viem'
import { base, baseSepolia } from 'wagmi/chains'
import { sdk } from '@farcaster/miniapp-sdk'

interface ComposerProps {
  onPostCreated: () => void
}

export function Composer({ onPostCreated }: ComposerProps) {
  const [text, setText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mintStatus, setMintStatus] = useState<'idle' | 'creating' | 'minting' | 'success' | 'error'>('idle')
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const { writeContract, data: hash, error: writeError, isPending: isWriting } = useWriteContract()
  const { isLoading: isConfirming, isSuccess, error: receiptError } = useWaitForTransactionReceipt({
    hash,
  })

  // Determine target chain (Base mainnet or Sepolia)
  // Check RPC URL to determine which network we should use
  const rpcUrl = typeof window !== 'undefined' 
    ? (process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org')
    : 'https://mainnet.base.org'
  const isMainnet = !rpcUrl.includes('sepolia')
  const targetChain = isMainnet ? base : baseSepolia
  const isCorrectChain = chainId === targetChain.id

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!text.trim() || !address || text.length > 280) return

    // Check wallet connection
    if (!isConnected || !address) {
      alert('Please connect your wallet first')
      return
    }

    // Check if we're on the correct network
    if (!isCorrectChain && switchChain) {
      try {
        await switchChain({ chainId: targetChain.id })
        // Wait a bit for chain switch
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        console.error('Failed to switch chain:', error)
        alert(`Please switch to ${targetChain.name} network`)
        return
      }
    }

    setIsSubmitting(true)
    setMintStatus('creating')

    try {
      // Get user data from Base App via Mini App SDK context
      let authorData = null
      try {
        const isInMiniApp = await sdk.isInMiniApp()
        if (isInMiniApp) {
          const context = await sdk.context
          if (context?.user) {
            const user = context.user
            authorData = {
              fid: user.fid ?? null,
              username: user.username || null,
              displayName: user.displayName || null,
              pfp: user.pfpUrl && user.pfpUrl.trim() !== '' ? user.pfpUrl : null,
              address: address, // Use address from wagmi useAccount
            }
          }
        }
      } catch (error) {
        console.warn('Failed to get user data from Mini App SDK context:', error)
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
      
      if (!id || !metadataUri) {
        throw new Error('Invalid response from server: missing id or metadataUri')
      }

      setPendingPostId(id)
      setMintStatus('minting')

      // Validate contract address
      if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
        throw new Error('Contract address not configured. Please set NEXT_PUBLIC_CONTRACT_ADDRESS in environment variables.')
      }

      if (!contractABI) {
        throw new Error('Contract ABI not loaded')
      }

      // Ensure we're on the correct chain before minting
      if (chainId !== targetChain.id) {
        throw new Error(`Please switch to ${targetChain.name} network`)
      }

      // Mint NFT - in wagmi v2, writeContract is called directly
      console.log('Minting NFT with:', { contractAddress, address, metadataUri, chainId })
      
      // Ensure contract address is valid
      if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
        throw new Error('Invalid contract address')
      }

      // Call writeContract - this will trigger the transaction
      try {
        writeContract({
          address: contractAddress,
          abi: contractABI,
          functionName: 'mintTo',
          args: [address as Address, metadataUri],
        })
        console.log('writeContract called successfully')
      } catch (error) {
        console.error('Error calling writeContract:', error)
        throw error
      }
    } catch (error) {
      console.error('Post creation error:', error)
      setMintStatus('error')
      setIsSubmitting(false)
      alert(error instanceof Error ? error.message : 'Failed to create post')
    }
  }

  // Store postId for updating after mint
  const [pendingPostId, setPendingPostId] = useState<string | null>(null)

  // Monitor when writeContract is actually called and hash is generated
  useEffect(() => {
    if (hash && mintStatus === 'minting') {
      console.log('Transaction hash received:', hash)
      setMintStatus('minting') // Ensure status is still minting
    }
  }, [hash, mintStatus])

  // Handle write errors
  useEffect(() => {
    if (writeError && mintStatus === 'minting') {
      console.error('Mint transaction error:', writeError)
      setMintStatus('error')
      setIsSubmitting(false)
      setPendingPostId(null)
      const errorMessage = writeError.message || 'Unknown error'
      console.error('Full error details:', writeError)
      alert(`Mint failed: ${errorMessage}. Please check your wallet connection and network.`)
    }
  }, [writeError, mintStatus])

  // Handle receipt errors
  useEffect(() => {
    if (receiptError && mintStatus === 'minting') {
      console.error('Transaction receipt error:', receiptError)
      setMintStatus('error')
      setIsSubmitting(false)
      setPendingPostId(null)
      alert(`Transaction failed: ${receiptError.message || 'Unknown error'}`)
    }
  }, [receiptError, mintStatus])

  // Handle transaction confirmation
  useEffect(() => {
    if (isSuccess && mintStatus === 'minting' && hash && pendingPostId) {
      const extractTokenId = async () => {
        try {
          console.log('Transaction confirmed, extracting tokenId from hash:', hash)
          const { createPublicClient, http, parseEventLogs } = await import('viem')
          const { base, baseSepolia } = await import('wagmi/chains')
          const { contractAddress, contractABI } = await import('@/lib/onchain')
          
          const chain = process.env.NEXT_PUBLIC_BASE_RPC_URL?.includes('sepolia')
            ? baseSepolia
            : base

          const rpcUrl = typeof window !== 'undefined'
            ? (process.env.NEXT_PUBLIC_BASE_RPC_URL || (isMainnet ? 'https://mainnet.base.org' : 'https://sepolia.base.org'))
            : (isMainnet ? 'https://mainnet.base.org' : 'https://sepolia.base.org')
          
          const client = createPublicClient({
            chain,
            transport: http(rpcUrl),
          })

          console.log('Fetching transaction receipt...')
          const receipt = await client.getTransactionReceipt({ hash })
          console.log('Transaction receipt received:', receipt)
          
          // Try to parse Transfer event to get tokenId
          let tokenId: number | null = null
          try {
            const parsed = parseEventLogs({
              abi: contractABI,
              logs: receipt.logs,
              eventName: 'Transfer',
            })
            console.log('Parsed Transfer events:', parsed)
            if (parsed.length > 0 && parsed[0].args.tokenId) {
              tokenId = Number(parsed[0].args.tokenId)
              console.log('TokenId from Transfer event:', tokenId)
            }
          } catch (e) {
            console.warn('Event parsing failed, using fallback:', e)
          }

          // Fallback: read nextTokenId and subtract 1
          if (!tokenId) {
            console.log('Using fallback method to get tokenId')
            const nextId = await client.readContract({
              address: contractAddress,
              abi: contractABI,
              functionName: 'nextTokenId',
            })
            tokenId = Number(nextId) - 1 // Last minted token
            console.log('TokenId from nextTokenId fallback:', tokenId)
          }

          if (!tokenId || tokenId < 1) {
            throw new Error('Failed to extract valid tokenId from transaction')
          }

          console.log('Updating post with tokenId:', tokenId)
          // Update post with tokenId
          const updateResponse = await fetch(`/api/posts/${pendingPostId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              mintStatus: 'success',
              tokenId,
            }),
          })

          if (!updateResponse.ok) {
            throw new Error('Failed to update post with tokenId')
          }

          console.log('Post updated successfully')
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
          setPendingPostId(null)
          alert(`Transaction confirmed but failed to extract tokenId: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      extractTokenId()
    }
  }, [isSuccess, hash, mintStatus, pendingPostId, onPostCreated, isMainnet])

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
              {!isConnected && (
                <span className="text-xs text-pixel-yellow">Connect wallet</span>
              )}
              {isConnected && !isCorrectChain && (
                <span className="text-xs text-pixel-yellow">Switch to {targetChain.name}</span>
              )}
              {mintStatus === 'creating' && (
                <span className="text-xs text-pixel-teal">Creating post...</span>
              )}
              {(mintStatus === 'minting' || isWriting || isConfirming) && (
                <span className="text-xs text-pixel-teal">
                  {isWriting ? 'Sending transaction...' : isConfirming ? 'Confirming...' : 'Minting...'}
                </span>
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
        className="pixel-button w-full mt-2 disabled:opacity-50 disabled:cursor-not-allowed bg-blue-300 hover:bg-blue-400"
      >
        {isSubmitting ? 'Publishing...' : 'Publish'}
      </button>
    </div>
  )
}

