"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface QueuedMessage {
  id: string
  conversationId: string
  senderId: string
  type: "text" | "voice"
  content: string
  duration?: number
  timestamp: number
}

const STORAGE_KEY = "safespace_offline_queue"

// Helper to load queue from localStorage
const loadQueueFromStorage = (conversationId: string): QueuedMessage[] => {
  if (typeof window === "undefined") return []
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      const allQueued = JSON.parse(stored) as QueuedMessage[]
      return allQueued.filter((m) => m.conversationId === conversationId)
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }
  return []
}

// Helper to get initial online status (SSR-safe)
const getOnlineStatus = () => {
  if (typeof window === "undefined") return true
  return navigator.onLine
}

export function useOfflineQueue(conversationId: string, senderId: string) {
  const [queue, setQueue] = useState<QueuedMessage[]>(() => loadQueueFromStorage(conversationId))
  const [isOnline, setIsOnline] = useState(getOnlineStatus)
  const [isProcessing, setIsProcessing] = useState(false)
  const processingRef = useRef(false)

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Save queue to localStorage
  const saveQueue = useCallback((newQueue: QueuedMessage[]) => {
    const stored = localStorage.getItem(STORAGE_KEY)
    let allQueued: QueuedMessage[] = []

    if (stored) {
      try {
        allQueued = JSON.parse(stored) as QueuedMessage[]
        // Remove messages for this conversation
        allQueued = allQueued.filter((m) => m.conversationId !== conversationId)
      } catch {
        allQueued = []
      }
    }

    // Add new queue
    allQueued = [...allQueued, ...newQueue]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allQueued))
  }, [conversationId])

  // Add message to queue
  const queueMessage = useCallback(
    (type: "text" | "voice", content: string, duration?: number) => {
      const message: QueuedMessage = {
        id: `queued-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        conversationId,
        senderId,
        type,
        content,
        duration,
        timestamp: Date.now(),
      }

      setQueue((prev) => {
        const newQueue = [...prev, message]
        saveQueue(newQueue)
        return newQueue
      })

      return message
    },
    [conversationId, senderId, saveQueue]
  )

  // Process queue when online
  const processQueue = useCallback(
    async (sendMessage: (msg: QueuedMessage) => Promise<boolean>) => {
      if (processingRef.current || !isOnline || queue.length === 0) return

      processingRef.current = true
      setIsProcessing(true)

      const failedMessages: QueuedMessage[] = []

      for (const message of queue) {
        try {
          const success = await sendMessage(message)
          if (!success) {
            failedMessages.push(message)
          }
        } catch {
          failedMessages.push(message)
        }
      }

      setQueue(failedMessages)
      saveQueue(failedMessages)
      setIsProcessing(false)
      processingRef.current = false
    },
    [isOnline, queue, saveQueue]
  )

  // Remove message from queue
  const removeFromQueue = useCallback(
    (messageId: string) => {
      setQueue((prev) => {
        const newQueue = prev.filter((m) => m.id !== messageId)
        saveQueue(newQueue)
        return newQueue
      })
    },
    [saveQueue]
  )

  // Clear entire queue
  const clearQueue = useCallback(() => {
    setQueue([])
    saveQueue([])
  }, [saveQueue])

  return {
    queue,
    isOnline,
    isProcessing,
    queueMessage,
    processQueue,
    removeFromQueue,
    clearQueue,
    hasQueuedMessages: queue.length > 0,
  }
}
