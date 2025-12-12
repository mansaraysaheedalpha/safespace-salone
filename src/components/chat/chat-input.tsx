"use client"

import { useState, useRef, useEffect } from "react"
import { Mic, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VoiceRecorder } from "@/components/chat/voice-recorder"
import { cn } from "@/lib/utils"

interface ChatInputProps {
  onSendText: (content: string) => void
  onSendVoice: (duration: number, audioBlob?: Blob) => void
  disabled?: boolean
}

export function ChatInput({ onSendText, onSendVoice, disabled }: ChatInputProps) {
  const [message, setMessage] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [message])

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendText(message.trim())
      setMessage("")
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleRecordingComplete = (blob: Blob, duration: number) => {
    onSendVoice(duration, blob)
    setIsRecording(false)
  }

  const handleRecordingCancel = () => {
    setIsRecording(false)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border pb-safe">
      <div className="max-w-md mx-auto px-4 py-3">
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
}
