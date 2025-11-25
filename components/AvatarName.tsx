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
  const pfp = author?.pfp
  const displayName = author?.displayName || author?.username

  return (
    <div
      className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
      onClick={onClick}
    >
      <div className="pixel-border rounded-full overflow-hidden bg-white flex-shrink-0 w-10 h-10 flex items-center justify-center">
        {pfp ? (
          <img 
            src={pfp}
            alt={displayName || 'Avatar'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs">
            {address.slice(2, 4).toUpperCase()}
          </div>
        )}
      </div>
      {displayName && (
        <span className="text-sm text-black font-semibold">{displayName}</span>
      )}
    </div>
  )
}

