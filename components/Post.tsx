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
      alert(error instanceof Error ? error.message : 'Failed to delete post')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleProfileClick = async () => {
    try {
      const isInMiniApp = await sdk.isInMiniApp()
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
    } catch {
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: editText, fid: currentUserFid }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to update post')
      }

      setIsEditing(false)
      onEdit({ ...post, text: editText })
    } catch (error) {
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
    <div className="mb-6">
      <div className="flex items-start gap-3 mb-2">
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
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-gray-900 text-lg">
              {author?.displayName || author?.username || `User ${post.authorAddress.slice(0, 6)}`}
            </span>
            <span className="text-sm text-gray-500">{formatDate(post.createdAt)}</span>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="bg-white border-3 border-black rounded-lg p-4 shadow-lg relative">
          {canEdit && !isEditing && (
            <div className="absolute top-2 right-2 flex gap-2">
              <button
                onClick={handleEditClick}
                className="text-gray-600 hover:text-black text-sm px-2 py-1"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-red-500 hover:text-red-700 text-sm disabled:opacity-50 px-2 py-1"
              >
                {showDeleteConfirm ? (isDeleting ? 'Deleting...' : 'Confirm?') : 'Delete'}
              </button>
            </div>
          )}

          {isEditing ? (
            <div>
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full bg-white border-2 border-gray-300 rounded p-3 text-black resize-none text-base"
                rows={4}
                maxLength={280}
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleEditSave}
                  className="px-4 py-2 bg-yellow-400 text-black rounded font-bold hover:bg-yellow-500 border-2 border-black"
                >
                  Save
                </button>
                <button
                  onClick={handleEditCancel}
                  className="px-4 py-2 bg-gray-200 border-2 border-black text-black rounded font-bold hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-black text-base leading-relaxed whitespace-pre-wrap break-words">{post.text}</p>
          )}
        </div>
        
        <div className="absolute -bottom-2 left-8 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-white"></div>
        <div className="absolute -bottom-4 left-6 w-0 h-0 border-l-10 border-l-transparent border-r-10 border-r-transparent border-t-10 border-t-black"></div>
      </div>

      <div className="flex items-center justify-end gap-3 mt-1">
        <button
          onClick={() => onReaction(post.id, 'like')}
          className={`flex items-center gap-1.5 text-sm transition-colors ${
            userReaction === 'like'
              ? 'text-yellow-500'
              : 'text-gray-600 hover:text-yellow-500'
          }`}
        >
          <span className="text-lg">👍</span>
          <span className="font-bold">{post.likes}</span>
        </button>
        <button
          onClick={() => onReaction(post.id, 'dislike')}
          className={`flex items-center gap-1.5 text-sm transition-colors ${
            userReaction === 'dislike'
              ? 'text-red-500'
              : 'text-gray-600 hover:text-red-500'
          }`}
        >
          <span className="text-lg">👎</span>
          <span className="font-bold">{post.dislikes}</span>
        </button>
      </div>
    </div>
  )
}
