'use client'

import { useState } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'

interface ComposerProps {
  onPostCreated: () => void
}

export function Composer({ onPostCreated }: ComposerProps) {
  const [text, setText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!text.trim() || text.length > 280) return

    setIsSubmitting(true)
    setError(null)

    try {
      let authorData = null
      let fid: number | null = null
      
      try {
        const isInMiniApp = await sdk.isInMiniApp()
        if (isInMiniApp) {
          const context = await sdk.context
          if (context?.user) {
            const user = context.user
            fid = user.fid ?? null
            authorData = {
              fid: user.fid ?? null,
              username: user.username || null,
              displayName: user.displayName || null,
              pfp: user.pfpUrl && user.pfpUrl.trim() !== '' ? user.pfpUrl : null,
              address: null,
            }
          }
        }
      } catch {
        throw new Error('Please use Base App to create posts')
      }

      if (!fid) {
        throw new Error('Unable to identify user. Please use Base App.')
      }

      const checkResponse = await fetch(`/api/posts/check?fid=${fid}`)
      const checkData = await checkResponse.json()
      
      if (!checkData.canPost) {
        const hoursLeft = checkData.hoursLeft || 0
        const minutesLeft = checkData.minutesLeft || 0
        if (hoursLeft > 0) {
          throw new Error(`You can post again in ${hoursLeft} hour${hoursLeft > 1 ? 's' : ''}`)
        } else if (minutesLeft > 0) {
          throw new Error(`You can post again in ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}`)
        } else {
          throw new Error('You can only post once per 24 hours')
        }
      }

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), author: authorData, fid }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to create post')
      }

      const result = await response.json()
      
      if (result.id) {
        setText('')
        onPostCreated()
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create post')
    } finally {
      setIsSubmitting(false)
    }
  }

  const remainingChars = 280 - text.length
  const canSubmit = text.trim().length > 0 && text.length <= 280 && !isSubmitting

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="bg-pixel-gray border-2 border-pixel-dark rounded-lg p-4">
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setError(null)
          }}
          placeholder="What's on your mind?"
          className="w-full bg-transparent text-white placeholder-pixel-light resize-none outline-none mb-3"
          rows={4}
          maxLength={280}
          disabled={isSubmitting}
        />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`text-xs ${remainingChars < 20 ? 'text-red-500' : 'text-pixel-light'}`}>
              {remainingChars}
            </span>
            {error && <span className="text-xs text-red-500">{error}</span>}
            {isSubmitting && <span className="text-xs text-pixel-teal">Creating post...</span>}
          </div>
          
          <button
            type="submit"
            disabled={!canSubmit}
            className={`px-4 py-2 rounded border-2 font-bold transition-colors ${
              canSubmit
                ? 'bg-pixel-yellow text-pixel-dark border-pixel-dark hover:bg-pixel-yellow/80'
                : 'bg-pixel-gray text-pixel-light border-pixel-dark cursor-not-allowed'
            }`}
          >
            Post
          </button>
        </div>
      </div>
    </form>
  )
}
