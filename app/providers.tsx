'use client'

export function Providers({ children }: { children: React.ReactNode }) {
  // No providers needed - we use Base App identity directly via Farcaster Mini App SDK
  return <>{children}</>
}
