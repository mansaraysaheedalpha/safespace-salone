import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// POST - Update user presence (heartbeat)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, is_online } = body

    if (!user_id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Upsert presence record
    const { data, error } = await supabase
      .from("user_presence")
      .upsert({
        user_id,
        is_online: is_online ?? true,
        last_seen: new Date().toISOString(),
      }, {
        onConflict: "user_id"
      })
      .select()
      .single()

    if (error) {
      console.error("Error updating presence:", error)
      return NextResponse.json(
        { error: "Failed to update presence" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, presence: data })
  } catch (error) {
    console.error("Presence update error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// GET - Get user presence
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id")

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("user_presence")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (error && error.code !== "PGRST116") { // PGRST116 = not found
      console.error("Error fetching presence:", error)
      return NextResponse.json(
        { error: "Failed to fetch presence" },
        { status: 500 }
      )
    }

    // If no presence record, user has never been online
    const presence = data || {
      user_id: userId,
      is_online: false,
      last_seen: null,
    }

    return NextResponse.json({ success: true, presence })
  } catch (error) {
    console.error("Presence fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
