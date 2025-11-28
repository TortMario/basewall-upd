import { NextRequest, NextResponse } from 'next/server'
import {
  parseWebhookEvent,
  verifyAppKeyWithNeynar,
} from '@farcaster/miniapp-node'

export async function POST(request: NextRequest) {
  try {
    const requestJson = await request.json()

    // Parse and verify the webhook event
    let data
    try {
      data = await parseWebhookEvent(requestJson, verifyAppKeyWithNeynar)
    } catch (e: unknown) {
      console.error('Webhook verification error:', e)
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      )
    }

    // Extract webhook data
    const fid = data.fid
    const appFid = data.appFid // The FID of the client app (Base app is 309857)
    const event = data.event

    // Handle different event types
    try {
      switch (event.event) {
        case 'miniapp_added':
          if (event.notificationDetails) {
            // Save notification details for this user
            // TODO: Implement saveUserNotificationDetails(fid, appFid, event.notificationDetails)
            console.log('Mini app added:', { fid, appFid, notificationDetails: event.notificationDetails })
            
            // Optionally send a welcome notification
            // TODO: Implement sendMiniAppNotification(...)
          }
          break

        case 'miniapp_removed':
          // Delete notification details
          // TODO: Implement deleteUserNotificationDetails(fid, appFid)
          console.log('Mini app removed:', { fid, appFid })
          break

        case 'notifications_enabled':
          // Save new notification details and send confirmation
          if (event.notificationDetails) {
            // TODO: Implement saveUserNotificationDetails(fid, appFid, event.notificationDetails)
            console.log('Notifications enabled:', { fid, appFid, notificationDetails: event.notificationDetails })
            
            // Optionally send confirmation notification
            // TODO: Implement sendMiniAppNotification(...)
          }
          break

        case 'notifications_disabled':
          // Delete notification details
          // TODO: Implement deleteUserNotificationDetails(fid, appFid)
          console.log('Notifications disabled:', { fid, appFid })
          break

        default:
          console.log('Unknown event type:', event.event)
      }
    } catch (error) {
      console.error('Error processing webhook event:', error)
      // Still return success to avoid retries for processing errors
    }

    // Return success response quickly (within 10 seconds)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

