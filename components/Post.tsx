'use client'

import { useState } from 'react'
import { AvatarName } from './AvatarName'
import { sdk } from '@farcaster/miniapp-sdk'

interface Author {
  fid?: number
  username?: string
  displayName?: string
  pfp?: string
  address?: string
}

interface Post {
  id: string
  text: string
  authorAddress: string
  author?: Author
  createdAt: string
  likes: number
  dislikes: number
}

interface PostProps {
  post: Post
  userReaction?: 'like' | 'dislike' | null
  onReaction: (postId: string, type: 'like' | 'dislike') => void
  onEdit: (post: Post) => void
  onDelete: (postId: string) => void
  currentUserFid?: number
}

export function Post({
  post,
  userReaction,
  onReaction,
  onEdit,
  onDelete,
  currentUserFid,
}: PostProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(post.text)

  const author = post.author || { address: post.authorAddress }
  const canEdit = currentUserFid && post.author?.fid === currentUserFid

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true)
      return
    }

    if (!currentUserFid) {
      alert('Please use Base App to delete posts')
      setShowDeleteConfirm(false)
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/posts/${post.id}?fid=${currentUserFid}`, { 
        method: 'DELETE' 
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to delete post')
      }

      onDelete(post.id)
    } catch (error) {
      console.error('Delete error:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete post')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleProfileClick = async () => {
    try {
      const isInMiniApp = await sdk.isInMiniApp()
      // Use Base App profile URL format: https://base.app/profile/{username or fid}
      const profileUrl = author?.username 
        ? `https://base.app/profile/${author.username}`
        : author?.fid
        ? `https://base.app/profile/${author.fid}`
        : `https://base.app/profile/${post.authorAddress}`
      
      if (isInMiniApp) {
        await sdk.actions.openUrl(profileUrl)
      } else {
        window.open(profileUrl, '_blank')
      }
    } catch (error) {
      console.warn('Failed to open profile URL:', error)
      const profileUrl = author?.username 
        ? `https://base.app/profile/${author.username}`
        : author?.fid
        ? `https://base.app/profile/${author.fid}`
        : `https://base.app/profile/${post.authorAddress}`
      window.open(profileUrl, '_blank')
    }
  }

  const handleEditClick = () => {
    setIsEditing(true)
    setEditText(post.text)
  }

  const handleEditSave = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    if (!currentUserFid) {
      alert('Please use Base App to edit posts')
      setIsEditing(false)
      return
    }

    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: editText, fid: currentUserFid }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to update post')
      }

      const updated = await response.json()
      setIsEditing(false)
      onEdit({ ...post, text: editText })
    } catch (error) {
      console.error('Edit error:', error)
      alert(error instanceof Error ? error.message : 'Failed to update post')
    }
  }

  const handleEditCancel = () => {
    setIsEditing(false)
    setEditText(post.text)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="bg-pixel-gray border-2 border-pixel-dark rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3 mb-3">
        <button
          onClick={handleProfileClick}
          className="flex-shrink-0 hover:opacity-80 transition-opacity"
        >
          <AvatarName
            author={author}
            address={post.authorAddress || undefined}
            size="md"
          />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-white">
              {author?.displayName || author?.username || `User ${post.authorAddress.slice(0, 6)}`}
            </span>
            <span className="text-xs text-pixel-light">
              {formatDate(post.createdAt)}
            </span>
          </div>
          {isEditing ? (
            <div className="mt-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full bg-pixel-dark border border-pixel-light rounded p-2 text-white resize-none"
                rows={3}
                maxLength={280}
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleEditSave}
                  className="px-3 py-1 bg-pixel-yellow text-pixel-dark rounded font-bold text-sm hover:bg-pixel-yellow/80"
                >
                  Save
                </button>
                <button
                  onClick={handleEditCancel}
                  className="px-3 py-1 bg-pixel-gray border border-pixel-light text-white rounded font-bold text-sm hover:bg-pixel-dark"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-white whitespace-pre-wrap break-words">{post.text}</p>
          )}
        </div>
        {canEdit && !isEditing && (
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={handleEditClick}
              className="text-pixel-light hover:text-white text-sm"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-red-500 hover:text-red-400 text-sm disabled:opacity-50"
            >
              {showDeleteConfirm ? (isDeleting ? 'Deleting...' : 'Confirm?') : 'Delete'}
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 pt-3 border-t border-pixel-dark">
        <button
          onClick={() => onReaction(post.id, 'like')}
          className={`flex items-center gap-1 text-sm transition-colors ${
            userReaction === 'like'
              ? 'text-pixel-yellow'
              : 'text-pixel-light hover:text-pixel-yellow'
          }`}
        >
          <span>👍</span>
          <span>{post.likes}</span>
        </button>
        <button
          onClick={() => onReaction(post.id, 'dislike')}
          className={`flex items-center gap-1 text-sm transition-colors ${
            userReaction === 'dislike'
              ? 'text-red-500'
              : 'text-pixel-light hover:text-red-500'
          }`}
        >
          <span>👎</span>
          <span>{post.dislikes}</span>
        </button>
      </div>
    </div>
  )
}
