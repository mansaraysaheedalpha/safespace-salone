"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Clock,
  MessageCircle,
  Users,
  AlertCircle,
  Loader2,
  RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/components/user-avatar"
import { ConversationListSkeleton } from "@/components/ui/skeleton"
import { useNotifications } from "@/hooks/useNotifications"
import { usePushNotifications } from "@/hooks/usePushNotifications"
import { cn } from "@/lib/utils"

interface Patient {
  id: string
  display_name: string
  avatar_id: string
}

interface LastMessage {
  id: string
  content: string
  type: "text" | "voice"
  created_at: string
  sender_id: string
}

interface Conversation {
  id: string
  patient_id: string
  counselor_id: string | null
  topic: string
  urgency: "low" | "normal" | "high"
  status: string
  created_at: string
  patient: Patient | null
  lastMessage: LastMessage | null
  messageCount: number
  unreadCount: number
}

const LAST_READ_STORAGE_KEY = "safespace_last_read"

// Helper to get last read timestamps from localStorage
function getLastReadTimestamps(): Record<string, string> {
  if (typeof window === "undefined") return {}
  try {
    const stored = localStorage.getItem(LAST_READ_STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

// Helper to mark a conversation as read
export function markConversationAsRead(conversationId: string) {
  if (typeof window === "undefined") return
  try {
    const timestamps = getLastReadTimestamps()
    timestamps[conversationId] = new Date().toISOString()
    localStorage.setItem(LAST_READ_STORAGE_KEY, JSON.stringify(timestamps))
  } catch {
    // Ignore storage errors
  }
}

interface CounselorInfo {
  id: string
  displayName: string
  avatarId: string
}

type TabType = "waiting" | "active"

const TOPIC_COLORS: Record<string, string> = {
  trauma: "bg-purple-500/20 text-purple-300",
  addiction: "bg-orange-500/20 text-orange-300",
  anxiety: "bg-blue-500/20 text-blue-300",
  depression: "bg-indigo-500/20 text-indigo-300",
  relationships: "bg-pink-500/20 text-pink-300",
  other: "bg-gray-500/20 text-gray-300",
}

const URGENCY_COLORS: Record<string, string> = {
  low: "bg-green-500",
  normal: "bg-yellow-500",
  high: "bg-red-500",
}

export default function CounselorDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>("waiting")
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [acceptingId, setAcceptingId] = useState<string | null>(null)
  const [counselorInfo, setCounselorInfo] = useState<CounselorInfo | null>(null)
  const [error, setError] = useState("")
  const prevWaitingIdsRef = useRef<Set<string>>(new Set())

  // Notifications
  const { notifyNewConversation, requestPermission } = useNotifications()
  const { isSupported: pushSupported, subscribe: subscribeToPush } = usePushNotifications()

  // Request notification permission and subscribe to push
  useEffect(() => {
    requestPermission()
  }, [requestPermission])

  // Subscribe to push notifications when counselor info is available
  useEffect(() => {
    if (counselorInfo && pushSupported) {
      subscribeToPush(counselorInfo.id, "counselor")
        .then((success) => {
          if (success) {
            console.log("[Push] Counselor subscribed to push notifications")
          }
        })
        .catch(console.error)
    }
  }, [counselorInfo, pushSupported, subscribeToPush])

  // Get counselor info from localStorage
  useEffect(() => {
    const storedInfo = localStorage.getItem("safespace_counselor_info")
    if (storedInfo) {
      try {
        setCounselorInfo(JSON.parse(storedInfo))
      } catch {
        router.push("/counselor/login")
      }
    }
  }, [router])

  // Fetch conversations
  const fetchConversations = useCallback(async (showRefresh = false) => {
    if (!counselorInfo) return

    if (showRefresh) {
      setIsRefreshing(true)
    }

    try {
      // Get last read timestamps for unread count calculation
      const lastReadTimestamps = getLastReadTimestamps()
      const lastReadParam = encodeURIComponent(JSON.stringify(lastReadTimestamps))

      const response = await fetch(
        `/api/counselor/conversations?counselor_id=${counselorInfo.id}&type=all&last_read=${lastReadParam}`
      )
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch conversations")
      }

      setConversations(data.conversations || [])
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load conversations")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [counselorInfo])

  // Initial fetch and polling
  useEffect(() => {
    if (counselorInfo) {
      fetchConversations()

      // Poll every 10 seconds for new conversations
      const pollInterval = setInterval(() => fetchConversations(), 10000)
      return () => clearInterval(pollInterval)
    }
  }, [counselorInfo, fetchConversations])

  // Notify for new waiting conversations
  useEffect(() => {
    const waitingConversations = conversations.filter((c) => !c.counselor_id)
    const currentWaitingIds = new Set(waitingConversations.map((c) => c.id))

    // Find new conversations (in current but not in previous)
    waitingConversations.forEach((conv) => {
      if (!prevWaitingIdsRef.current.has(conv.id)) {
        // New waiting conversation
        const patientName = conv.patient?.display_name || "A patient"
        notifyNewConversation(patientName, conv.topic, conv.urgency)
      }
    })

    prevWaitingIdsRef.current = currentWaitingIds
  }, [conversations, notifyNewConversation])

  // Accept conversation
  const handleAccept = async (conversationId: string) => {
    if (!counselorInfo) return

    setAcceptingId(conversationId)

    try {
      const response = await fetch("/api/counselor/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: conversationId,
          counselor_id: counselorInfo.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to accept conversation")
      }

      // Navigate to chat
      router.push(`/counselor/chat/${conversationId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept conversation")
      setAcceptingId(null)
    }
  }

  // Filter conversations by tab
  const waitingConversations = conversations.filter((c) => !c.counselor_id)
  const activeConversations = conversations.filter((c) => c.counselor_id === counselorInfo?.id)

  const displayedConversations = activeTab === "waiting" ? waitingConversations : activeConversations

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  // Truncate message preview
  const truncateMessage = (content: string, maxLength = 50) => {
    if (content.length <= maxLength) return content
    return content.slice(0, maxLength) + "..."
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Your Conversations</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Help those who need support
            </p>
          </div>
        </div>
        <div className="flex gap-2 mb-6">
          <div className="h-10 w-28 bg-muted rounded-lg animate-pulse" />
          <div className="h-10 w-24 bg-muted rounded-lg animate-pulse" />
        </div>
        <ConversationListSkeleton count={4} />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Your Conversations</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Help those who need support
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchConversations(true)}
          disabled={isRefreshing}
        >
          <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 px-4 py-3 rounded-lg mb-6">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("waiting")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors",
            activeTab === "waiting"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          <Clock className="w-4 h-4" />
          Waiting
          {waitingConversations.length > 0 && (
            <span className={cn(
              "px-2 py-0.5 rounded-full text-xs",
              activeTab === "waiting"
                ? "bg-primary-foreground/20 text-primary-foreground"
                : "bg-destructive text-destructive-foreground"
            )}>
              {waitingConversations.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("active")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors",
            activeTab === "active"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          <Users className="w-4 h-4" />
          Active
          {activeConversations.length > 0 && (
            <span className={cn(
              "px-2 py-0.5 rounded-full text-xs",
              activeTab === "active"
                ? "bg-primary-foreground/20 text-primary-foreground"
                : "bg-primary/20 text-primary"
            )}>
              {activeConversations.length}
            </span>
          )}
        </button>
      </div>

      {/* Conversation list */}
      {displayedConversations.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            {activeTab === "waiting" ? "No waiting conversations" : "No active conversations"}
          </h3>
          <p className="text-muted-foreground text-sm">
            {activeTab === "waiting"
              ? "New conversations will appear here when patients reach out"
              : "Accept waiting conversations to start helping"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedConversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => {
                if (activeTab === "active") {
                  markConversationAsRead(conv.id)
                  router.push(`/counselor/chat/${conv.id}`)
                }
              }}
              disabled={activeTab === "waiting"}
              className={cn(
                "w-full text-left bg-card border border-border rounded-xl p-4 transition-colors",
                activeTab === "active"
                  ? "hover:bg-muted/50 cursor-pointer active:scale-[0.99]"
                  : "cursor-default"
              )}
            >
              <div className="flex items-start gap-4">
                {/* Patient avatar */}
                <UserAvatar
                  avatarId={conv.patient?.avatar_id || "calm-ocean"}
                  size="md"
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Header row */}
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">
                        {conv.patient?.display_name || "Anonymous"}
                      </span>
                      {/* Urgency dot */}
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          URGENCY_COLORS[conv.urgency]
                        )}
                        title={`${conv.urgency} urgency`}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(conv.lastMessage?.created_at || conv.created_at)}
                      </span>
                      {/* Unread count badge */}
                      {conv.unreadCount > 0 && (
                        <span className="min-w-5 h-5 px-1.5 rounded-full bg-green-500 text-white text-xs font-medium flex items-center justify-center">
                          {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Topic badge */}
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full capitalize",
                        TOPIC_COLORS[conv.topic] || TOPIC_COLORS.other
                      )}
                    >
                      {conv.topic}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {conv.messageCount} message{conv.messageCount !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Last message preview */}
                  {conv.lastMessage && (
                    <p className="text-sm text-muted-foreground truncate">
                      {conv.lastMessage.type === "voice"
                        ? "Voice message"
                        : truncateMessage(conv.lastMessage.content || "")}
                    </p>
                  )}
                </div>

                {/* Accept button - only for waiting tab */}
                {activeTab === "waiting" && (
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAccept(conv.id)
                    }}
                    disabled={acceptingId === conv.id}
                    className="shrink-0"
                  >
                    {acceptingId === conv.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Accept"
                    )}
                  </Button>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
