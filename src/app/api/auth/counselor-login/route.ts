import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { verifyPin } from "@/lib/auth"

/**
 * Counselor Login API
 *
 * NOTE: This is a simplified authentication flow for hackathon/demo purposes.
 * In production, this would:
 * - Use Supabase Auth or a proper auth provider
 * - Implement rate limiting
 * - Use secure session tokens
 * - Log authentication attempts
 * - Implement account lockout after failed attempts
 */

interface LoginRequest {
  display_name: string
  pin: string
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json()
    const { display_name, pin } = body

    // Validate input
    if (!display_name || !display_name.trim()) {
      return NextResponse.json(
        { error: "Display name is required" },
        { status: 400 }
      )
    }

    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { error: "PIN must be 4 digits" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Find counselor by display name
    const { data: user, error } = await supabase
      .from("users")
      .select("id, display_name, avatar_id, pin_hash, role")
      .eq("display_name", display_name.trim())
      .eq("role", "counselor")
      .single()

    if (error || !user) {
      // Use generic error to prevent user enumeration
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    // Verify PIN
    if (!verifyPin(pin, user.pin_hash)) {
      return NextResponse.json(
        { error: "Invalid credentials" },
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
