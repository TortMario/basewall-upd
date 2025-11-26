'use client'

import Image from 'next/image'
import { Address } from 'viem'

interface Author {
  fid?: number
  username?: string
  displayName?: string
  pfp?: string
  address?: string
}

interface AvatarNameProps {
  address?: Address | string
  author?: Author
  onClick?: () => void
  size?: 'sm' | 'md' | 'lg'
}

export function AvatarName({ address, author, onClick, size = 'md' }: AvatarNameProps) {
  const pfp = author?.pfp
  const displayName = author?.displayName || author?.username
  const fid = author?.fid

  // Determine avatar fallback text
  const getAvatarText = () => {
    if (fid) return `F${fid}`
    if (address) {
      const addr = typeof address === 'string' ? address : address
      return addr.slice(2, 4).toUpperCase()
    }
    return '?'
  }

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-xs',
    lg: 'w-12 h-12 text-sm',
  }

  const displayText = displayName || (fid ? `F${fid}` : address ? `${typeof address === 'string' ? address : address}`.slice(0, 6) : 'User')

  return (
    <div
      className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity"
      onClick={onClick}
    >
      <div className={`pixel-border rounded-full overflow-hidden bg-white flex-shrink-0 ${sizeClasses[size]} flex items-center justify-center`}>
        {pfp ? (
          <Image 
            src={pfp}
            alt={displayName || 'Avatar'}
            width={size === 'sm' ? 32 : size === 'lg' ? 48 : 40}
            height={size === 'sm' ? 32 : size === 'lg' ? 48 : 40}
            className="w-full h-full object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs">
            {getAvatarText()}
          </div>
        )}
      </div>
      <span className="text-xs text-black font-semibold mt-1 text-center max-w-[60px] truncate">{displayText}</span>
    </div>
  )
}

