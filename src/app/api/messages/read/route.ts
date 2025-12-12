import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// POST - Bulk mark messages as read
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message_ids, reader_id } = body

    if (!message_ids || !Array.isArray(message_ids) || message_ids.length === 0) {
      return NextResponse.json(
        { error: "Message IDs array is required" },
        { status: 400 }
      )
    }

    if (!reader_id) {
      return NextResponse.json(
        { error: "Reader ID is required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const readAt = new Date().toISOString()

    // Only mark messages as read that:
    // 1. Are in the message_ids array
    // 2. Were NOT sent by the reader (you don't "read" your own messages)
    // 3. Haven't been read yet
    const { data, error } = await supabase
      .from("messages")
      .update({ read_at: readAt })
      .in("id", message_ids)
      .neq("sender_id", reader_id)
      .is("read_at", null)
      .select("id, read_at")

    if (error) {
      console.error("Error marking messages as read:", error)
      return NextResponse.json(
        { error: "Failed to mark messages as read" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      updated_count: data?.length || 0,
      messages: data
    })
  } catch (error) {
    console.error("Bulk mark as read error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
