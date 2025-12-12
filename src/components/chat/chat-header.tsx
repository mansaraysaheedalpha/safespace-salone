"use client"

import { memo, useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, MoreVertical, UserX, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { UserAvatar } from "@/components/user-avatar"
import { useUserPresence } from "@/hooks/usePresence"
import { cn } from "@/lib/utils"

interface ChatHeaderProps {
  counselorName?: string | null
  counselorAvatarId?: string | null
  counselorId?: string | null
  conversationId?: string | null
  patientId?: string | null
  isConnected: boolean
  onCounselorReset?: () => void
}

export const ChatHeader = memo(function ChatHeader({
  counselorName,
  counselorAvatarId,
  counselorId,
  conversationId,
  patientId,
  isConnected,
  onCounselorReset,
}: ChatHeaderProps) {
  const router = useRouter()
  const { isOnline, lastSeenFormatted } = useUserPresence(counselorId ?? null)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  // Determine status text - memoized
  const statusText = useMemo(() => {
    if (!isConnected) return "Waiting for counselor..."
    if (isOnline) return "Online"
    return `Last seen ${lastSeenFormatted}`
  }, [isConnected, isOnline, lastSeenFormatted])

  const handleBack = useCallback(() => {
    router.push("/topics")
  }, [router])

  const handleRequestNewCounselor = useCallback(async () => {
    if (!conversationId || !patientId) return

    setIsResetting(true)
    try {
      const response = await fetch(`/api/conversations/${conversationId}/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_id: patientId }),
      })

      if (response.ok) {
        setShowResetDialog(false)
        onCounselorReset?.()
        // Optionally show a success message or redirect
        router.push("/topics")
      } else {
        const data = await response.json()
        console.error("Failed to reset:", data.error)
      }
    } catch (error) {
      console.error("Error resetting conversation:", error)
    } finally {
      setIsResetting(false)
    }
  }, [conversationId, patientId, onCounselorReset, router])

  return (
    <>
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

          {/* Right - Avatar and menu */}
          <div className="flex items-center gap-1">
            {counselorAvatarId ? (
              <UserAvatar avatarId={counselorAvatarId} size="sm" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
            )}

            {/* Menu - only show when counselor is assigned */}
            {isConnected && conversationId && patientId && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="w-4 h-4" />
                    <span className="sr-only">Menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => setShowResetDialog(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <UserX className="w-4 h-4 mr-2" />
                    Request New Counselor
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      {/* Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Request a New Counselor?</AlertDialogTitle>
            <AlertDialogDescription>
              Your current counselor will be removed from this conversation. A new
              counselor with matching expertise will be assigned to help you.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResetting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRequestNewCounselor}
              disabled={isResetting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isResetting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Requesting...
                </>
              ) : (
                "Yes, Request New Counselor"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
})
