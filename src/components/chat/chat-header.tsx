"use client"

import { memo, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/components/user-avatar"
import { useUserPresence } from "@/hooks/usePresence"
import { cn } from "@/lib/utils"

interface ChatHeaderProps {
  counselorName?: string | null
  counselorAvatarId?: string | null
  counselorId?: string | null
  isConnected: boolean
}

export const ChatHeader = memo(function ChatHeader({
  counselorName,
  counselorAvatarId,
  counselorId,
  isConnected,
}: ChatHeaderProps) {
  const router = useRouter()
  const { isOnline, lastSeenFormatted } = useUserPresence(counselorId ?? null)

  // Determine status text - memoized
  const statusText = useMemo(() => {
    if (!isConnected) return "Waiting for counselor..."
    if (isOnline) return "Online"
    return `Last seen ${lastSeenFormatted}`
  }, [isConnected, isOnline, lastSeenFormatted])

  const handleBack = useCallback(() => {
    router.push("/topics")
  }, [router])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="flex items-center justify-between px-4 h-16 max-w-md mx-auto">
        {/* Back button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleBack}
          aria-label="Go back to topics"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline ml-1">Topics</span>
        </Button>

        {/* Center - Title and status */}
        <div className="flex flex-col items-center">
          <span className="font-medium text-foreground">
            {counselorName || "SafeSpace"}
          </span>
          <div className="flex items-center gap-1.5">
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                !isConnected
                  ? "bg-amber-500 animate-pulse"
                  : isOnline
                    ? "bg-emerald-500"
                    : "bg-gray-400"
              )}
            />
            <span className="text-xs text-muted-foreground">
              {statusText}
            </span>
          </div>
        </div>

        {/* Right - Counselor avatar */}
        <div className="w-9 flex justify-end">
          {counselorAvatarId ? (
            <UserAvatar avatarId={counselorAvatarId} size="sm" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
          )}
        </div>
      </div>
    </header>
  )
})
