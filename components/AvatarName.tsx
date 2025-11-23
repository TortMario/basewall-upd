'use client'

import { Avatar, Name } from '@coinbase/onchainkit'
import { useAccount } from 'wagmi'
import { Address } from 'viem'
import { base } from 'wagmi/chains'

interface AvatarNameProps {
  address: Address
  onClick?: () => void
}

export function AvatarName({ address, onClick }: AvatarNameProps) {
  const { address: connectedAddress } = useAccount()

  return (
    <div
      className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
      onClick={onClick}
    >
      <div className="pixel-border rounded-full overflow-hidden bg-white">
        <Avatar 
          address={address} 
          chain={base}
          className="w-10 h-10"
        />
      </div>
      <div className="flex flex-col">
        <Name 
          address={address} 
          chain={base}
          className="text-xs text-black" 
        />
        <span className="text-[10px] text-gray-500">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
      </div>
    </div>
  )
}

