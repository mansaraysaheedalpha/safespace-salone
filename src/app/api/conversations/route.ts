import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

interface CreateConversationRequest {
  patient_id: string
  topic: string
  urgency: "low" | "normal" | "high"
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateConversationRequest = await request.json()
    const { patient_id, topic, urgency } = body

    // Validate input
    if (!patient_id) {
      return NextResponse.json(
        { error: "Patient ID is required" },
        { status: 400 }
      )
    }

    if (!topic) {
      return NextResponse.json(
        { error: "Topic is required" },
        { status: 400 }
      )
    }

    const validUrgencies = ["low", "normal", "high"]
    if (!urgency || !validUrgencies.includes(urgency)) {
      return NextResponse.json(
        { error: "Valid urgency level is required" },
        { status: 400 }
      )
    }

    // Create Supabase client
    const supabase = await createClient()

    // Verify patient exists
    const { data: patient, error: patientError } = await supabase
      .from("users")
      .select("id")
      .eq("id", patient_id)
      .single()

    if (patientError || !patient) {
      return NextResponse.json(
        { error: "Invalid patient" },
        { status: 400 }
      )
    }

    // Create conversation
    const { data: conversation, error } = await supabase
      .from("conversations")
      .insert({
        patient_id,
        topic,
        urgency,
        status: "active",
      })
      .select("id, patient_id, topic, urgency, status, created_at")
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json(
        { error: "Failed to create conversation. Please try again." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      conversation,
    })
  } catch (error) {
    console.error("Create conversation error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}

// GET - Fetch conversations for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id")
    const role = searchParams.get("role") || "patient"

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    let query = supabase
      .from("conversations")
      .select("id, patient_id, counselor_id, topic, urgency, status, created_at")
      .order("created_at", { ascending: false })

    if (role === "patient") {
      query = query.eq("patient_id", userId)
    } else if (role === "counselor") {
      // Counselors see their assigned conversations OR unassigned ones
      query = query.or(`counselor_id.eq.${userId},counselor_id.is.null`)
    }

    const { data: conversations, error } = await query

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json(
        { error: "Failed to fetch conversations" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      conversations,
    })
  } catch (error) {
    console.error("Fetch conversations error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
