import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const samplePosts = [
  {
    text: 'Welcome to OneStream! 🚀 This is the first post in our NFT social feed.',
    authorAddress: '0x1234567890123456789012345678901234567890',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    mintStatus: 'success',
    tokenId: 1,
    tokenUri: 'https://example.com/metadata/1',
    likes: 5,
    dislikes: 0,
  },
  {
    text: 'Every post you create becomes an NFT on Base. Pretty cool, right?',
    authorAddress: '0x2345678901234567890123456789012345678901',
    createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    mintStatus: 'success',
    tokenId: 2,
    tokenUri: 'https://example.com/metadata/2',
    likes: 3,
    dislikes: 1,
  },
  {
    text: 'You can edit and delete your posts if you own the NFT. Ownership is verified on-chain!',
    authorAddress: '0x3456789012345678901234567890123456789012',
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    mintStatus: 'success',
    tokenId: 3,
    tokenUri: 'https://example.com/metadata/3',
    likes: 8,
    dislikes: 0,
  },
  {
    text: 'Transfer your NFT to someone else, and they get the rights to edit/delete the post.',
    authorAddress: '0x4567890123456789012345678901234567890123',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    mintStatus: 'success',
    tokenId: 4,
    tokenUri: 'https://example.com/metadata/4',
    likes: 12,
    dislikes: 2,
  },
  {
    text: 'Likes and dislikes are stored off-chain for fast interactions.',
    authorAddress: '0x5678901234567890123456789012345678901234',
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    mintStatus: 'success',
    tokenId: 5,
    tokenUri: 'https://example.com/metadata/5',
    likes: 6,
    dislikes: 0,
  },
  {
    text: 'Built with Next.js, Supabase, and Base. The future of social media is on-chain!',
    authorAddress: '0x6789012345678901234567890123456789012345',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    mintStatus: 'success',
    tokenId: 6,
    tokenUri: 'https://example.com/metadata/6',
    likes: 15,
    dislikes: 1,
  },
  {
    text: 'Pixel art UI for that retro vibe. 🎮',
    authorAddress: '0x7890123456789012345678901234567890123456',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    mintStatus: 'success',
    tokenId: 7,
    tokenUri: 'https://example.com/metadata/7',
    likes: 9,
    dislikes: 0,
  },
  {
    text: 'Infinite scroll through the feed. Oldest posts at the top, newest at the bottom.',
    authorAddress: '0x8901234567890123456789012345678901234567',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    mintStatus: 'success',
    tokenId: 8,
    tokenUri: 'https://example.com/metadata/8',
    likes: 4,
    dislikes: 0,
  },
  {
    text: 'Connect your Base Account to start posting. No manual wallet connection needed!',
    authorAddress: '0x9012345678901234567890123456789012345678',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    mintStatus: 'success',
    tokenId: 9,
    tokenUri: 'https://example.com/metadata/9',
    likes: 7,
    dislikes: 0,
  },
  {
    text: 'This is the newest post. Scroll down to see more! 👇',
    authorAddress: '0x0123456789012345678901234567890123456789',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    mintStatus: 'success',
    tokenId: 10,
    tokenUri: 'https://example.com/metadata/10',
    likes: 2,
    dislikes: 0,
  },
]

async function seed() {
  console.log('Seeding database...')

  // Clear existing data (optional - comment out if you want to keep existing posts)
  // await supabase.from('reactions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  // await supabase.from('posts').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  const { data, error } = await supabase.from('posts').insert(samplePosts).select()

  if (error) {
    console.error('Error seeding posts:', error)
    process.exit(1)
  }

  console.log(`✅ Successfully seeded ${data.length} posts`)
  console.log('\nSample posts created:')
  data.forEach((post, index) => {
    console.log(`${index + 1}. ${post.text.substring(0, 50)}... (Token #${post.tokenId})`)
  })
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

