import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// POST - Reset conversation assignment (patient requests new counselor)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params
    const body = await request.json()
    const { patient_id } = body

    if (!conversationId) {
      return NextResponse.json(
        { error: "Conversation ID is required" },
        { status: 400 }
      )
    }

    if (!patient_id) {
      return NextResponse.json(
        { error: "Patient ID is required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verify the conversation belongs to this patient
    const { data: conversation, error: fetchError } = await supabase
      .from("conversations")
      .select("id, patient_id, counselor_id, status")
      .eq("id", conversationId)
      .single()

    if (fetchError || !conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      )
    }

    if (conversation.patient_id !== patient_id) {
      return NextResponse.json(
        { error: "You can only reset your own conversations" },
        { status: 403 }
      )
    }

    if (!conversation.counselor_id) {
      return NextResponse.json(
        { error: "This conversation is not yet assigned to a counselor" },
        { status: 400 }
      )
    }

    // Reset the conversation assignment
    const { error: updateError } = await supabase
      .from("conversations")
      .update({
        counselor_id: null,
        assigned_counselor_only: false,
      })
      .eq("id", conversationId)

    if (updateError) {
      console.error("Error resetting conversation:", updateError)
      return NextResponse.json(
        { error: "Failed to reset conversation" },
        { status: 500 }
      )
    }

    // Optionally add a system message to the conversation
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: patient_id,
      content: "Patient requested a new counselor",
      type: "system",
    })

    return NextResponse.json({
      success: true,
      message: "Conversation has been reset. A new counselor will be assigned soon.",
    })
  } catch (error) {
    console.error("Reset conversation error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
