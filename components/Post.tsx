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
  currentUserAddress?: string
}

const ADMIN_USERNAME = process.env.NEXT_PUBLIC_ADMIN_USERNAME || 'mynameisthe'
const ADMIN_ADDRESS = process.env.NEXT_PUBLIC_ADMIN_ADDRESS || '0xCdBBdba01063a3A82f1D72Fb601fedFCff808183'
const ADMIN_FID = process.env.NEXT_PUBLIC_ADMIN_FID ? parseInt(process.env.NEXT_PUBLIC_ADMIN_FID, 10) : undefined
const ADMIN_PROFILE_URL = `https://base.app/profile/${ADMIN_USERNAME}`

export function Post({
  post,
  userReaction,
  onReaction,
  onEdit,
  onDelete,
  currentUserFid,
  currentUserUsername,
  currentUserAddress,
}: PostProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(post.text)
  const [isHighlighting, setIsHighlighting] = useState(false)
  const [isHiding, setIsHiding] = useState(false)

  const author = post.author || { address: post.authorAddress }
  const canEdit = currentUserFid && post.author?.fid === currentUserFid
  
  // Check admin by FID, username, or address
  // Normalize username: remove @ prefix and compare case-insensitive
  const normalizedUsername = currentUserUsername?.replace(/^@/, '').toLowerCase()
  const normalizedAdminUsername = ADMIN_USERNAME.replace(/^@/, '').toLowerCase()
  
  // Check admin by FID (most reliable), username, or address
  const currentUserIsAdmin = 
    (ADMIN_FID && currentUserFid && currentUserFid === ADMIN_FID) ||
    (normalizedUsername && normalizedUsername === normalizedAdminUsername) || 
    (currentUserAddress && currentUserAddress.toLowerCase() === ADMIN_ADDRESS.toLowerCase())
  
  // Debug: log admin check (always log for debugging)
  if (typeof window !== 'undefined') {
    console.log('🔍 Admin check:', {
      currentUserFid,
      ADMIN_FID,
      currentUserUsername,
      normalizedUsername,
      ADMIN_USERNAME,
      normalizedAdminUsername,
      currentUserAddress,
      ADMIN_ADDRESS,
      isAdmin: currentUserIsAdmin,
      checkByFid: ADMIN_FID && currentUserFid && currentUserFid === ADMIN_FID,
      checkByUsername: normalizedUsername && normalizedUsername === normalizedAdminUsername,
      checkByAddress: currentUserAddress && currentUserAddress.toLowerCase() === ADMIN_ADDRESS.toLowerCase()
    })
  }
  
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
      const params = new URLSearchParams({
        fid: (currentUserFid || 0).toString(),
        username: currentUserUsername || '',
        ...(currentUserAddress && { address: currentUserAddress })
      })
      const response = await fetch(`/api/posts/${post.id}?${params.toString()}`, { 
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
      const params = new URLSearchParams({
        username: currentUserUsername || '',
        ...(currentUserFid && { fid: currentUserFid.toString() }),
        ...(currentUserAddress && { address: currentUserAddress })
      })
      const response = await fetch(`/api/posts/${post.id}/highlight?${params.toString()}`, {
        method: 'PUT'
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        const errorMessage = errorData.error || 'Failed to highlight post'
        console.error('Highlight error:', errorMessage, { username: currentUserUsername, params: params.toString() })
        throw new Error(errorMessage)
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
      const params = new URLSearchParams({
        username: currentUserUsername || '',
        ...(currentUserFid && { fid: currentUserFid.toString() }),
        ...(currentUserAddress && { address: currentUserAddress })
      })
      const response = await fetch(`/api/posts/${post.id}/hide?${params.toString()}`, {
        method: 'PUT'
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        const errorMessage = errorData.error || 'Failed to hide post'
        console.error('Hide error:', errorMessage, { username: currentUserUsername, params: params.toString() })
        throw new Error(errorMessage)
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
  const isHidden = post.isHidden || false
  const isAuthorOfHiddenPost = isAuthor && isHidden
  const isAdminViewingHidden = currentUserIsAdmin && isHidden && !isAuthor

  const displayName = author?.displayName || author?.username
  const truncatedName = displayName && displayName.length > 15 
    ? `${displayName.slice(0, 15)}...` 
    : displayName

  return (
    <div className={`mb-6 ${isAdminViewingHidden ? 'opacity-50' : ''}`}>
      <div className="flex items-start gap-3">
        {/* Avatar only */}
        <div className="flex flex-col">
          <button
            onClick={handleProfileClick}
            className="flex-shrink-0 hover:opacity-80 transition-opacity"
          >
            <div className="pixel-border rounded-full overflow-hidden bg-white flex-shrink-0 w-16 h-16 flex items-center justify-center">
              {author?.pfp ? (
                <img 
                  src={author.pfp}
                  alt={truncatedName || 'Avatar'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs">
                  {author?.fid ? `F${author.fid}` : '?'}
                </div>
              )}
            </div>
          </button>
        </div>
        
        {/* Name and frame container - aligned to left */}
        <div className="flex-1 relative">
          <div className="absolute top-0 right-0 text-xs text-gray-500">
            {formatDate(post.createdAt)}
          </div>
          
          {/* Name at top, aligned with avatar top */}
          {truncatedName && (
            <div className="mb-1">
              <button
                onClick={handleProfileClick}
                className="text-sm text-black font-semibold leading-tight whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px] hover:opacity-80 transition-opacity"
              >
                {truncatedName}
              </button>
            </div>
          )}
          
          {/* Frame starts below the name, left edge aligns with name start */}
          <div className="relative">
            <div className={`border-3 border-black rounded-lg shadow-lg relative ${
              isHighlighted ? 'bg-gradient-to-br from-yellow-100 to-yellow-200 border-yellow-400' : 
              isAuthor ? 'bg-lime-100' : 'bg-white'
            } ${isAuthorOfHiddenPost ? 'border-gray-400' : ''}`} style={{ 
              paddingTop: '10px',
              paddingRight: '35px',
              paddingBottom: '35px',
              paddingLeft: '10px'
            }}>
              
              {currentUserIsAdmin && !canEdit && (
                <div className="absolute top-2 right-2">
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="text-red-500 hover:text-red-700 text-sm disabled:opacity-50 px-2 py-1 font-bold"
                      title="Admin: Delete any post"
                    >
                      {showDeleteConfirm ? (isDeleting ? 'Deleting...' : 'Confirm?') : '🗑️'}
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
                <div className="relative">
                  {isAuthorOfHiddenPost && (
                    <div className="absolute -top-2 -right-2 bg-gray-400 text-white rounded-full p-1 text-xs" title="This post is hidden">
                      🔒
                    </div>
                  )}
                <p className="text-black text-sm leading-relaxed whitespace-pre-wrap break-words">{post.text}</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-1 overflow-visible relative z-10">
            {!isAuthor && (
              <>
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
              </>
            )}
            {isAuthor && !isEditing && (
              <>
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
              </>
            )}
            {currentUserIsAdmin && (
              <>
                <button
                  onClick={handleHighlight}
                  disabled={isHighlighting}
                  className={`flex items-center gap-1.5 text-base disabled:opacity-50 font-bold transition-colors ${
                    isHighlighted ? 'text-yellow-600' : 'text-gray-400 hover:text-yellow-500'
                  }`}
                  title={isHighlighted ? 'Remove highlight' : 'Highlight post (gold)'}
                >
                  <span className="text-xl">{isHighlighting ? '...' : '⭐'}</span>
                </button>
                <button
                  onClick={handleHide}
                  disabled={isHiding}
                  className="flex items-center gap-1.5 text-base disabled:opacity-50 font-bold text-gray-500 hover:text-gray-700 transition-colors"
                  title="Hide post (moderation)"
                >
                  <span className="text-xl">{isHiding ? '...' : '👁️'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
