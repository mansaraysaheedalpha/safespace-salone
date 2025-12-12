import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// POST - Save push subscription for a user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, subscription, user_type } = body

    if (!user_id || !subscription) {
      return NextResponse.json(
        { error: "User ID and subscription are required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check if subscription already exists for this user
    const { data: existing } = await supabase
      .from("push_subscriptions")
      .select("id")
      .eq("user_id", user_id)
      .eq("endpoint", subscription.endpoint)
      .single()

    if (existing) {
      // Update existing subscription
      const { error } = await supabase
        .from("push_subscriptions")
        .update({
          subscription: subscription,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)

      if (error) {
        console.error("Update subscription error:", error)
        return NextResponse.json(
          { error: "Failed to update subscription" },
          { status: 500 }
        )
      }
    } else {
      // Insert new subscription
      const { error } = await supabase
        .from("push_subscriptions")
        .insert({
          user_id,
          user_type: user_type || "counselor",
          endpoint: subscription.endpoint,
          subscription: subscription,
        })

      if (error) {
        console.error("Insert subscription error:", error)
        return NextResponse.json(
          { error: "Failed to save subscription" },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Push subscribe error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}

// DELETE - Remove push subscription
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id")
    const endpoint = searchParams.get("endpoint")

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    let query = supabase
      .from("push_subscriptions")
      .delete()
      .eq("user_id", userId)

    if (endpoint) {
      query = query.eq("endpoint", endpoint)
    }

    const { error } = await query

    if (error) {
      console.error("Delete subscription error:", error)
      return NextResponse.json(
        { error: "Failed to delete subscription" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Push unsubscribe error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
