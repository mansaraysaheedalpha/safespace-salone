import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

interface CreateMessageRequest {
  conversation_id: string
  sender_id: string
  type: "text" | "voice"
  content?: string
  duration?: number
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
