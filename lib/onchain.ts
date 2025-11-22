'use client'

import { Address } from 'viem'
import { contractABI as serverABI, contractAddress as serverAddress } from './contract'

// Re-export for client-side use
export const contractABI = serverABI
export const contractAddress = serverAddress

export function getBaseExplorerUrl(chainId: number, address: Address, tokenId?: number): string {
  const baseUrl =
    chainId === 8453
      ? 'https://basescan.org'
      : chainId === 84532
        ? 'https://sepolia.basescan.org'
        : 'https://basescan.org'

  if (tokenId !== undefined) {
    return `${baseUrl}/token/${address}?a=${tokenId}`
  }
  return `${baseUrl}/address/${address}`
}

