"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { UserAvatar } from "@/components/user-avatar"
import { cn } from "@/lib/utils"

interface ChatHeaderProps {
  counselorName?: string | null
  counselorAvatarId?: string | null
  isConnected: boolean
}

export function ChatHeader({
  counselorName,
  counselorAvatarId,
  isConnected,
}: ChatHeaderProps) {
  const router = useRouter()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="flex items-center justify-between px-4 h-16 max-w-md mx-auto">
        {/* Back button */}
        <button
          onClick={() => router.push("/topics")}
          className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Center - Title and status */}
        <div className="flex flex-col items-center">
          <span className="font-medium text-foreground">
            {counselorName || "SafeSpace"}
          </span>
          <div className="flex items-center gap-1.5">
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                isConnected ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
              )}
            />
            <span className="text-xs text-muted-foreground">
              {isConnected ? "Connected" : "Waiting for counselor..."}
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
}
