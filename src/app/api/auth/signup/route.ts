import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { hashPin } from "@/lib/auth"

interface SignupRequest {
  display_name: string
  avatar_id: string
  pin: string
}

export async function POST(request: NextRequest) {
  try {
    const body: SignupRequest = await request.json()
    const { display_name, avatar_id, pin } = body

    // Validate input
    if (!display_name || display_name.trim().length < 2) {
      return NextResponse.json(
        { error: "Display name must be at least 2 characters" },
        { status: 400 }
      )
    }

    if (!avatar_id) {
      return NextResponse.json(
        { error: "Avatar is required" },
        { status: 400 }
      )
    }

    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { error: "PIN must be exactly 4 digits" },
        { status: 400 }
      )
    }

    // Hash the PIN
    const pin_hash = hashPin(pin)

    // Create Supabase client
    const supabase = await createClient()

    // Insert user into database
    const { data: user, error } = await supabase
      .from("users")
      .insert({
        display_name: display_name.trim(),
        avatar_id,
        pin_hash,
        role: "patient",
      })
      .select("id, display_name, avatar_id, role, created_at")
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json(
        { error: "Failed to create account. Please try again." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      user,
    })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
