'use client'

import { Address } from 'viem'
import { contractABI as serverABI } from './contract'

// Get contract address from environment (client-side)
// In Next.js, NEXT_PUBLIC_ variables are available at build time
const getContractAddress = (): Address => {
  // Try to get from environment variable (available at build time)
  // Note: process.env is replaced at build time, so this works in production
  const envAddress = typeof window !== 'undefined' 
    ? (window as any).__NEXT_PUBLIC_CONTRACT_ADDRESS__ || process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
    : process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
  
  if (envAddress && envAddress !== '0x0000000000000000000000000000000000000000') {
    return envAddress as Address
  }
  
  // Log for debugging
  if (typeof window !== 'undefined') {
    console.error('⚠️ Contract address not found!', {
      envVar: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
      windowVar: (window as any).__NEXT_PUBLIC_CONTRACT_ADDRESS__,
      allEnv: Object.keys(process.env).filter(k => k.includes('CONTRACT'))
    })
  }
  
  // Fallback to default (will cause error, but better than undefined)
  return '0x0000000000000000000000000000000000000000' as Address
}

// Re-export for client-side use
export const contractABI = serverABI
export const contractAddress = getContractAddress()

// Log contract address on module load (for debugging)
if (typeof window !== 'undefined') {
  console.log('📋 Contract address loaded:', contractAddress)
}

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

