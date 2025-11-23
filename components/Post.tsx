'use client'

import { useState, useEffect } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { AvatarName } from './AvatarName'
import { Address } from 'viem'
import { getBaseExplorerUrl, contractAddress } from '@/lib/onchain'
import { useName } from '@coinbase/onchainkit'

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
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(post.text)

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

  return (
    <div className="mb-4 relative">
      <article className="pixel-card bg-white" style={{ minHeight: 'auto', paddingBottom: '60px' }}>
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

            <div className="flex items-center justify-between">
              {canEdit && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleEditClick}
                    className="text-xs pixel-button px-2 py-1"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="text-xs pixel-button bg-red-600 disabled:opacity-50 px-2 py-1"
                  >
                    {showDeleteConfirm ? 'Confirm?' : 'Delete'}
                  </button>
                </div>
              )}
              <div className="text-[10px] text-gray-500 text-right">
                {new Date(post.createdAt).toLocaleString()}
              </div>
            </div>
          </>
        )}
      </article>
      
      {/* Кнопки рейтинга вне рамки, в правом нижнем углу */}
      <div className="absolute bottom-0 right-0 flex items-center gap-1">
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
    </div>
  )
}

