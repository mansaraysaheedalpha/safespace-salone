"use client"

import { useState, useEffect, useCallback } from "react"

interface OnlineStatusOptions {
  onOnline?: () => void
  onOffline?: () => void
}

export function useOnlineStatus(options: OnlineStatusOptions = {}) {
  const [isOnline, setIsOnline] = useState(true)
  const [wasOffline, setWasOffline] = useState(false)

  const handleOnline = useCallback(() => {
    setIsOnline(true)
    if (wasOffline) {
      options.onOnline?.()
    }
    setWasOffline(false)
  }, [options, wasOffline])

  const handleOffline = useCallback(() => {
    setIsOnline(false)
    setWasOffline(true)
    options.onOffline?.()
  }, [options])

  useEffect(() => {
    // Set initial state
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [handleOnline, handleOffline])

  return { isOnline, wasOffline }
}
