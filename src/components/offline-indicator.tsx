"use client"

import { useState, useEffect } from "react"
import { WifiOff } from "lucide-react"
import { cn } from "@/lib/utils"

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false)
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Initial state
    setIsOffline(!navigator.onLine)
    if (!navigator.onLine) {
      setShow(true)
    }

    const handleOnline = () => {
      setIsOffline(false)
      // Keep showing for a moment to indicate reconnection
      setTimeout(() => setShow(false), 2000)
    }

    const handleOffline = () => {
      setIsOffline(true)
      setShow(true)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  if (!show) return null

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-[100] px-4 py-2",
        "transition-all duration-300",
        isOffline
          ? "bg-amber-500/90 text-amber-950"
          : "bg-green-500/90 text-green-950"
      )}
    >
      <div className="max-w-md mx-auto flex items-center justify-center gap-2 text-sm font-medium">
        {isOffline ? (
          <>
            <WifiOff className="w-4 h-4" />
            <span>You&apos;re offline. Messages will send when you reconnect.</span>
          </>
        ) : (
          <span>Back online!</span>
        )}
      </div>
    </div>
  )
}
