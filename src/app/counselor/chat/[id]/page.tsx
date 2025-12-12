"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, FileText, MoreVertical, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MessageList } from "@/components/chat/message-list"
import { ChatInput } from "@/components/chat/chat-input"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { UserAvatar } from "@/components/user-avatar"
import { SessionNotesPanel } from "@/components/counselor/session-notes-panel"
import { useMessages } from "@/hooks/useMessages"
import { useNotifications } from "@/hooks/useNotifications"
import { uploadVoiceNote } from "@/lib/supabase/storage"
import { cn } from "@/lib/utils"
import type { Conversation } from "@/types/database"

interface CounselorInfo {
  id: string
  displayName: string
  avatarId: string
}

interface PatientInfo {
  id: string
  displayName: string
  avatarId: string
}

const TOPIC_COLORS: Record<string, string> = {
  trauma: "bg-purple-500/20 text-purple-300",
  addiction: "bg-orange-500/20 text-orange-300",
  anxiety: "bg-blue-500/20 text-blue-300",
  depression: "bg-indigo-500/20 text-indigo-300",
  relationships: "bg-pink-500/20 text-pink-300",
  other: "bg-gray-500/20 text-gray-300",
}

export default function CounselorChatPage() {
  const params = useParams()
  const router = useRouter()
  const conversationId = params.id as string

  const [counselorInfo, setCounselorInfo] = useState<CounselorInfo | null>(null)
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null)
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError, setPageError] = useState("")
  const [isSendingVoice, setIsSendingVoice] = useState(false)
  const [isNotesOpen, setIsNotesOpen] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const prevMessagesCountRef = useRef(0)

  // Store user info map for message rendering
  const [usersMap, setUsersMap] = useState<Map<string, { avatarId?: string; name?: string }>>(
    new Map()
  )

  // Notifications
  const { notifyNewMessage, requestPermission } = useNotifications()

  // Use the messages hook
  const {
    messages,
    isLoading: messagesLoading,
    error: messagesError,
    sendTextMessage,
    sendVoiceMessage,
    deleteMessage,
  } = useMessages({
    conversationId,
    userId: counselorInfo?.id || "",
  })

  // Scroll to bottom when messages update
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Request notification permission on mount
  useEffect(() => {
    requestPermission()
  }, [requestPermission])

  // Notify when new message from patient arrives
  useEffect(() => {
    if (!counselorInfo || messages.length === 0) return

    // Check if there are new messages
    if (messages.length > prevMessagesCountRef.current) {
      const newMessages = messages.slice(prevMessagesCountRef.current)

      // Find messages from patient (not from counselor)
      const patientMessages = newMessages.filter(
        (msg) => msg.sender_id !== counselorInfo.id && !msg.id.startsWith("temp-")
      )

      // Notify for each patient message
      patientMessages.forEach((msg) => {
        const senderName = patientInfo?.displayName || "Patient"
        const preview = msg.type === "voice" ? "🎤 Voice message" : msg.content || ""
        notifyNewMessage(senderName, preview, conversationId)
      })
    }

    prevMessagesCountRef.current = messages.length
  }, [messages, counselorInfo, patientInfo, conversationId, notifyNewMessage])

  // Get counselor info from localStorage
  useEffect(() => {
    const storedInfo = localStorage.getItem("safespace_counselor_info")
    if (storedInfo) {
      try {
        const info = JSON.parse(storedInfo)
        setCounselorInfo(info)
        setUsersMap((prev) => {
          const newMap = new Map(prev)
          newMap.set(info.id, { avatarId: info.avatarId, name: info.displayName })
          return newMap
        })
      } catch {
        router.push("/counselor/login")
      }
    } else {
      router.push("/counselor/login")
    }
  }, [router])

  // Load conversation and patient info
  useEffect(() => {
    if (!counselorInfo) return

    const loadData = async () => {
      try {
        // Load conversation
        const convResponse = await fetch(`/api/conversations/${conversationId}`)
        const convData = await convResponse.json()

        if (!convResponse.ok) {
          throw new Error(convData.error || "Failed to load conversation")
        }

        setConversation(convData.conversation)

        // Verify this counselor is assigned
        if (convData.conversation.counselor_id !== counselorInfo.id) {
          throw new Error("You are not assigned to this conversation")
        }

        // Load patient info
        const patientResponse = await fetch(`/api/users/${convData.conversation.patient_id}`)
        const patientData = await patientResponse.json()

        if (patientResponse.ok && patientData.user) {
          const patient = {
            id: patientData.user.id,
            displayName: patientData.user.display_name,
            avatarId: patientData.user.avatar_id,
          }
          setPatientInfo(patient)
          setUsersMap((prev) => {
            const newMap = new Map(prev)
            newMap.set(patient.id, { avatarId: patient.avatarId, name: patient.displayName })
            return newMap
          })
        }
      } catch (err) {
        console.error("Load data error:", err)
        setPageError(err instanceof Error ? err.message : "Failed to load conversation")
      } finally {
        setPageLoading(false)
      }
    }

    loadData()
  }, [conversationId, counselorInfo, router])

  const handleSendText = async (content: string) => {
    if (!counselorInfo) return

    try {
      await sendTextMessage(content)
    } catch (err) {
      console.error("Send text error:", err)
    }
  }

  const handleSendVoice = async (duration: number, audioBlob?: Blob) => {
    if (!counselorInfo) return

    setIsSendingVoice(true)

    try {
      let audioUrl: string | undefined

      if (audioBlob) {
        try {
          audioUrl = await uploadVoiceNote(conversationId, audioBlob)
        } catch (uploadErr) {
          console.error("Upload voice note error:", uploadErr)
        }
      }

      await sendVoiceMessage(duration, audioUrl)
    } catch (err) {
      console.error("Send voice error:", err)
    } finally {
      setIsSendingVoice(false)
    }
  }

  const getUserInfo = (userId: string) => {
    return usersMap.get(userId)
  }

  const handleCloseConversation = async () => {
    if (!confirm("Are you sure you want to close this conversation?")) return

    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "closed" }),
      })

      if (response.ok) {
        router.push("/counselor/dashboard")
      }
    } catch (err) {
      console.error("Close conversation error:", err)
    }
  }

  const isLoading = pageLoading || (messagesLoading && messages.length === 0)
  const error = pageError || messagesError

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
        <p className="text-destructive mb-4">{error}</p>
        <button
          onClick={() => router.push("/counselor/dashboard")}
          className="text-primary hover:underline"
        >
          Go back to dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Custom header for counselor */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left side - back and patient info */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/counselor/dashboard")}
                className="shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>

              {patientInfo && (
                <div className="flex items-center gap-3">
                  <UserAvatar avatarId={patientInfo.avatarId} size="sm" />
                  <div>
                    <h2 className="font-medium text-foreground text-sm">
                      {patientInfo.displayName}
                    </h2>
                    {conversation && (
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full capitalize",
                          TOPIC_COLORS[conversation.topic] || TOPIC_COLORS.other
                        )}
                      >
                        {conversation.topic}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right side - actions */}
            <div className="flex items-center gap-2">
              {/* Session Notes button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsNotesOpen(true)}
                className="hidden sm:flex"
              >
                <FileText className="w-4 h-4 mr-2" />
                Notes
              </Button>

              {/* Mobile menu */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowMenu(!showMenu)}
                >
                  <MoreVertical className="w-5 h-5" />
                </Button>

                {showMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-lg shadow-lg z-20 py-1">
                      <button
                        onClick={() => {
                          setIsNotesOpen(true)
                          setShowMenu(false)
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted"
                      >
                        <FileText className="w-4 h-4" />
                        Session Notes
                      </button>
                      <button
                        onClick={() => {
                          handleCloseConversation()
                          setShowMenu(false)
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-muted"
                      >
                        <X className="w-4 h-4" />
                        Close Conversation
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Messages area */}
      <div className="flex-1 flex flex-col pt-16 pb-20">
        <MessageList
          messages={messages}
          currentUserId={counselorInfo?.id || ""}
          getUserInfo={getUserInfo}
          onDeleteMessage={deleteMessage}
        />
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <ChatInput
        onSendText={handleSendText}
        onSendVoice={handleSendVoice}
        disabled={!counselorInfo || isSendingVoice}
      />

      {/* Session Notes Panel */}
      <SessionNotesPanel
        isOpen={isNotesOpen}
        onClose={() => setIsNotesOpen(false)}
        conversationId={conversationId}
        patientName={patientInfo?.displayName || "Patient"}
      />
    </div>
  )
}
