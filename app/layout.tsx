import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

// Use the same URLs as in the manifest for consistency
const miniappUrl = 'https://basewall.vercel.app'
const heroImageUrl = 'https://basewall.vercel.app/og.png'

export const metadata: Metadata = {
  title: 'The Wall Base - Social Feed',
  description: 'A social feed on Base. Create and share posts with the community.',
  openGraph: {
    title: 'The Wall Base',
    description: 'A social feed on Base. Create and share posts with the community.',
    type: 'website',
    images: [
      {
        url: heroImageUrl,
        width: 1200,
        height: 630,
        alt: 'The Wall Base - Social Feed',
      },
    ],
  },
  other: {
    'fc:miniapp': JSON.stringify({
      version: 'next',
      imageUrl: heroImageUrl,
      button: {
        title: 'Open The Wall Base',
        action: {
          type: 'launch_miniapp',
          name: 'The Wall Base',
          url: miniappUrl,
          splashImageUrl: 'https://basewall.vercel.app/splash.png',
          splashBackgroundColor: '#1e293b',
        },
      },
    }),
    // Also add fc:frame for embed rendering compatibility
    'fc:frame': JSON.stringify({
      version: 'next',
      imageUrl: heroImageUrl,
      button: {
        title: 'Open The Wall Base',
        action: {
          type: 'launch_miniapp',
          name: 'The Wall Base',
          url: miniappUrl,
        },
      },
    }),
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
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

