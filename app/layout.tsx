import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'The Wall Base - NFT Social Feed',
  description: 'A hybrid NFT + off-chain social feed on Base',
  openGraph: {
    title: 'The Wall Base',
    description: 'A hybrid NFT + off-chain social feed on Base',
    type: 'website',
  },
  other: {
    'fc:miniapp': process.env.NEXT_PUBLIC_MINIAPP_URL || '',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="fc:miniapp" content={process.env.NEXT_PUBLIC_MINIAPP_URL || ''} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

