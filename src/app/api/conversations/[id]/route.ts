import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: "Conversation ID is required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data: conversation, error } = await supabase
      .from("conversations")
      .select("id, patient_id, counselor_id, topic, urgency, status, created_at")
      .eq("id", id)
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      conversation,
    })
  } catch (error) {
    console.error("Fetch conversation error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}

// PATCH - Update conversation (assign counselor, change status)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: "Conversation ID is required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const updateData: Record<string, unknown> = {}

    if (body.counselor_id !== undefined) {
      updateData.counselor_id = body.counselor_id
    }

    if (body.status !== undefined) {
      if (!["active", "closed"].includes(body.status)) {
        return NextResponse.json(
          { error: "Invalid status" },
          { status: 400 }
        )
      }
      updateData.status = body.status
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      )
    }

    const { data: conversation, error } = await supabase
      .from("conversations")
      .update(updateData)
      .eq("id", id)
      .select("id, patient_id, counselor_id, topic, urgency, status, created_at")
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json(
        { error: "Failed to update conversation" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      conversation,
    })
  } catch (error) {
    console.error("Update conversation error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
