"use client"

import { useState, useEffect, useCallback } from "react"
import { WifiOff, RefreshCw, Check } from "lucide-react"
import { useOnlineStatus } from "@/hooks/useOnlineStatus"
import { syncPendingMessages, listenForSyncMessages } from "@/lib/offline/sync"
import { getPendingMessageCount } from "@/lib/offline/db"
import { cn } from "@/lib/utils"

interface OfflineIndicatorProps {
  className?: string
}

export function OfflineIndicator({ className }: OfflineIndicatorProps) {
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const [showSyncSuccess, setShowSyncSuccess] = useState(false)
  const [showBanner, setShowBanner] = useState(false)

  const handleSync = useCallback(async () => {
    if (isSyncing) return

    setIsSyncing(true)
    try {
      const result = await syncPendingMessages()
      setPendingCount(result.pending - result.synced)

      if (result.synced > 0) {
        setShowSyncSuccess(true)
      }
    } catch (error) {
      console.error("Sync error:", error)
    } finally {
      setIsSyncing(false)
    }
  }, [isSyncing])

  const { isOnline } = useOnlineStatus({
    onOnline: async () => {
      // When coming back online, sync pending messages
      await handleSync()
    },
  })

  // Check pending message count
  useEffect(() => {
    const checkPending = async () => {
      try {
        const count = await getPendingMessageCount()
        setPendingCount(count)
      } catch {
        // IndexedDB not available
      }
    }

    checkPending()
    const interval = setInterval(checkPending, 5000)
    return () => clearInterval(interval)
  }, [])

  // Listen for sync messages from service worker
  useEffect(() => {
    return listenForSyncMessages(handleSync)
  }, [handleSync])

  // Show/hide banner based on status
  useEffect(() => {
    if (!isOnline || pendingCount > 0) {
      setShowBanner(true)
    } else if (showSyncSuccess) {
      // Keep showing for success message
      const timer = setTimeout(() => {
        setShowBanner(false)
        setShowSyncSuccess(false)
      }, 3000)
      return () => clearTimeout(timer)
    } else {
      setShowBanner(false)
    }
  }, [isOnline, pendingCount, showSyncSuccess])

  if (!showBanner) return null

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-[100] px-4 py-2 text-center text-sm font-medium transition-all duration-300",
        !isOnline
          ? "bg-amber-500/90 text-amber-950"
          : showSyncSuccess
          ? "bg-emerald-500/90 text-emerald-950"
          : "bg-blue-500/90 text-blue-950",
        className
      )}
    >
      <div className="flex items-center justify-center gap-2">
        {!isOnline ? (
          <>
            <WifiOff className="w-4 h-4" />
            <span>You&apos;re offline. Messages will be sent when you reconnect.</span>
          </>
        ) : showSyncSuccess ? (
          <>
            <Check className="w-4 h-4" />
            <span>Messages synced successfully!</span>
          </>
        ) : pendingCount > 0 ? (
          <>
            {isSyncing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span>
              {isSyncing
                ? "Syncing messages..."
                : `${pendingCount} message${pendingCount > 1 ? "s" : ""} pending`}
            </span>
            {!isSyncing && (
              <button
                onClick={handleSync}
                className="underline hover:no-underline ml-1"
              >
                Sync now
              </button>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}

// Smaller inline indicator for headers
export function OfflineStatusDot({ className }: { className?: string }) {
  const { isOnline } = useOnlineStatus()

  return (
    <div
      className={cn(
        "w-2 h-2 rounded-full transition-colors",
        isOnline ? "bg-emerald-500" : "bg-amber-500",
        className
      )}
      title={isOnline ? "Online" : "Offline"}
    />
  )
}
