"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { Play, Pause, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface VoicePlayerProps {
  src: string
  duration: number
}

export function VoicePlayer({ src, duration }: VoicePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [error, setError] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Generate consistent waveform bars (memoized to prevent re-renders)
  const waveformBars = useMemo(() => {
    const bars: number[] = []
    for (let i = 0; i < 28; i++) {
      // Create a wave-like pattern
      const height = Math.sin(i * 0.5) * 25 + 45 + Math.sin(i * 0.3) * 15
      bars.push(Math.max(20, Math.min(90, height)))
    }
    return bars
  }, [])

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio(src)
    audioRef.current = audio

    const handleCanPlay = () => {
      setIsLoading(false)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
      audio.currentTime = 0
    }

    const handleError = () => {
      setError(true)
      setIsLoading(false)
    }

    audio.addEventListener("canplay", handleCanPlay)
    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("error", handleError)

    // Preload the audio
    audio.load()

    return () => {
      audio.removeEventListener("canplay", handleCanPlay)
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("error", handleError)
      audio.pause()
      audioRef.current = null
    }
  }, [src])

  const togglePlayback = useCallback(() => {
    if (!audioRef.current || error) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play().catch(() => {
        setError(true)
      })
      setIsPlaying(true)
    }
  }, [isPlaying, error])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Calculate progress percentage
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  // Display time: remaining when playing, total when paused
  const displayTime = isPlaying
    ? formatTime(Math.max(0, duration - currentTime))
    : formatTime(duration)

  if (error) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Unable to play audio</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 min-w-[180px] max-w-[240px]">
      {/* Play/Pause button */}
      <button
        onClick={togglePlayback}
        disabled={isLoading}
        className={cn(
          "w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors",
          "bg-primary/20 hover:bg-primary/30",
          isLoading && "opacity-50 cursor-not-allowed"
        )}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 text-primary animate-spin" />
        ) : isPlaying ? (
          <Pause className="w-4 h-4 text-primary" fill="currentColor" />
        ) : (
          <Play className="w-4 h-4 text-primary ml-0.5" fill="currentColor" />
        )}
      </button>

      {/* Waveform and progress */}
      <div className="flex-1 flex flex-col gap-1">
        {/* Waveform with progress overlay */}
        <div className="relative h-6 flex items-center">
          {/* Background waveform bars */}
          <div className="absolute inset-0 flex items-center gap-px">
            {waveformBars.map((height, i) => (
              <div
                key={i}
                className="flex-1 bg-foreground/20 rounded-full transition-colors"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>

          {/* Progress overlay with clipping */}
          <div
            className="absolute inset-0 flex items-center gap-px overflow-hidden"
            style={{ width: `${progress}%` }}
          >
            {waveformBars.map((height, i) => (
              <div
                key={i}
                className="flex-1 bg-primary rounded-full shrink-0 transition-colors"
                style={{
                  height: `${height}%`,
                  minWidth: `${100 / waveformBars.length}%`,
                }}
              />
            ))}
          </div>

          {/* Clickable progress area */}
          <button
            className="absolute inset-0 w-full h-full cursor-pointer"
            onClick={(e) => {
              if (!audioRef.current || isLoading) return
              const rect = e.currentTarget.getBoundingClientRect()
              const x = e.clientX - rect.left
              const percentage = x / rect.width
              const newTime = percentage * duration
              audioRef.current.currentTime = newTime
              setCurrentTime(newTime)
            }}
            aria-label="Seek audio"
          />
        </div>
      </div>

      {/* Duration display */}
      <span className="text-xs font-medium tabular-nums text-foreground/70 min-w-[32px] text-right">
        {displayTime}
      </span>
    </div>
  )
}
