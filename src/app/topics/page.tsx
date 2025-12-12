"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Heart,
  CircleOff,
  CloudRain,
  Cloud,
  Users,
  MessageCircle,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { TopicListSkeleton } from "@/components/ui/skeleton"
import { UserAvatar } from "@/components/user-avatar"
import { cn } from "@/lib/utils"
import { getUserSession } from "@/lib/auth"

interface Topic {
  id: string
  name: string
  icon: LucideIcon
}

interface UrgencyOption {
  id: "low" | "normal" | "high"
  label: string
  description: string
}

const topics: Topic[] = [
  { id: "trauma", name: "Trauma & Past Pain", icon: Heart },
  { id: "addiction", name: "Addiction & Recovery", icon: CircleOff },
  { id: "anxiety", name: "Anxiety & Worry", icon: CloudRain },
  { id: "grief", name: "Grief & Loss", icon: Cloud },
  { id: "relationships", name: "Relationships", icon: Users },
  { id: "other", name: "Something Else", icon: MessageCircle },
]

const urgencyOptions: UrgencyOption[] = [
  { id: "low", label: "Just need to talk", description: "I want to share my thoughts" },
  { id: "normal", label: "It's bothering me", description: "I need some support" },
  { id: "high", label: "I'm struggling", description: "I need help soon" },
]

interface UserInfo {
  id: string
  displayName: string
  avatarId: string
}

export default function TopicsPage() {
  const router = useRouter()
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [selectedUrgency, setSelectedUrgency] = useState<"low" | "normal" | "high" | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  // Check for user session on mount
  useEffect(() => {
    const userId = getUserSession()
    if (!userId) {
      router.push("/signup")
      return
    }

    // Get user info from localStorage
    const storedInfo = localStorage.getItem("safespace_user_info")
    if (storedInfo) {
      try {
        const info = JSON.parse(storedInfo)
        setUserInfo(info)
      } catch {
        router.push("/signup")
        return
      }
    } else {
      router.push("/signup")
      return
    }

    setIsLoading(false)
  }, [router])

  const handleTopicSelect = (topicId: string) => {
    setSelectedTopic(topicId)
    setError("")
  }

  const handleUrgencySelect = (urgencyId: "low" | "normal" | "high") => {
    setSelectedUrgency(urgencyId)
    setError("")
  }

  const handleSubmit = async () => {
    if (!selectedTopic || !selectedUrgency || !userInfo) return

    setIsSubmitting(true)
    setError("")

    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patient_id: userInfo.id,
          topic: selectedTopic,
          urgency: selectedUrgency,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create conversation")
      }

      // Redirect to chat
      router.push(`/chat/${data.conversation.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col px-6 py-8 bg-linear-to-b from-background via-secondary/10 to-background">
        {/* Header skeleton */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-full bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            <div className="h-3 w-36 bg-muted rounded animate-pulse" />
          </div>
        </div>

        {/* Content skeleton */}
        <div className="flex-1 max-w-md mx-auto w-full">
          <div className="text-center mb-8">
            <div className="h-7 w-48 bg-muted rounded mx-auto mb-2 animate-pulse" />
            <div className="h-4 w-40 bg-muted rounded mx-auto animate-pulse" />
          </div>
          <TopicListSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col px-6 py-8 bg-linear-to-b from-background via-secondary/10 to-background">
      {/* Header with user info */}
      <div className="flex items-center gap-3 mb-8">
        {userInfo && (
          <>
            <UserAvatar avatarId={userInfo.avatarId} size="md" />
            <div>
              <p className="text-foreground font-medium">
                Hi, {userInfo.displayName} 👋
              </p>
              <p className="text-sm text-muted-foreground">
                Welcome to your safe space
              </p>
            </div>
          </>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 max-w-md mx-auto w-full">
        {/* Topic Selection */}
        {!selectedTopic ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-semibold text-foreground mb-2">
                What&apos;s on your mind?
              </h1>
              <p className="text-muted-foreground">
                Choose a topic. Take your time.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {topics.map((topic) => {
                const Icon = topic.icon
                return (
                  <button
                    key={topic.id}
                    onClick={() => handleTopicSelect(topic.id)}
                    className={cn(
                      "flex flex-col items-center gap-3 p-5 rounded-2xl",
                      "bg-card border border-border",
                      "hover:border-primary/50 hover:bg-card/80",
                      "transition-all duration-200",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    )}
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" strokeWidth={1.5} />
                    </div>
                    <span className="text-sm font-medium text-foreground text-center leading-tight">
                      {topic.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          /* Urgency Selection */
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Selected topic indicator */}
            <button
              onClick={() => setSelectedTopic(null)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <span>←</span>
              <span>Change topic</span>
            </button>

            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                {(() => {
                  const topic = topics.find((t) => t.id === selectedTopic)
                  if (topic) {
                    const Icon = topic.icon
                    return (
                      <>
                        <Icon className="w-4 h-4" />
                        {topic.name}
                      </>
                    )
                  }
                  return null
                })()}
              </div>
              <h1 className="text-2xl font-semibold text-foreground mb-2">
                How urgent is this for you?
              </h1>
              <p className="text-muted-foreground">
                This helps us prioritize your care.
              </p>
            </div>

            <div className="space-y-3">
              {urgencyOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleUrgencySelect(option.id)}
                  className={cn(
                    "w-full flex flex-col items-start p-4 rounded-xl",
                    "border-2 transition-all duration-200",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    selectedUrgency === option.id
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/30"
                  )}
                >
                  <span
                    className={cn(
                      "font-medium",
                      selectedUrgency === option.id
                        ? "text-primary"
                        : "text-foreground"
                    )}
                  >
                    {option.label}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {option.description}
                  </span>
                </button>
              ))}
            </div>

            {error && (
              <p className="text-sm text-destructive text-center mt-4 animate-in fade-in">
                {error}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Submit button - only show when topic and urgency are selected */}
      {selectedTopic && selectedUrgency && (
        <div className="max-w-md mx-auto w-full mt-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full h-14 text-base font-medium bg-primary hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/25"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <LoadingSpinner
                  size="sm"
                  className="border-primary-foreground/30 border-t-primary-foreground"
                />
                Connecting...
              </span>
            ) : (
              "Connect with a Counselor"
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-3">
            You&apos;ll be matched with a verified counselor
          </p>
        </div>
      )}
    </div>
  )
}
