import { defineMiniApp } from '@farcaster/minikit'

export default defineMiniApp({
  name: 'The Wall Base',
  homeUrl: process.env.NEXT_PUBLIC_MINIAPP_URL || 'https://your-app.vercel.app',
  iconUrl: `${process.env.NEXT_PUBLIC_MINIAPP_URL || 'https://your-app.vercel.app'}/icon.png`,
  splashImageUrl: `${process.env.NEXT_PUBLIC_MINIAPP_URL || 'https://your-app.vercel.app'}/splash.png`,
  splashBackgroundColor: '#1e293b',
  primaryCategory: 'social',
  tags: ['nft', 'social', 'base'],
})

