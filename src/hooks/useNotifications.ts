"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface NotificationOptions {
  title: string
  body: string
  icon?: string
  tag?: string
  requireInteraction?: boolean
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const audioContextRef = useRef<AudioContext | null>(null)

  // Initialize notification permission
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission)
    }
  }, [])

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "denied" as NotificationPermission
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      return result
    } catch {
      return "denied" as NotificationPermission
    }
  }, [])

  // Play notification sound using Web Audio API
  const playSound = useCallback(() => {
    try {
      // Create or reuse AudioContext
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      }

      const ctx = audioContextRef.current

      // Resume context if suspended (required for autoplay policy)
      if (ctx.state === "suspended") {
        ctx.resume()
      }

      // Create oscillator for notification sound
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      // Two-tone notification sound
      oscillator.frequency.setValueAtTime(880, ctx.currentTime) // A5
      oscillator.frequency.setValueAtTime(1100, ctx.currentTime + 0.1) // C#6
      oscillator.frequency.setValueAtTime(880, ctx.currentTime + 0.2) // A5

      // Envelope
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)

      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.3)
    } catch {
      // Ignore audio errors
    }
  }, [])

  // Show browser notification
  const showNotification = useCallback(
    async (options: NotificationOptions) => {
      // Play sound regardless of notification permission
      playSound()

      // Check if notifications are supported and permitted
      if (typeof window === "undefined" || !("Notification" in window)) {
        return null
      }

      // Request permission if not granted
      if (Notification.permission === "default") {
        await requestPermission()
      }

      if (Notification.permission !== "granted") {
        return null
      }

      try {
        const notification = new Notification(options.title, {
          body: options.body,
          icon: options.icon || "/icons/icon-192x192.png",
          tag: options.tag,
          requireInteraction: options.requireInteraction || false,
        })

        // Auto-close after 5 seconds
        setTimeout(() => {
          notification.close()
        }, 5000)

        return notification
      } catch {
        return null
      }
    },
    [playSound, requestPermission]
  )

  // Notify about new message
  const notifyNewMessage = useCallback(
    (senderName: string, messagePreview: string, conversationId?: string) => {
      showNotification({
        title: `New message from ${senderName}`,
        body: messagePreview.length > 50 ? messagePreview.substring(0, 50) + "..." : messagePreview,
        tag: conversationId || "new-message",
        requireInteraction: true,
      })
    },
    [showNotification]
  )

  // Notify about new conversation (for counselors)
  const notifyNewConversation = useCallback(
    (patientName: string, topic: string, urgency: string) => {
      const urgencyText = urgency === "high" ? "🔴 URGENT: " : urgency === "normal" ? "🟡 " : ""
      showNotification({
        title: `${urgencyText}New patient waiting`,
        body: `${patientName} needs help with ${topic}`,
        tag: "new-conversation",
        requireInteraction: true,
      })
    },
    [showNotification]
  )

  return {
    permission,
    requestPermission,
    playSound,
    showNotification,
    notifyNewMessage,
    notifyNewConversation,
  }
}
