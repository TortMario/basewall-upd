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

  const getAvatarText = () => {
    if (fid) return `F${fid}`
    if (address) {
      const addr = typeof address === 'string' ? address : address
      return addr.slice(2, 4).toUpperCase()
    }
    return '?'
  }

  const sizeClasses = {
    sm: 'w-12 h-12 text-xs',
    md: 'w-16 h-16 text-xs',
    lg: 'w-20 h-20 text-sm',
  }

  // Truncate display name to 15 characters max
  const truncatedName = displayName && displayName.length > 15 
    ? `${displayName.slice(0, 15)}...` 
    : displayName

  return (
    <div
      className="flex items-start gap-2 cursor-pointer hover:opacity-80 transition-opacity"
      onClick={onClick}
    >
      <div className={`pixel-border rounded-full overflow-hidden bg-white flex-shrink-0 ${sizeClasses[size]} flex items-center justify-center`}>
        {pfp ? (
          <Image 
            src={pfp}
            alt={truncatedName || 'Avatar'}
            width={size === 'sm' ? 48 : size === 'lg' ? 80 : 64}
            height={size === 'sm' ? 48 : size === 'lg' ? 80 : 64}
            className="w-full h-full object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs">
            {getAvatarText()}
          </div>
        )}
      </div>
      {truncatedName && (
        <span className="text-sm text-black font-semibold leading-tight whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px] pt-0">
          {truncatedName}
        </span>
      )}
    </div>
  )
}
