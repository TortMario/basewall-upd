import { NextRequest, NextResponse } from 'next/server'
import * as kv from '@/lib/kv'

// GET /api/posts/check?fid=123 - Check if user can post (1 post per 24 hours)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const fidParam = searchParams.get('fid')
    
    if (!fidParam) {
      return NextResponse.json({ 
        canPost: false, 
        error: 'FID is required' 
      }, { status: 400 })
    }

    const fid = parseInt(fidParam, 10)
    if (isNaN(fid) || fid <= 0) {
      return NextResponse.json({ 
        canPost: false, 
        error: 'Invalid FID' 
      }, { status: 400 })
    }

    // Get all posts by this user (fid)
    const allPosts = await kv.getPosts(1000, 0)
    const userPosts = allPosts.filter(
      (post) => post.author?.fid === fid
    )

    if (userPosts.length === 0) {
      return NextResponse.json({ 
        canPost: true,
        lastPostTime: null,
        hoursLeft: 0,
        minutesLeft: 0,
      })
    }

    // Find the most recent post
    const lastPost = userPosts.reduce((latest, post) => {
      const postTime = new Date(post.createdAt).getTime()
      const latestTime = new Date(latest.createdAt).getTime()
      return postTime > latestTime ? post : latest
    })

    const lastPostTime = new Date(lastPost.createdAt).getTime()
    const now = Date.now()
    const timeSinceLastPost = now - lastPostTime
    const hours24 = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

    if (timeSinceLastPost >= hours24) {
      return NextResponse.json({ 
        canPost: true,
        lastPostTime: lastPost.createdAt,
        hoursLeft: 0,
        minutesLeft: 0,
      })
    }

    // Calculate time remaining
    const timeRemaining = hours24 - timeSinceLastPost
    const hoursLeft = Math.floor(timeRemaining / (60 * 60 * 1000))
    const minutesLeft = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000))

    return NextResponse.json({ 
      canPost: false,
      lastPostTime: lastPost.createdAt,
      hoursLeft,
      minutesLeft,
    })
  } catch (error) {
    console.error('GET /api/posts/check error:', error)
    return NextResponse.json({ 
      canPost: false,
      error: 'Failed to check post availability',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

