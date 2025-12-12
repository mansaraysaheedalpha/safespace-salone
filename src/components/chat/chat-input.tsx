"use client"

import { useState, useRef, useEffect, useCallback, memo } from "react"
import { Mic, Send, X, Reply } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VoiceRecorder } from "@/components/chat/voice-recorder"
import { cn } from "@/lib/utils"
import type { ReplyToMessage } from "@/types/database"

interface ChatInputProps {
  onSendText: (content: string, replyToId?: string) => void
  onSendVoice: (duration: number, audioBlob?: Blob, replyToId?: string) => void
  disabled?: boolean
  replyingTo?: ReplyToMessage | null
  onCancelReply?: () => void
}

export const ChatInput = memo(function ChatInput({
  onSendText,
  onSendVoice,
  disabled,
  replyingTo,
  onCancelReply
}: ChatInputProps) {
  const [message, setMessage] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Focus textarea when replying to a message
  useEffect(() => {
    if (replyingTo && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [replyingTo])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [message])

  const handleSend = useCallback(() => {
    if (message.trim() && !disabled) {
      onSendText(message.trim(), replyingTo?.id)
      setMessage("")
      onCancelReply?.()
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }
    }
  }, [message, disabled, onSendText, replyingTo?.id, onCancelReply])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  const handleRecordingComplete = useCallback((blob: Blob, duration: number) => {
    onSendVoice(duration, blob, replyingTo?.id)
    setIsRecording(false)
    onCancelReply?.()
  }, [onSendVoice, replyingTo?.id, onCancelReply])

  const handleRecordingCancel = useCallback(() => {
    setIsRecording(false)
  }, [])

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border pb-safe">
      <div className="max-w-md mx-auto px-4 py-3">
        {/* Reply preview */}
        {replyingTo && (
          <div className="mb-2 flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 border-l-4 border-primary">
            <Reply className="w-4 h-4 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-primary font-medium">Replying to message</p>
              <p className="text-sm text-muted-foreground truncate">
                {replyingTo.type === "voice" ? "🎤 Voice message" : replyingTo.content}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={onCancelReply}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {isRecording ? (
          /* Voice Recorder UI */
          <VoiceRecorder
            onRecordingComplete={handleRecordingComplete}
            onCancel={handleRecordingCancel}
          />
        ) : (
          /* Normal input UI */
          <div className="flex items-end gap-2">
            {/* Mic button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsRecording(true)}
              disabled={disabled}
              className="h-10 w-10 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 shrink-0"
            >
              <Mic className="w-5 h-5" />
            </Button>

            {/* Text input */}
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                disabled={disabled}
                rows={1}
                className={cn(
                  "w-full resize-none rounded-2xl px-4 py-2.5",
                  "bg-muted border-none",
                  "text-foreground placeholder:text-muted-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "text-sm leading-relaxed"
                )}
              />
            </div>

            {/* Send button */}
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!message.trim() || disabled}
              className={cn(
                "h-10 w-10 rounded-full shrink-0 transition-all",
                message.trim()
                  ? "bg-primary hover:bg-primary/90"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
})
