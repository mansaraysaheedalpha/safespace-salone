import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getExpertiseForTopic } from "@/lib/constants/expertise"

// GET - Fetch conversations for counselor (waiting + active)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const counselorId = searchParams.get("counselor_id")
    const type = searchParams.get("type") // 'waiting' | 'active' | 'all'
    const lastReadJson = searchParams.get("last_read") // JSON: { conversationId: timestamp }

    if (!counselorId) {
      return NextResponse.json(
        { error: "Counselor ID is required" },
        { status: 400 }
      )
    }

    // Parse last read timestamps
    let lastReadMap: Record<string, string> = {}
    if (lastReadJson) {
      try {
        lastReadMap = JSON.parse(lastReadJson)
      } catch {
        // Ignore parse errors
      }
    }

    const supabase = await createClient()

    // Get counselor's expertise areas (gracefully handle if table doesn't exist)
    let counselorExpertise: string[] = []
    try {
      const { data: expertiseData, error: expertiseError } = await supabase
        .from("counselor_expertise")
        .select("expertise")
        .eq("counselor_id", counselorId)

      if (!expertiseError && expertiseData) {
        counselorExpertise = expertiseData.map((e) => e.expertise)
      }
    } catch {
      // Table doesn't exist yet, continue without expertise filtering
      console.log("counselor_expertise table not found, skipping expertise filter")
    }

    // Fetch conversations - use basic columns that always exist
    let query = supabase
      .from("conversations")
      .select(`
        id,
        patient_id,
        counselor_id,
        topic,
        urgency,
        status,
        created_at
      `)
      .eq("status", "active")
      .order("created_at", { ascending: false })

    // Filter by type
    if (type === "waiting") {
      query = query.is("counselor_id", null)
    } else if (type === "active") {
      query = query.eq("counselor_id", counselorId)
    } else {
      // 'all' - get both waiting (unassigned) and active (assigned to this counselor)
      query = query.or(`counselor_id.is.null,counselor_id.eq.${counselorId}`)
    }

    const { data: conversations, error } = await query

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json(
        { error: "Failed to fetch conversations" },
        { status: 500 }
      )
    }

    // Filter waiting conversations by expertise match (only if expertise is set)
    const filteredConversations = (conversations || []).filter((conv) => {
      // Active conversations (assigned to this counselor) - always show
      if (conv.counselor_id === counselorId) {
        return true
      }

      // Waiting conversations - filter by expertise match if counselor has expertise set
      if (!conv.counselor_id) {
        // If counselor has no expertise set, show all conversations (legacy support)
        if (counselorExpertise.length === 0) {
          return true
        }

        // Check if conversation topic matches counselor's expertise
        const topicExpertise = getExpertiseForTopic(conv.topic || "other")

        // Show if topic matches any of counselor's expertise areas
        // Also show if counselor has "general" expertise (catch-all)
        return (
          counselorExpertise.includes(topicExpertise) ||
          counselorExpertise.includes("general")
        )
      }

      return false
    })

    // Fetch patient info and last message for each conversation
    const enrichedConversations = await Promise.all(
      filteredConversations.map(async (conv) => {
        // Get patient info
        const { data: patient } = await supabase
          .from("users")
          .select("id, display_name, avatar_id")
          .eq("id", conv.patient_id)
          .single()

        // Get last message
        const { data: lastMessage } = await supabase
          .from("messages")
          .select("id, content, type, created_at, sender_id")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single()

        // Get message count
        const { count: messageCount } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", conv.id)

        // Get unread count (messages from patient since last read)
        let unreadCount = 0
        const lastReadTime = lastReadMap[conv.id]

        if (conv.counselor_id === counselorId) {
          // Only count unread for active conversations assigned to this counselor
          let unreadQuery = supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", conv.id)
            .neq("sender_id", counselorId) // Messages from patient

          if (lastReadTime) {
            unreadQuery = unreadQuery.gt("created_at", lastReadTime)
          }

          const { count } = await unreadQuery
          unreadCount = count || 0
        }

        // Get the expertise category for this topic
        const expertiseCategory = getExpertiseForTopic(conv.topic || "other")

        return {
          ...conv,
          patient,
          lastMessage,
          messageCount: messageCount || 0,
          unreadCount,
          expertiseCategory,
        }
      })
    )

    return NextResponse.json({
      success: true,
      conversations: enrichedConversations,
      counselorExpertise,
    })
  } catch (error) {
    console.error("Fetch counselor conversations error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}

// POST - Accept/assign a conversation to counselor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { conversation_id, counselor_id } = body

    if (!conversation_id) {
      return NextResponse.json(
        { error: "Conversation ID is required" },
        { status: 400 }
      )
    }

    if (!counselor_id) {
      return NextResponse.json(
        { error: "Counselor ID is required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check if conversation exists and is unassigned
    const { data: existing, error: checkError } = await supabase
      .from("conversations")
      .select("id, counselor_id, topic")
      .eq("id", conversation_id)
      .single()

    if (checkError || !existing) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      )
    }

    if (existing.counselor_id) {
      return NextResponse.json(
        { error: "Conversation already assigned to another counselor" },
        { status: 409 }
      )
    }

    // Get counselor's expertise to verify they can accept this conversation
    let counselorExpertise: string[] = []
    try {
      const { data: expertiseData } = await supabase
        .from("counselor_expertise")
        .select("expertise")
        .eq("counselor_id", counselor_id)

      if (expertiseData) {
        counselorExpertise = expertiseData.map((e) => e.expertise)
      }
    } catch {
      // Table doesn't exist yet, skip expertise check
    }

    const topicExpertise = getExpertiseForTopic(existing.topic || "other")

    // Check expertise match (skip for legacy counselors with no expertise set)
    if (counselorExpertise.length > 0) {
      const hasMatchingExpertise =
        counselorExpertise.includes(topicExpertise) ||
        counselorExpertise.includes("general")

      if (!hasMatchingExpertise) {
        return NextResponse.json(
          { error: "This conversation topic doesn't match your expertise" },
          { status: 403 }
        )
      }
    }

    // Assign counselor to the conversation
    const { data: conversation, error } = await supabase
      .from("conversations")
      .update({
        counselor_id,
      })
      .eq("id", conversation_id)
      .select("id, patient_id, counselor_id, topic, urgency, status, created_at")
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json(
        { error: "Failed to accept conversation" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      conversation,
    })
  } catch (error) {
    console.error("Accept conversation error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
