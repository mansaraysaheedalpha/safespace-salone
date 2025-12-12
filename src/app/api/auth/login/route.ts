import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { verifyPin } from "@/lib/auth"

/**
 * Patient Login API
 *
 * NOTE: This is a simplified authentication flow for hackathon/demo purposes.
 * PIN-only login - patients just enter their 4-digit PIN.
 * In production, this would use proper authentication.
 */

interface LoginRequest {
  pin: string
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json()
    const { pin } = body

    // Validate input
    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { error: "PIN must be 4 digits" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Find all patients
    const { data: patients, error } = await supabase
      .from("users")
      .select("id, display_name, avatar_id, pin_hash, role")
      .eq("role", "patient")

    if (error || !patients || patients.length === 0) {
      return NextResponse.json(
        { error: "Invalid PIN" },
        { status: 401 }
      )
    }

    // Find patient with matching PIN
    const user = patients.find((p) => verifyPin(pin, p.pin_hash))

    if (!user) {
      return NextResponse.json(
        { error: "Invalid PIN" },
        { status: 401 }
      )
    }

    // Check for active conversation
    const { data: conversation } = await supabase
      .from("conversations")
      .select("id, status, topic, urgency")
      .eq("patient_id", user.id)
      .in("status", ["waiting", "active"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    // Return user info with active conversation if exists
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        display_name: user.display_name,
        avatar_id: user.avatar_id,
        role: user.role,
      },
      activeConversation: conversation || null,
    })
  } catch (error) {
    console.error("Patient login error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
