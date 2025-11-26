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
  isHighlighted?: boolean
  isHidden?: boolean
}

interface PostProps {
  post: Post
  userReaction?: 'like' | 'dislike' | null
  onReaction: (postId: string, type: 'like' | 'dislike') => void
  onEdit: (post: Post) => void
  onDelete: (postId: string) => void
  currentUserFid?: number
  currentUserUsername?: string
}

const ADMIN_USERNAME = 'mynameisthe'
const ADMIN_ADDRESS = '0xCdBBdba01063a3A82f1D72Fb601fedFCff808183'
const ADMIN_PROFILE_URL = 'https://base.app/profile/mynameisthe'

export function Post({
  post,
  userReaction,
  onReaction,
  onEdit,
  onDelete,
  currentUserFid,
  currentUserUsername,
}: PostProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(post.text)
  const [isHighlighting, setIsHighlighting] = useState(false)
  const [isHiding, setIsHiding] = useState(false)

  const author = post.author || { address: post.authorAddress }
  const canEdit = currentUserFid && post.author?.fid === currentUserFid
  const currentUserIsAdmin = currentUserUsername === ADMIN_USERNAME
  const isHighlighted = post.isHighlighted || false

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true)
      return
    }

    if (!currentUserFid && !currentUserIsAdmin) {
      alert('Please use Base App to delete posts')
      setShowDeleteConfirm(false)
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/posts/${post.id}?fid=${currentUserFid || 0}&username=${currentUserUsername || ''}`, { 
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
    
    if (!currentUserFid && !currentUserIsAdmin) {
      alert('Please use Base App to edit posts')
      setIsEditing(false)
      return
    }

    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: editText, fid: currentUserFid || 0 }),
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

  const handleHighlight = async () => {
    if (!currentUserIsAdmin) return

    setIsHighlighting(true)
    try {
      const response = await fetch(`/api/posts/${post.id}/highlight?username=${currentUserUsername || ''}`, {
        method: 'PUT'
      })
      
      if (!response.ok) {
        throw new Error('Failed to highlight post')
      }

      const updated = await response.json()
      onEdit({ ...post, isHighlighted: updated.isHighlighted })
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to highlight post')
    } finally {
      setIsHighlighting(false)
    }
  }

  const handleHide = async () => {
    if (!currentUserIsAdmin) return

    if (!window.confirm('Hide this post? It will be invisible to all users.')) {
      return
    }

    setIsHiding(true)
    try {
      const response = await fetch(`/api/posts/${post.id}/hide?username=${currentUserUsername || ''}`, {
        method: 'PUT'
      })
      
      if (!response.ok) {
        throw new Error('Failed to hide post')
      }

      onDelete(post.id)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to hide post')
      setIsHiding(false)
    }
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

  const isAuthor = canEdit

  return (
    <div className="mb-6">
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center">
          <button
            onClick={handleProfileClick}
            className="flex-shrink-0 hover:opacity-80 transition-opacity"
          >
            <AvatarName
              author={author}
              address={undefined}
              size="md"
            />
          </button>
        </div>
        
        <div className="flex-1 relative">
          <div className="absolute top-0 right-0 text-xs text-gray-500">
            {formatDate(post.createdAt)}
          </div>
          
          <div className="mt-[28px] relative">
            <div className={`border-3 border-black rounded-lg shadow-lg relative ${
              isHighlighted ? 'bg-gradient-to-br from-yellow-100 to-yellow-200 border-yellow-400' : 
              isAuthor ? 'bg-lime-100' : 'bg-white'
            } ${isAuthor ? 'ml-[-20px]' : ''}`} style={{ 
              paddingTop: '10px',
              paddingRight: '35px',
              paddingBottom: '35px',
              paddingLeft: '10px'
            }}>
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
              
              {currentUserIsAdmin && (
                <div className="absolute top-2 right-2 flex gap-2 items-center">
                  <button
                    onClick={handleHighlight}
                    disabled={isHighlighting}
                    className={`text-sm disabled:opacity-50 px-2 py-1 font-bold transition-colors ${
                      isHighlighted ? 'text-yellow-600' : 'text-gray-400 hover:text-yellow-500'
                    }`}
                    title={isHighlighted ? 'Remove highlight' : 'Highlight post (gold)'}
                  >
                    {isHighlighting ? '...' : '⭐'}
                  </button>
                  <button
                    onClick={handleHide}
                    disabled={isHiding}
                    className="text-gray-500 hover:text-gray-700 text-sm disabled:opacity-50 px-2 py-1 font-bold"
                    title="Hide post (moderation)"
                  >
                    {isHiding ? '...' : '👁️'}
                  </button>
                  {!canEdit && (
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="text-red-500 hover:text-red-700 text-sm disabled:opacity-50 px-2 py-1 font-bold"
                      title="Admin: Delete any post"
                    >
                      {showDeleteConfirm ? (isDeleting ? 'Deleting...' : 'Confirm?') : '🗑️'}
                    </button>
                  )}
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
                <p className="text-black text-sm leading-relaxed whitespace-pre-wrap break-words">{post.text}</p>
              )}
            </div>
            
            <div className={`absolute -left-2 top-4 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 ${
              isAuthor ? 'border-r-lime-100' : isHighlighted ? 'border-r-yellow-200' : 'border-r-white'
            }`}></div>
            <div className={`absolute -left-4 top-3 w-0 h-0 border-t-10 border-t-transparent border-b-10 border-b-transparent border-r-10 ${
              isHighlighted ? 'border-r-yellow-400' : 'border-r-black'
            }`}></div>
          </div>

          {!isAuthor && (
            <div className="flex items-center justify-end gap-3 mt-1 overflow-visible relative z-10">
              <button
                onClick={() => onReaction(post.id, 'like')}
                className={`flex items-center gap-1.5 text-sm transition-colors whitespace-nowrap ${
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
                className={`flex items-center gap-1.5 text-sm transition-colors whitespace-nowrap ${
                  userReaction === 'dislike'
                    ? 'text-red-500'
                    : 'text-gray-600 hover:text-red-500'
                }`}
              >
                <span className="text-lg">👎</span>
                <span className="font-bold">{post.dislikes}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
