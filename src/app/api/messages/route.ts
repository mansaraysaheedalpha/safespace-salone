import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import webpush from "web-push"

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    "mailto:support@safespace-salone.com",
    vapidPublicKey,
    vapidPrivateKey
  )
}

interface CreateMessageRequest {
  conversation_id: string
  sender_id: string
  type: "text" | "voice"
  content?: string
  duration?: number
}

// Helper to send push notification
async function sendPushToUser(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  title: string,
  message: string,
  url: string
) {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.log("VAPID keys not configured, skipping push")
    return
  }

  try {
    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("subscription")
      .eq("user_id", userId)

    if (!subscriptions || subscriptions.length === 0) {
      console.log("No push subscriptions for user:", userId)
      return
    }

    const payload = JSON.stringify({
      title,
      body: message,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-72x72.png",
      tag: "new-message",
      data: { url },
    })

    await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(sub.subscription, payload)
      )
    )
  } catch (error) {
    console.error("Push notification error:", error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateMessageRequest = await request.json()
    const { conversation_id, sender_id, type, content, duration } = body

    // Validate input
    if (!conversation_id) {
      return NextResponse.json(
        { error: "Conversation ID is required" },
        { status: 400 }
      )
    }

    if (!sender_id) {
      return NextResponse.json(
        { error: "Sender ID is required" },
        { status: 400 }
      )
    }

    if (!type || !["text", "voice"].includes(type)) {
      return NextResponse.json(
        { error: "Valid message type is required" },
        { status: 400 }
      )
    }

    if (type === "text" && !content) {
      return NextResponse.json(
        { error: "Content is required for text messages" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verify conversation exists and user is part of it
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("id, patient_id, counselor_id")
      .eq("id", conversation_id)
      .single()

    if (convError || !conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      )
    }

    // Check if sender is part of the conversation
    if (
      conversation.patient_id !== sender_id &&
      conversation.counselor_id !== sender_id
    ) {
      return NextResponse.json(
        { error: "You are not part of this conversation" },
        { status: 403 }
      )
    }

    // Create message
    const { data: message, error } = await supabase
      .from("messages")
      .insert({
        conversation_id,
        sender_id,
        type,
        content: content || null,
        duration: duration || null,
      })
      .select("id, conversation_id, sender_id, type, content, duration, created_at")
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json(
        { error: "Failed to send message" },
        { status: 500 }
      )
    }

    // Send push notification to the recipient (don't await to not block response)
    const recipientId = sender_id === conversation.patient_id
      ? conversation.counselor_id  // Patient sent message, notify counselor
      : conversation.patient_id    // Counselor sent message, notify patient

    if (recipientId) {
      // Get sender info for notification title
      const { data: sender } = await supabase
        .from("users")
        .select("display_name")
        .eq("id", sender_id)
        .single()

      const senderName = sender?.display_name || "Someone"
      const messagePreview = type === "voice"
        ? "Sent a voice message"
        : (content?.substring(0, 50) || "Sent a message")

      // Send push in background (fire and forget)
      sendPushToUser(
        supabase,
        recipientId,
        `New message from ${senderName}`,
        messagePreview,
        `/chat/${conversation_id}`
      ).catch(console.error)
    }

    return NextResponse.json({
      success: true,
      message,
    })
  } catch (error) {
    console.error("Create message error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}

// GET - Fetch messages for a conversation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get("conversation_id")

    if (!conversationId) {
      return NextResponse.json(
        { error: "Conversation ID is required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data: messages, error } = await supabase
      .from("messages")
      .select("id, conversation_id, sender_id, type, content, duration, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json(
        { error: "Failed to fetch messages" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      messages,
    })
  } catch (error) {
    console.error("Fetch messages error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
