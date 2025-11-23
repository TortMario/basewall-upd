'use client'

import { Avatar, Name } from '@coinbase/onchainkit'
import { Address } from 'viem'

interface AvatarNameProps {
  address: Address
  onClick?: () => void
}

export function AvatarName({ address, onClick }: AvatarNameProps) {
  return (
    <div
      className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
      onClick={onClick}
    >
      <div className="pixel-border rounded-full overflow-hidden bg-white flex-shrink-0 w-10 h-10 flex items-center justify-center">
        <Avatar 
          address={address}
          className="w-full h-full"
        />
      </div>
      <div className="flex flex-col min-w-0">
        <Name 
          address={address}
          className="text-xs text-black" 
        />
        <span className="text-[10px] text-gray-500">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
      </div>
    </div>
  )
}

