"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Mic, X, Trash2, Check, Play, Pause, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type RecordingState = "idle" | "requesting-permission" | "recording" | "recorded"

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob, duration: number) => void
  onCancel: () => void
}

const MAX_DURATION = 60 // seconds
const WARNING_DURATION = 50 // seconds

// Pre-generated random heights for waveform animation (stable across renders)
const WAVEFORM_HEIGHTS = Array.from({ length: 32 }, (_, i) =>
  Math.sin(i * 0.3) * 40 + 50 + (i % 3) * 10
)

export function VoiceRecorder({ onRecordingComplete, onCancel }: VoiceRecorderProps) {
  const [state, setState] = useState<RecordingState>("idle")
  const [duration, setDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const recordedBlobRef = useRef<Blob | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Cleanup function
  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    mediaRecorderRef.current = null
    chunksRef.current = []
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return cleanup
  }, [cleanup])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Check if microphone is supported
  const isMicrophoneSupported = () => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
  }

  const startRecording = async () => {
    // Check if getUserMedia is supported
    if (!isMicrophoneSupported()) {
      setError("Voice recording is not supported on this device/browser.")
      return
    }

    setState("requesting-permission")
    setError(null)

    try {
      // Request microphone access with simpler constraints for better mobile compatibility
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      })

      streamRef.current = stream
      chunksRef.current = []

      // Determine best supported audio format
      let mimeType = "audio/webm"
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        mimeType = "audio/webm;codecs=opus"
      } else if (MediaRecorder.isTypeSupported("audio/webm")) {
        mimeType = "audio/webm"
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        mimeType = "audio/mp4"
      } else if (MediaRecorder.isTypeSupported("audio/ogg")) {
        mimeType = "audio/ogg"
      } else if (MediaRecorder.isTypeSupported("audio/wav")) {
        mimeType = "audio/wav"
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        recordedBlobRef.current = blob

        // Create audio element for preview
        audioRef.current = new Audio(URL.createObjectURL(blob))
        audioRef.current.onended = () => setIsPlaying(false)

        setState("recorded")
      }

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event)
        setError("Recording failed. Please try again.")
        setState("idle")
        cleanup()
      }

      mediaRecorder.start(100) // Collect data every 100ms
      setState("recording")
      setDuration(0)

      // Start duration timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          const newDuration = prev + 1
          // Auto-stop at max duration
          if (newDuration >= MAX_DURATION) {
            stopRecording()
          }
          return newDuration
        })
      }, 1000)
    } catch (err) {
      console.error("Microphone access error:", err)

      // Provide more specific error messages
      if (err instanceof Error) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setError("Microphone access denied. Please allow microphone in your browser settings.")
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          setError("No microphone found. Please connect a microphone.")
        } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
          setError("Microphone is in use by another app. Please close other apps and try again.")
        } else if (err.name === "OverconstrainedError") {
          setError("Microphone settings not supported. Please try again.")
        } else if (err.name === "SecurityError") {
          setError("Microphone access blocked. Please use HTTPS.")
        } else {
          setError("Could not access microphone. Please check permissions and try again.")
        }
      } else {
        setError("Could not access microphone. Please check permissions.")
      }

      setState("idle")
      cleanup()
    }
  }

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop()
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
    }
  }

  const cancelRecording = () => {
    cleanup()
    setDuration(0)
    setState("idle")
    recordedBlobRef.current = null
    onCancel()
  }

  const togglePlayback = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.currentTime = 0
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const sendRecording = () => {
    if (recordedBlobRef.current && duration > 0) {
      onRecordingComplete(recordedBlobRef.current, duration)
      cleanup()
      setDuration(0)
      setState("idle")
      recordedBlobRef.current = null
    }
  }

  return (
    <div className="flex items-center gap-3 w-full animate-in fade-in duration-200">
      {/* Idle state - tap to start */}
      {state === "idle" && !error && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={cancelRecording}
            className="h-10 w-10 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <X className="w-5 h-5" />
          </Button>
          <button
            onClick={startRecording}
            className="flex-1 flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 rounded-full px-4 py-3 transition-colors"
          >
            <Mic className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary">
              Tap to start recording
            </span>
          </button>
        </>
      )}

      {/* Requesting permission state */}
      {state === "requesting-permission" && (
        <div className="flex-1 flex items-center justify-center gap-2 py-2">
          <Mic className="w-5 h-5 text-primary animate-pulse" />
          <span className="text-sm text-muted-foreground">
            Requesting microphone access...
          </span>
        </div>
      )}

      {/* Recording state */}
      {state === "recording" && (
        <>
          {/* Cancel button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={cancelRecording}
            className="h-10 w-10 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <X className="w-5 h-5" />
          </Button>

          {/* Recording indicator */}
          <button
            onClick={stopRecording}
            className="flex-1 flex items-center gap-3 bg-muted rounded-full px-4 py-2.5 hover:bg-muted/80 transition-colors"
          >
            {/* Pulsing red dot */}
            <div className="relative">
              <div className="w-3 h-3 rounded-full bg-destructive" />
              <div className="absolute inset-0 w-3 h-3 rounded-full bg-destructive animate-ping" />
            </div>

            {/* Duration */}
            <span
              className={cn(
                "text-sm font-medium tabular-nums min-w-[40px]",
                duration >= WARNING_DURATION ? "text-destructive" : "text-foreground"
              )}
            >
              {formatDuration(duration)}
            </span>

            {/* Animated waveform bars */}
            <div className="flex-1 flex items-center justify-center gap-0.5 h-6">
              {WAVEFORM_HEIGHTS.map((height, i) => (
                <div
                  key={i}
                  className="w-0.75 bg-primary rounded-full animate-pulse"
                  style={{
                    height: `${height}%`,
                    animationDelay: `${i * 30}ms`,
                    animationDuration: "500ms",
                  }}
                />
              ))}
            </div>

            {/* Tap to stop text */}
            <span className="text-xs text-muted-foreground">
              Tap to stop
            </span>
          </button>

          {/* Duration warning */}
          {duration >= WARNING_DURATION && (
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-1 text-xs text-destructive animate-in fade-in">
              <AlertCircle className="w-3 h-3" />
              <span>{MAX_DURATION - duration}s left</span>
            </div>
          )}
        </>
      )}

      {/* Recorded state - preview */}
      {state === "recorded" && (
        <>
          {/* Delete button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={cancelRecording}
            className="h-9 w-9 shrink-0 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>

          {/* Preview player */}
          <div className="flex-1 min-w-0 flex items-center gap-2 bg-muted rounded-full px-3 py-2">
            {/* Play/Pause button */}
            <button
              onClick={togglePlayback}
              className="w-7 h-7 shrink-0 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary/30 transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-3.5 h-3.5 text-primary" fill="currentColor" />
              ) : (
                <Play className="w-3.5 h-3.5 text-primary ml-0.5" fill="currentColor" />
              )}
            </button>

            {/* Static waveform - fewer bars for mobile */}
            <div className="flex-1 min-w-0 flex items-center gap-0.5 h-5 overflow-hidden">
              {Array.from({ length: 20 }).map((_, i) => {
                const height = Math.sin(i * 0.5) * 30 + 50
                return (
                  <div
                    key={i}
                    className={cn(
                      "w-0.75 shrink-0 rounded-full transition-colors",
                      isPlaying ? "bg-primary" : "bg-foreground/30"
                    )}
                    style={{ height: `${height}%` }}
                  />
                )
              })}
            </div>

            {/* Duration */}
            <span className="text-xs font-medium text-foreground tabular-nums shrink-0">
              {formatDuration(duration)}
            </span>
          </div>

          {/* Send button */}
          <Button
            size="icon"
            onClick={sendRecording}
            className="h-9 w-9 shrink-0 rounded-full bg-primary hover:bg-primary/90"
          >
            <Check className="w-4 h-4" />
          </Button>
        </>
      )}

      {/* Error state */}
      {error && (
        <div className="flex-1 flex items-center justify-between gap-2 py-2">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={cancelRecording}>
            Close
          </Button>
        </div>
      )}
    </div>
  )
}
