"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"

interface UsePresenceOptions {
  userId: string
  enabled?: boolean
}

interface UserPresence {
  user_id: string
  is_online: boolean
  last_seen: string | null
}

const HEARTBEAT_INTERVAL = 30000 // 30 seconds
const PRESENCE_CACHE_TTL = 15000 // 15 seconds cache for presence data

// Simple presence cache to avoid redundant fetches
const presenceCache = new Map<string, { data: UserPresence; timestamp: number }>()

export function usePresence({ userId, enabled = true }: UsePresenceOptions) {
  const [isOnline, setIsOnline] = useState(true)
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null)
  const lastHeartbeatRef = useRef<number>(0)

  // Send heartbeat to server with debounce
  const sendHeartbeat = useCallback(async (online: boolean) => {
    if (!userId || !enabled) return

    // Debounce: don't send heartbeat more than once per 5 seconds
    const now = Date.now()
    if (online && now - lastHeartbeatRef.current < 5000) return
    lastHeartbeatRef.current = now

    try {
      await fetch("/api/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          is_online: online,
        }),
      })
    } catch (err) {
      console.error("Failed to update presence:", err)
    }
  }, [userId, enabled])

  // Start heartbeat
  useEffect(() => {
    if (!userId || !enabled) return

    // Send initial online heartbeat
    sendHeartbeat(true)
    setIsOnline(true)

    // Set up regular heartbeat
    heartbeatRef.current = setInterval(() => {
      sendHeartbeat(true)
    }, HEARTBEAT_INTERVAL)

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        sendHeartbeat(true)
        setIsOnline(true)
      } else {
        // Mark as offline when tab is hidden for a while
        // (actual offline will be marked after heartbeat timeout)
      }
    }

    // Handle before unload
    const handleBeforeUnload = () => {
      sendHeartbeat(false)
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      // Clear heartbeat
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current)
      }

      // Mark as offline on cleanup
      sendHeartbeat(false)

      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [userId, enabled, sendHeartbeat])

  return { isOnline }
}

// Hook to fetch another user's presence with caching
export function useUserPresence(userId: string | null) {
  const [presence, setPresence] = useState<UserPresence | null>(() => {
    // Initialize from cache if available
    if (userId) {
      const cached = presenceCache.get(userId)
      if (cached && Date.now() - cached.timestamp < PRESENCE_CACHE_TTL) {
        return cached.data
      }
    }
    return null
  })
  const [isLoading, setIsLoading] = useState(true)

  const fetchPresence = useCallback(async () => {
    if (!userId) {
      setIsLoading(false)
      return
    }

    // Check cache first
    const cached = presenceCache.get(userId)
    if (cached && Date.now() - cached.timestamp < PRESENCE_CACHE_TTL) {
      setPresence(cached.data)
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/presence?user_id=${userId}`)
      const data = await response.json()

      if (response.ok && data.presence) {
        // Update cache
        presenceCache.set(userId, {
          data: data.presence,
          timestamp: Date.now(),
        })
        setPresence(data.presence)
      }
    } catch (err) {
      console.error("Failed to fetch presence:", err)
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  // Fetch presence on mount and poll periodically
  useEffect(() => {
    if (!userId) return

    fetchPresence()

    // Poll every 30 seconds
    const pollInterval = setInterval(fetchPresence, 30000)

    return () => clearInterval(pollInterval)
  }, [userId, fetchPresence])

  // Format last seen - memoized
  const lastSeenFormatted = useMemo(() => {
    const lastSeen = presence?.last_seen ?? null
    if (!lastSeen) return "Never"

    const date = new Date(lastSeen)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString([], { month: "short", day: "numeric" })
  }, [presence?.last_seen])

  return {
    presence,
    isLoading,
    isOnline: presence?.is_online ?? false,
    lastSeen: presence?.last_seen ?? null,
    lastSeenFormatted,
    refetch: fetchPresence,
  }
}
