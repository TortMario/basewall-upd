'use client'

import { useState, useEffect } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { AvatarName } from './AvatarName'
import { Address } from 'viem'
import { getBaseExplorerUrl, contractAddress, contractABI } from '@/lib/onchain'

interface Author {
  fid?: number
  username?: string
  displayName?: string
  pfp?: string
  address: string
}

interface Post {
  id: string
  text: string
  authorAddress: string
  author?: Author
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
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(post.text)
  const { writeContract, data: burnHash } = useWriteContract()
  const { isLoading: isBurning, isSuccess: isBurnSuccess } = useWaitForTransactionReceipt({
    hash: burnHash,
  })

  const ownerAddress = (currentOwner || post.authorAddress) as Address
  const canEdit = address && ownerAddress.toLowerCase() === address.toLowerCase()
  const author = post.author || { address: post.authorAddress }

  const handlePostDelete = async () => {
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

  // Handle NFT burn after transaction success
  useEffect(() => {
    if (isBurnSuccess && post.tokenId) {
      // After NFT is burned, delete the post
      handlePostDelete()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBurnSuccess, post.tokenId])

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true)
      return
    }

    setIsDeleting(true)

    // If post has an NFT, burn it first
    if (post.tokenId && post.mintStatus === 'success') {
      console.log('Calling writeContract to burn NFT:', { tokenId: post.tokenId })
      writeContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'burn',
        args: [BigInt(post.tokenId)],
      })
      // Errors will be handled via writeError in useEffect
    } else {
      // No NFT to burn, just delete the post
      await handlePostDelete()
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

  const handleEditClick = () => {
    setIsEditing(true)
    setEditText(post.text)
  }

  const handleEditSave = async () => {
    try {
      await fetch(`/api/posts/${post.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: editText }),
      })
      setIsEditing(false)
      onEdit({ ...post, text: editText })
    } catch (error) {
      console.error('Edit error:', error)
    }
  }

  const handleEditCancel = () => {
    setIsEditing(false)
    setEditText(post.text)
  }

  const explorerUrl = post.tokenId
    ? getBaseExplorerUrl(chainId, contractAddress, post.tokenId)
    : null

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    const dateStr = date.toLocaleDateString()
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    return `${dateStr} ${timeStr}`
  }

  return (
    <div className="mb-4">
      <article className="pixel-card bg-white">
        <div className="flex items-start justify-between mb-2">
          <AvatarName 
            address={ownerAddress} 
            author={author}
            onClick={handleProfileClick} 
          />
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

        {isEditing ? (
          <div className="mb-2">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              maxLength={280}
              className="pixel-input w-full resize-none mb-2"
              style={{ 
                fontSize: '16px', 
                lineHeight: '1.4',
                transform: 'scale(0.625)',
                transformOrigin: 'left top',
                width: '160%',
                minHeight: '48px',
                maxHeight: '96px',
              }}
            />
            <div className="flex gap-2">
              <button
                onClick={handleEditSave}
                className="text-xs pixel-button px-2 py-1"
              >
                Save
              </button>
              <button
                onClick={handleEditCancel}
                className="text-xs pixel-button bg-gray-600 px-2 py-1"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="mb-2 text-sm whitespace-pre-wrap break-words text-black">{post.text}</p>

            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                {canEdit && (
                  <>
                    <button
                      onClick={handleEditClick}
                      className="text-xs pixel-button px-2 py-1"
                    >
                      Edit
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting || isBurning}
                      className="text-xs pixel-button bg-red-600 disabled:opacity-50 px-2 py-1"
                    >
                      {isBurning ? 'Burning...' : showDeleteConfirm ? 'Confirm?' : 'Delete'}
                    </button>
                  </>
                )}
              </div>
              <div className="text-[10px] text-gray-500 text-right flex-shrink-0">
                {formatDateTime(post.createdAt)}
              </div>
            </div>

            {/* Кнопки рейтинга вынесены отдельно */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => onReaction(post.id, 'like')}
                className={`flex items-center gap-1 text-xs pixel-button px-2 py-1 ${
                  userReaction === 'like' ? 'bg-pixel-yellow text-black' : ''
                }`}
              >
                <span className="text-sm">▲</span>
                <span>{post.likes}</span>
              </button>
              <button
                onClick={() => onReaction(post.id, 'dislike')}
                className={`flex items-center gap-1 text-xs pixel-button px-2 py-1 ${
                  userReaction === 'dislike' ? 'bg-red-600' : ''
                }`}
              >
                <span className="text-sm">▼</span>
                <span>{post.dislikes}</span>
              </button>
            </div>
          </>
        )}
      </article>
    </div>
  )
}

