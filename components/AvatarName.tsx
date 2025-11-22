'use client'

import { Avatar, Name } from '@coinbase/onchainkit'
import { useAccount } from 'wagmi'
import { Address } from 'viem'

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
      <div className="pixel-border rounded-full overflow-hidden">
        <Avatar address={address} className="w-8 h-8" />
      </div>
      <div className="flex flex-col">
        <Name address={address} className="text-xs" />
        <span className="text-[10px] text-gray-400">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
      </div>
    </div>
  )
}

