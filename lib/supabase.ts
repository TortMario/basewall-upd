import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Supabase is optional - can use Vercel KV instead
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Server-side client with service role key (for admin operations)
export function getSupabaseAdmin() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    return null
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Database types
export interface Post {
  id: string
  text: string
  authorAddress: string
  createdAt: string
  tokenId: number | null
  tokenUri: string | null
  mintStatus: 'pending' | 'success' | 'failed'
  likes: number
  dislikes: number
}

export interface Reaction {
  id: string
  postId: string
  userAddress: string
  type: 'like' | 'dislike'
  createdAt: string
}

