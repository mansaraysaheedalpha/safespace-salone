import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { hashPin } from "@/lib/auth"
import { EXPERTISE_CATEGORIES } from "@/lib/constants/expertise"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { display_name, avatar_id, expertise, pin } = body

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

    // Validate expertise
    if (!expertise || !Array.isArray(expertise) || expertise.length === 0) {
      return NextResponse.json(
        { error: "Please select at least one area of expertise" },
        { status: 400 }
      )
    }

    // Validate each expertise ID
    const validExpertiseIds = EXPERTISE_CATEGORIES.map((e) => e.id)
    const invalidExpertise = expertise.filter(
      (e: string) => !validExpertiseIds.includes(e)
    )
    if (invalidExpertise.length > 0) {
      return NextResponse.json(
        { error: "Invalid expertise category selected" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

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

    // Insert expertise entries
    const expertiseEntries = expertise.map((expertiseId: string) => ({
      counselor_id: user.id,
      expertise: expertiseId,
    }))

    const { error: expertiseError } = await supabase
      .from("counselor_expertise")
      .insert(expertiseEntries)

    if (expertiseError) {
      console.error("Error saving expertise:", expertiseError)
      // Don't fail the whole signup, just log the error
      // The counselor can update their expertise later
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        display_name: user.display_name,
        avatar_id: user.avatar_id,
        role: user.role,
        expertise: expertise,
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
