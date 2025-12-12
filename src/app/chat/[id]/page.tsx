"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { ChatHeader } from "@/components/chat/chat-header"
import { MessageList } from "@/components/chat/message-list"
import { ChatInput } from "@/components/chat/chat-input"
import { MessageListSkeleton } from "@/components/ui/skeleton"
import { ErrorFallback } from "@/components/error-boundary"
import { getUserSession } from "@/lib/auth"
import { useMessages } from "@/hooks/useMessages"
import { uploadVoiceNote } from "@/lib/supabase/storage"
import type { Conversation } from "@/types/database"

interface UserInfo {
  id: string
  displayName: string
  avatarId: string
}

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const conversationId = params.id as string

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [_conversation, setConversation] = useState<Conversation | null>(null)
  const [counselorInfo, setCounselorInfo] = useState<{ name: string; avatarId: string } | null>(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError, setPageError] = useState("")
  const [isSendingVoice, setIsSendingVoice] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Store user info map for message rendering
  const [usersMap, setUsersMap] = useState<Map<string, { avatarId?: string; name?: string }>>(
    new Map()
  )

  // Use the messages hook
  const {
    messages,
    isLoading: messagesLoading,
    error: messagesError,
    sendTextMessage,
    sendVoiceMessage,
  } = useMessages({
    conversationId,
    userId: userInfo?.id || "",
  })

  // Scroll to bottom when messages update
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Check session and load conversation data
  useEffect(() => {
    const userId = getUserSession()
    if (!userId) {
      router.push("/signup")
      return
    }

    const storedInfo = localStorage.getItem("safespace_user_info")
    if (storedInfo) {
      try {
        const info = JSON.parse(storedInfo)
        setUserInfo(info)
        setUsersMap((prev) => {
          const newMap = new Map(prev)
          newMap.set(info.id, { avatarId: info.avatarId, name: info.displayName })
          return newMap
        })
      } catch {
        router.push("/signup")
        return
      }
    } else {
      router.push("/signup")
      return
    }

    loadConversation()
  }, [conversationId, router])

  const loadConversation = async () => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to load conversation")
      }

      setConversation(data.conversation)

      // If there's a counselor, fetch their info
      if (data.conversation.counselor_id) {
        const counselorRes = await fetch(`/api/users/${data.conversation.counselor_id}`)
        const counselorData = await counselorRes.json()
        if (counselorRes.ok && counselorData.user) {
          setCounselorInfo({
            name: counselorData.user.display_name,
            avatarId: counselorData.user.avatar_id,
          })
          setUsersMap((prev) => {
            const newMap = new Map(prev)
            newMap.set(counselorData.user.id, {
              avatarId: counselorData.user.avatar_id,
              name: counselorData.user.display_name,
            })
            return newMap
          })
        }
      }
    } catch (err) {
      console.error("Load conversation error:", err)
      setPageError(err instanceof Error ? err.message : "Failed to load conversation")
    } finally {
      setPageLoading(false)
    }
  }

  const handleSendText = async (content: string) => {
    if (!userInfo) return

    try {
      await sendTextMessage(content)
    } catch (err) {
      console.error("Send text error:", err)
    }
  }

  const handleSendVoice = async (duration: number, audioBlob?: Blob) => {
    if (!userInfo) return

    setIsSendingVoice(true)

    try {
      let audioUrl: string | undefined

      // Upload voice note to Supabase Storage if blob is provided
      if (audioBlob) {
        try {
          audioUrl = await uploadVoiceNote(conversationId, audioBlob)
        } catch (uploadErr) {
          console.error("Upload voice note error:", uploadErr)
          // Fall back to placeholder if upload fails
          audioUrl = undefined
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

  const isLoading = pageLoading || (messagesLoading && messages.length === 0)
  const error = pageError || messagesError

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <ChatHeader isConnected={false} />
        <div className="flex-1 pt-16 pb-20">
          <MessageListSkeleton />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <ChatHeader isConnected={false} />
        <div className="flex-1 pt-16">
          <ErrorFallback
            title="Couldn't load conversation"
            description={error}
            onRetry={() => router.push("/topics")}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <ChatHeader
        counselorName={counselorInfo?.name}
        counselorAvatarId={counselorInfo?.avatarId}
        isConnected={!!counselorInfo}
      />

      {/* Messages area - with padding for header and input */}
      <div className="flex-1 flex flex-col pt-16 pb-20">
        <MessageList
          messages={messages}
          currentUserId={userInfo?.id || ""}
          getUserInfo={getUserInfo}
        />
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <ChatInput
        onSendText={handleSendText}
        onSendVoice={handleSendVoice}
        disabled={!userInfo || isSendingVoice}
      />
    </div>
  )
}
