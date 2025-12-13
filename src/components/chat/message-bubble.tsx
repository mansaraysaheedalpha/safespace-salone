"use client"

import { useState, useMemo, useRef, useEffect, memo } from "react"
import { Play, Pause, Clock, AlertCircle, Check, CheckCheck, Trash2, Loader2, Reply } from "lucide-react"
import { UserAvatar } from "@/components/user-avatar"
import { cn } from "@/lib/utils"
import type { Message, ReplyToMessage } from "@/types/database"

type MessageStatus = "sending" | "sent" | "error" | undefined

interface ExtendedMessage extends Message {
  status?: MessageStatus
  replyTo?: ReplyToMessage | null
}

interface MessageBubbleProps {
  message: ExtendedMessage
  isOwn: boolean
  senderAvatarId?: string
  senderName?: string
  showAvatar?: boolean
  onDelete?: (messageId: string) => void
  onReply?: (message: ReplyToMessage) => void
}

export const MessageBubble = memo(function MessageBubble({
  message,
  isOwn,
  senderAvatarId,
  senderName,
  showAvatar = true,
  onDelete,
  onReply,
}: MessageBubbleProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackProgress, setPlaybackProgress] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const status = (message as ExtendedMessage).status

  // Generate consistent waveform bars (memoized to prevent re-renders)
  const waveformBars = useMemo(() => {
    const seed = message.id.charCodeAt(0) + (message.duration || 5)
    return Array.from({ length: 24 }).map((_, i) => {
      const pseudoRandom = Math.sin(seed * (i + 1) * 0.5) * 0.5 + 0.5
      return Math.floor(pseudoRandom * 60 + 30)
    })
  }, [message.id, message.duration])

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleDelete = async () => {
    if (isDeleting || !onDelete) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/messages/${message.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        onDelete(message.id)
      } else {
        console.error("Failed to delete message")
        setIsDeleting(false)
      }
    } catch (error) {
      console.error("Delete error:", error)
      setIsDeleting(false)
    }
  }

  const handleReply = () => {
    if (onReply && !message.id.startsWith("temp-")) {
      onReply({
        id: message.id,
        content: message.content || "",
        type: message.type,
        sender_id: message.sender_id,
      })
    }
  }

  // Check if message has been read (for own messages)
  const isRead = isOwn && message.read_at !== null

  const handlePlayVoice = () => {
    // If already playing, pause it
    if (isPlaying && audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
      return
    }

    // Create audio element if it doesn't exist
    if (!audioRef.current && message.content) {
      audioRef.current = new Audio(message.content)

      audioRef.current.onended = () => {
        setIsPlaying(false)
        setPlaybackProgress(0)
      }

      audioRef.current.ontimeupdate = () => {
        if (audioRef.current && message.duration) {
          const progress = audioRef.current.currentTime / message.duration
          setPlaybackProgress(Math.min(progress, 1))
        }
      }

      audioRef.current.onerror = () => {
        console.error("Error playing audio:", message.content)
        setIsPlaying(false)
      }
    }

    // Play the audio
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch((err) => {
        console.error("Playback error:", err)
        setIsPlaying(false)
      })
      setIsPlaying(true)
    }
  }

  return (
    <div
      className={cn(
        "flex gap-2.5 max-w-[85%] animate-in fade-in slide-in-from-bottom-2 duration-300 group",
        isOwn ? "ml-auto flex-row-reverse" : "mr-auto"
      )}
    >
      {/* Avatar - only shown for other's messages */}
      {!isOwn && (
        <div className="flex-shrink-0 mt-auto mb-5">
          {showAvatar && senderAvatarId ? (
            <UserAvatar avatarId={senderAvatarId} size="sm" />
          ) : (
            <div className="w-8 h-8" /> // Spacer for alignment
          )}
        </div>
      )}

      {/* Message content */}
      <div className={cn("flex flex-col", isOwn ? "items-end" : "items-start")}>
        {/* Sender name for counselor messages */}
        {!isOwn && senderName && showAvatar && (
          <span className="text-xs text-muted-foreground mb-1.5 ml-1 font-medium">
            {senderName}
          </span>
        )}

        {/* Bubble row with delete button */}
        <div className={cn("flex items-center gap-2", isOwn && "flex-row-reverse")}>
          {/* Reply button - shown on left for own messages, right for others */}
          {onReply && !message.id.startsWith("temp-") && !isOwn && (
            <button
              onClick={handleReply}
              className="p-1.5 rounded-full text-muted-foreground/50 hover:text-primary hover:bg-primary/10 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
              aria-label="Reply to message"
            >
              <Reply className="w-4 h-4" />
            </button>
          )}

          {/* Bubble */}
          <div
            className={cn(
              "relative px-4 py-3 shadow-sm",
              // Rounded corners with tail
              isOwn
                ? "rounded-2xl rounded-br-md bg-primary text-primary-foreground shadow-primary/10"
                : "rounded-2xl rounded-bl-md bg-muted text-foreground shadow-black/5"
            )}
          >
          {/* Replied message preview */}
          {message.replyTo && (
            <div
              className={cn(
                "mb-2 px-3 py-2 rounded-lg border-l-2 -mx-1",
                isOwn
                  ? "bg-primary-foreground/10 border-primary-foreground/40"
                  : "bg-background/50 border-primary/60"
              )}
            >
              <p className={cn(
                "text-xs font-medium mb-0.5",
                isOwn ? "text-primary-foreground/70" : "text-primary"
              )}>
                {message.replyTo.sender_id === message.sender_id ? "You" : "Reply"}
              </p>
              <p className={cn(
                "text-xs truncate",
                isOwn ? "text-primary-foreground/60" : "text-muted-foreground"
              )}>
                {message.replyTo.type === "voice" ? "🎤 Voice message" : message.replyTo.content}
              </p>
            </div>
          )}

          {message.type === "text" ? (
            // Text message
            <div className="relative">
              <p className="text-sm whitespace-pre-wrap wrap-break-word leading-relaxed">
                {message.content}
              </p>
              {/* Inline timestamp and status for text */}
              <span
                className={cn(
                  "text-[10px] float-right ml-3 mt-1 inline-flex items-center gap-1",
                  isOwn ? "text-primary-foreground/60" : "text-muted-foreground"
                )}
              >
                {formatTime(message.created_at)}
                {isOwn && status === "sending" && (
                  <Clock className="w-3 h-3 animate-pulse" />
                )}
                {isOwn && status === "error" && (
                  <AlertCircle className="w-3 h-3 text-destructive" />
                )}
                {isOwn && (status === "sent" || !status) && !message.id.startsWith("temp-") && (
                  isRead ? (
                    <CheckCheck className="w-3 h-3 text-blue-400" />
                  ) : (
                    <Check className="w-3 h-3" />
                  )
                )}
              </span>
            </div>
          ) : (
            // Voice message
            <button
              onClick={handlePlayVoice}
              className="flex items-center gap-3 min-w-40"
              aria-label={isPlaying ? "Pause voice message" : "Play voice message"}
            >
              {/* Play/Pause button */}
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors",
                  isOwn
                    ? "bg-primary-foreground/20 hover:bg-primary-foreground/30"
                    : "bg-primary/15 hover:bg-primary/25"
                )}
              >
                {isPlaying ? (
                  <Pause
                    className={cn(
                      "w-5 h-5",
                      isOwn ? "text-primary-foreground" : "text-primary"
                    )}
                    fill="currentColor"
                  />
                ) : (
                  <Play
                    className={cn(
                      "w-5 h-5 ml-0.5",
                      isOwn ? "text-primary-foreground" : "text-primary"
                    )}
                    fill="currentColor"
                  />
                )}
              </div>

              {/* Waveform visualization */}
              <div className="flex-1 flex items-center gap-0.5 h-8">
                {waveformBars.map((height, i) => {
                  const isActive = isPlaying && i / waveformBars.length <= playbackProgress
                  return (
                    <div
                      key={i}
                      className={cn(
                        "w-0.75 rounded-full transition-all duration-150",
                        isOwn
                          ? isActive
                            ? "bg-primary-foreground"
                            : "bg-primary-foreground/40"
                          : isActive
                            ? "bg-primary"
                            : "bg-foreground/25"
                      )}
                      style={{ height: `${height}%` }}
                    />
                  )
                })}
              </div>

              {/* Duration and status */}
              <div className="flex flex-col items-end gap-0.5 shrink-0">
                <span
                  className={cn(
                    "text-xs font-medium",
                    isOwn ? "text-primary-foreground/80" : "text-foreground/70"
                  )}
                >
                  {formatDuration(message.duration || 0)}
                </span>
                <span
                  className={cn(
                    "text-[10px] inline-flex items-center gap-1",
                    isOwn ? "text-primary-foreground/50" : "text-muted-foreground"
                  )}
                >
                  {formatTime(message.created_at)}
                  {isOwn && status === "sending" && (
                    <Clock className="w-2.5 h-2.5 animate-pulse" />
                  )}
                  {isOwn && status === "error" && (
                    <AlertCircle className="w-2.5 h-2.5 text-destructive" />
                  )}
                  {isOwn && (status === "sent" || !status) && !message.id.startsWith("temp-") && (
                    isRead ? (
                      <CheckCheck className="w-2.5 h-2.5 text-blue-400" />
                    ) : (
                      <Check className="w-2.5 h-2.5" />
                    )
                  )}
                </span>
              </div>
            </button>
          )}
          </div>

          {/* Action buttons for own messages */}
          {isOwn && !message.id.startsWith("temp-") && (
            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              {/* Reply button */}
              {onReply && (
                <button
                  onClick={handleReply}
                  className="p-1.5 rounded-full text-muted-foreground/50 hover:text-primary hover:bg-primary/10 transition-all"
                  aria-label="Reply to message"
                >
                  <Reply className="w-4 h-4" />
                </button>
              )}
              {/* Delete button */}
              {onDelete && (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className={cn(
                    "p-1.5 rounded-full transition-all",
                    "text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10",
                    isDeleting && "opacity-50 cursor-not-allowed"
                  )}
                  aria-label="Delete message"
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
})
