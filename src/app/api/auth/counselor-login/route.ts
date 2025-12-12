import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { verifyPin } from "@/lib/auth"

/**
 * Counselor Login API
 *
 * NOTE: This is a simplified authentication flow for hackathon/demo purposes.
 * PIN-only login - counselors just enter their 4-digit PIN.
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

    // Find all counselors
    const { data: counselors, error } = await supabase
      .from("users")
      .select("id, display_name, avatar_id, pin_hash, role")
      .eq("role", "counselor")

    if (error || !counselors || counselors.length === 0) {
      return NextResponse.json(
        { error: "Invalid PIN" },
        { status: 401 }
      )
    }

    // Find counselor with matching PIN
    const user = counselors.find((c) => verifyPin(pin, c.pin_hash))

    if (!user) {
      return NextResponse.json(
        { error: "Invalid PIN" },
        { status: 401 }
      )
    }

    // Return user info (excluding sensitive data)
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        display_name: user.display_name,
        avatar_id: user.avatar_id,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("Counselor login error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
