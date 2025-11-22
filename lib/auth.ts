// Quick Auth verification - requires @farcaster/quick-auth package
// For now, this is a placeholder that allows requests through in development
// In production, install @farcaster/quick-auth and uncomment the import
// import { verifyJwt } from '@farcaster/quick-auth'
import { getSupabaseAdmin } from './supabase'

export interface AuthResult {
  fid: number
  address: string
  valid: boolean
}

export async function verifyQuickAuthToken(token: string): Promise<AuthResult | null> {
  try {
    const secret = process.env.QUICK_AUTH_SECRET
    if (!secret) {
      console.warn('QUICK_AUTH_SECRET not set, skipping JWT verification (dev mode)')
      // In development, allow requests through without verification
      // This is a placeholder - in production, install @farcaster/quick-auth
      return {
        fid: 0,
        address: '0x0000000000000000000000000000000000000000',
        valid: true,
      }
    }

    // Uncomment when @farcaster/quick-auth is installed:
    // const payload = await verifyJwt(token, secret)
    // if (!payload || !payload.sub) {
    //   return null
    // }
    // const fid = parseInt(payload.sub.replace('fid:', ''), 10)
    // const address = payload.aud?.[0] as string | undefined
    // if (!fid || !address) {
    //   return null
    // }
    // return { fid, address, valid: true }
    
    // Placeholder for now
    return null
  } catch (error) {
    console.error('JWT verification failed:', error)
    return null
  }
}

export async function getAuthFromRequest(request: Request): Promise<AuthResult | null> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // In dev mode, allow requests without auth header
    // In production, this should return null
    if (!process.env.QUICK_AUTH_SECRET) {
      return {
        fid: 0,
        address: '0x0000000000000000000000000000000000000000',
        valid: true,
      }
    }
    return null
  }

  const token = authHeader.replace('Bearer ', '')
  return verifyQuickAuthToken(token)
}
