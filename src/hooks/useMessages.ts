"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Message } from "@/types/database"
import type { RealtimeChannel } from "@supabase/supabase-js"

interface UseMessagesOptions {
  conversationId: string
  userId: string
}

interface SendingMessage extends Message {
  status: "sending" | "sent" | "error"
}

export function useMessages({ conversationId, userId }: UseMessagesOptions) {
  const [messages, setMessages] = useState<(Message | SendingMessage)[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const supabaseRef = useRef(createClient())

  // Fetch initial messages
  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch(`/api/messages?conversation_id=${conversationId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch messages")
      }

      setMessages(data.messages || [])
      setError(null)
    } catch (err) {
      console.error("Fetch messages error:", err)
      setError(err instanceof Error ? err.message : "Failed to load messages")
    } finally {
      setIsLoading(false)
    }
  }, [conversationId])

  // Set up realtime subscription
  useEffect(() => {
    const supabase = supabaseRef.current

    // Fetch initial messages
    fetchMessages()

    // Subscribe to new messages and updates
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message

          // Add new message if it's not from us (we already have it via optimistic update)
          // or if it doesn't already exist in our messages
          setMessages((prev) => {
            // Check if message already exists (including temp messages)
            const exists = prev.some(
              (m) =>
                m.id === newMessage.id ||
                (m.id.startsWith("temp-") &&
                  m.sender_id === newMessage.sender_id &&
                  m.content === newMessage.content &&
                  m.type === newMessage.type)
            )

            if (exists) {
              // Replace temp message with real one
              return prev.map((m) =>
                m.id.startsWith("temp-") &&
                m.sender_id === newMessage.sender_id &&
                m.content === newMessage.content &&
                m.type === newMessage.type
                  ? newMessage
                  : m
              )
            }

            return [...prev, newMessage]
          })
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updatedMessage = payload.new as Message

          // Update the message in state (for read receipts, etc.)
          setMessages((prev) =>
            prev.map((m) =>
              m.id === updatedMessage.id ? { ...m, ...updatedMessage } : m
            )
          )
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [conversationId, fetchMessages])

  // Send text message with optimistic update
  const sendTextMessage = useCallback(
    async (content: string, replyToId?: string) => {
      const tempId = `temp-${Date.now()}`
      const tempMessage: SendingMessage = {
        id: tempId,
        conversation_id: conversationId,
        sender_id: userId,
        type: "text",
        content,
        duration: null,
        created_at: new Date().toISOString(),
        status: "sending",
        reply_to_id: replyToId || null,
        read_at: null,
      }

      // Optimistic update
      setMessages((prev) => [...prev, tempMessage])

      try {
        const response = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversation_id: conversationId,
            sender_id: userId,
            type: "text",
            content,
            reply_to_id: replyToId || null,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to send message")
        }

        // Replace temp message with real one
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...data.message, status: "sent" } : m))
        )

        return data.message
      } catch (err) {
        // Mark message as error
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId ? { ...m, status: "error" } as SendingMessage : m
          )
        )
        console.error("Send text message error:", err)
        throw err
      }
    },
    [conversationId, userId]
  )

  // Send voice message with optimistic update
  const sendVoiceMessage = useCallback(
    async (duration: number, audioUrl?: string, replyToId?: string) => {
      const tempId = `temp-${Date.now()}`
      const tempMessage: SendingMessage = {
        id: tempId,
        conversation_id: conversationId,
        sender_id: userId,
        type: "voice",
        content: audioUrl || "[Voice message]",
        duration,
        created_at: new Date().toISOString(),
        status: "sending",
        reply_to_id: replyToId || null,
        read_at: null,
      }

      // Optimistic update
      setMessages((prev) => [...prev, tempMessage])

      try {
        const response = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversation_id: conversationId,
            sender_id: userId,
            type: "voice",
            content: audioUrl || "[Voice message]",
            duration,
            reply_to_id: replyToId || null,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to send voice message")
        }

        // Replace temp message with real one
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...data.message, status: "sent" } : m))
        )

        return data.message
      } catch (err) {
        // Mark message as error
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId ? { ...m, status: "error" } as SendingMessage : m
          )
        )
        console.error("Send voice message error:", err)
        throw err
      }
    },
    [conversationId, userId]
  )

  // Retry failed message
  const retryMessage = useCallback(
    async (messageId: string) => {
      const message = messages.find((m) => m.id === messageId) as SendingMessage
      if (!message || message.status !== "error") return

      // Remove failed message and resend
      setMessages((prev) => prev.filter((m) => m.id !== messageId))

      if (message.type === "text") {
        await sendTextMessage(message.content)
      } else {
        await sendVoiceMessage(message.duration || 0, message.content)
      }
    },
    [messages, sendTextMessage, sendVoiceMessage]
  )

  // Remove failed message
  const removeFailedMessage = useCallback((messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId))
  }, [])

  // Delete message (removes from state - API call handled by MessageBubble)
  const deleteMessage = useCallback((messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId))
  }, [])

  return {
    messages,
    isLoading,
    error,
    sendTextMessage,
    sendVoiceMessage,
    retryMessage,
    removeFailedMessage,
    deleteMessage,
    refetch: fetchMessages,
  }
}
