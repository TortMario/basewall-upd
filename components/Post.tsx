'use client'

import { useState, useEffect } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { AvatarName } from './AvatarName'
import { Address } from 'viem'
import { getBaseExplorerUrl, contractAddress } from '@/lib/onchain'

interface Post {
  id: string
  text: string
  authorAddress: string
  createdAt: string
  tokenId: number | null
  tokenUri: string | null
  mintStatus: 'pending' | 'success' | 'failed'
  likes: number
  dislikes: number
}

interface PostProps {
  post: Post
  userReaction?: 'like' | 'dislike' | null
  onReaction: (postId: string, type: 'like' | 'dislike') => void
  onEdit: (post: Post) => void
  onDelete: (postId: string) => void
  currentOwner?: Address
}

export function Post({
  post,
  userReaction,
  onReaction,
  onEdit,
  onDelete,
  currentOwner,
}: PostProps) {
  const { address } = useAccount()
  const chainId = useChainId()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const ownerAddress = (currentOwner || post.authorAddress) as Address
  const canEdit = address && ownerAddress.toLowerCase() === address.toLowerCase()

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true)
      return
    }

    setIsDeleting(true)
    try {
      await fetch(`/api/posts/${post.id}`, {
        method: 'DELETE',
        headers: {
          // Authorization: `Bearer ${await sdk.quickAuth.getToken()}`,
        },
      })
      onDelete(post.id)
    } catch (error) {
      console.error('Delete error:', error)
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleProfileClick = () => {
    // Open profile in Base App
    if (typeof window !== 'undefined' && (window as any).farcaster?.sdk) {
      ;(window as any).farcaster.sdk.actions.openUrl(
        `https://base.org/profile/${ownerAddress}`
      )
    }
  }

  const explorerUrl = post.tokenId
    ? getBaseExplorerUrl(chainId, contractAddress, post.tokenId)
    : null

  return (
    <article className="pixel-card mb-4 bg-white">
      <div className="flex items-start justify-between mb-2">
        <AvatarName address={ownerAddress} onClick={handleProfileClick} />
        <div className="flex items-center gap-2">
          {post.mintStatus === 'pending' && (
            <span className="text-xs text-pixel-yellow">Minting...</span>
          )}
          {post.mintStatus === 'success' && post.tokenId && (
            <a
              href={explorerUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-pixel-teal hover:underline"
            >
              #{post.tokenId}
            </a>
          )}
          {post.mintStatus === 'failed' && (
            <span className="text-xs text-red-500">Mint failed</span>
          )}
        </div>
      </div>

      <p className="mb-3 text-sm whitespace-pre-wrap break-words text-black">{post.text}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onReaction(post.id, 'like')}
            className={`flex items-center gap-1 text-xs pixel-button ${
              userReaction === 'like' ? 'bg-pixel-yellow' : ''
            }`}
          >
            <span>▲</span>
            <span>{post.likes}</span>
          </button>
          <button
            onClick={() => onReaction(post.id, 'dislike')}
            className={`flex items-center gap-1 text-xs pixel-button ${
              userReaction === 'dislike' ? 'bg-red-600' : ''
            }`}
          >
            <span>▼</span>
            <span>{post.dislikes}</span>
          </button>
        </div>

        {canEdit && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(post)}
              className="text-xs pixel-button"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-xs pixel-button bg-red-600 disabled:opacity-50"
            >
              {showDeleteConfirm ? 'Confirm?' : 'Delete'}
            </button>
          </div>
        )}
      </div>

      <div className="mt-2 text-[10px] text-gray-500">
        {new Date(post.createdAt).toLocaleString()}
      </div>
    </article>
  )
}

