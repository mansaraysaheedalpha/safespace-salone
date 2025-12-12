import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

interface RouteParams {
  params: Promise<{ id: string }>
}

// PATCH - Mark message as read
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const { read_at } = body

    const supabase = await createClient()

    const { data: message, error } = await supabase
      .from("messages")
      .update({ read_at: read_at || new Date().toISOString() })
      .eq("id", id)
      .select("id, read_at")
      .single()

    if (error) {
      console.error("Error marking message as read:", error)
      return NextResponse.json(
        { error: "Failed to update message" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message })
  } catch (error) {
    console.error("Mark as read error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get the message first to check if it's a voice message
    const { data: message, error: fetchError } = await supabase
      .from("messages")
      .select("*")
      .eq("id", id)
      .single()

    if (fetchError || !message) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      )
    }

    // If it's a voice message, delete the file from storage
    if (message.type === "voice" && message.content) {
      try {
        // Extract the file path from the URL
        const url = new URL(message.content)
        const pathMatch = url.pathname.match(/\/voice-notes\/(.+)$/)

        if (pathMatch) {
          const filePath = pathMatch[1]
          await supabase.storage
            .from("voice-notes")
            .remove([filePath])
        }
      } catch (storageError) {
        // Log but don't fail if storage deletion fails
        console.error("Error deleting voice file:", storageError)
      }
    }

    // Delete the message from database
    const { error: deleteError } = await supabase
      .from("messages")
      .delete()
      .eq("id", id)

    if (deleteError) {
      console.error("Error deleting message:", deleteError)
      return NextResponse.json(
        { error: "Failed to delete message" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete message error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
