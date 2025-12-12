import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import webpush from "web-push"

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY!

webpush.setVapidDetails(
  "mailto:support@safespace-salone.com",
  vapidPublicKey,
  vapidPrivateKey
)

// POST - Send push notification to a user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, title, message, url, tag } = body

    if (!user_id || !message) {
      return NextResponse.json(
        { error: "User ID and message are required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get all subscriptions for this user
    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("subscription")
      .eq("user_id", user_id)

    if (error) {
      console.error("Fetch subscriptions error:", error)
      return NextResponse.json(
        { error: "Failed to fetch subscriptions" },
        { status: 500 }
      )
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        sent: 0,
        message: "No subscriptions found for user",
      })
    }

    const payload = JSON.stringify({
      title: title || "SafeSpace",
      body: message,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-72x72.png",
      tag: tag || "message",
      data: { url: url || "/counselor/dashboard" },
    })

    // Send to all subscriptions
    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(sub.subscription, payload)
      )
    )

    // Count successes and failures
    const sent = results.filter((r) => r.status === "fulfilled").length
    const failed = results.filter((r) => r.status === "rejected").length

    // Remove invalid subscriptions
    const failedIndexes = results
      .map((r, i) => (r.status === "rejected" ? i : -1))
      .filter((i) => i !== -1)

    for (const index of failedIndexes) {
      const failedResult = results[index] as PromiseRejectedResult
      // If subscription is expired or invalid, remove it
      if (
        failedResult.reason?.statusCode === 410 ||
        failedResult.reason?.statusCode === 404
      ) {
        const endpoint = subscriptions[index].subscription?.endpoint
        if (endpoint) {
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("user_id", user_id)
            .eq("endpoint", endpoint)
        }
      }
    }

    return NextResponse.json({
      success: true,
      sent,
      failed,
    })
  } catch (error) {
    console.error("Push send error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
