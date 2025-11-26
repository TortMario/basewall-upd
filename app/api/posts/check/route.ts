import { NextRequest, NextResponse } from 'next/server'
import * as kv from '@/lib/kv'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const fidParam = searchParams.get('fid')
    
    if (!fidParam) {
      return NextResponse.json({ canPost: false, error: 'FID is required' }, { status: 400 })
    }

    const fid = parseInt(fidParam, 10)
    if (isNaN(fid) || fid <= 0) {
      return NextResponse.json({ canPost: false, error: 'Invalid FID' }, { status: 400 })
    }

    const allPosts = await kv.getPosts(1000, 0)
    const userPosts = allPosts.filter((post) => post.author?.fid === fid)

    if (userPosts.length === 0) {
      return NextResponse.json({ canPost: true, lastPostTime: null, hoursLeft: 0, minutesLeft: 0 })
    }

    const lastPost = userPosts.reduce((latest, post) => {
      const postTime = new Date(post.createdAt).getTime()
      const latestTime = new Date(latest.createdAt).getTime()
      return postTime > latestTime ? post : latest
    })

    const lastPostTime = new Date(lastPost.createdAt).getTime()
    const now = Date.now()
    const timeSinceLastPost = now - lastPostTime
    const minutes15 = 15 * 60 * 1000

    if (timeSinceLastPost >= minutes15) {
      return NextResponse.json({ canPost: true, lastPostTime: lastPost.createdAt, minutesLeft: 0, secondsLeft: 0 })
    }

    const timeRemaining = minutes15 - timeSinceLastPost
    const minutesLeft = Math.floor(timeRemaining / (60 * 1000))
    const secondsLeft = Math.floor((timeRemaining % (60 * 1000)) / 1000)

    return NextResponse.json({ canPost: false, lastPostTime: lastPost.createdAt, minutesLeft, secondsLeft })
  } catch {
    return NextResponse.json({ canPost: false, error: 'Failed to check post availability' }, { status: 500 })
  }
}
