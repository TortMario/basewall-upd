'use client'

import { Address } from 'viem'

interface Author {
  fid?: number
  username?: string
  displayName?: string
  pfp?: string
  address: string
}

interface AvatarNameProps {
  address: Address
  author?: Author
  onClick?: () => void
}

export function AvatarName({ address, author, onClick }: AvatarNameProps) {
  // Use Base App pfp if available, otherwise fallback to address-based avatar
  const pfp = author?.pfp
  const displayName = author?.displayName || author?.username
  const username = author?.username

  return (
    <div
      className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
      onClick={onClick}
    >
      <div className="pixel-border rounded-full overflow-hidden bg-white flex-shrink-0 w-10 h-10 flex items-center justify-center">
        {pfp ? (
          <img 
            src={pfp}
            alt={displayName || username || 'Avatar'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs">
            {address.slice(2, 4).toUpperCase()}
          </div>
        )}
      </div>
      <div className="flex flex-col min-w-0">
        {displayName ? (
          <span className="text-xs text-black">{displayName}</span>
        ) : username ? (
          <span className="text-xs text-black">@{username}</span>
        ) : (
          <span className="text-xs text-black">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        )}
        <span className="text-[10px] text-gray-500">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
      </div>
    </div>
  )
}

