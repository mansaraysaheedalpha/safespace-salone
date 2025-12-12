import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { hashPin } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { display_name, avatar_id, pin } = body

    // Validation
    if (!display_name || !avatar_id || !pin) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    if (display_name.length < 2) {
      return NextResponse.json(
        { error: "Name must be at least 2 characters" },
        { status: 400 }
      )
    }

    if (!/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { error: "PIN must be exactly 4 digits" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check if counselor with same name already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("display_name", display_name)
      .eq("role", "counselor")
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: "A counselor with this name already exists" },
        { status: 409 }
      )
    }

    // Hash the PIN
    const pin_hash = await hashPin(pin)

    // Create the counselor account
    const { data: user, error: createError } = await supabase
      .from("users")
      .insert({
        display_name,
        avatar_id,
        pin_hash,
        role: "counselor",
      })
      .select()
      .single()

    if (createError) {
      console.error("Error creating counselor:", createError)
      return NextResponse.json(
        { error: "Failed to create account" },
        { status: 500 }
      )
    }

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
    console.error("Counselor signup error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
