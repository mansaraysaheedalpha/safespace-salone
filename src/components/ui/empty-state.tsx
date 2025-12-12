import { type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center px-6 py-12",
        className
      )}
    >
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

// Pre-built empty states for common use cases

import { MessageCircle, Users, Inbox, Search, WifiOff } from "lucide-react"

export function NoMessagesEmptyState() {
  return (
    <EmptyState
      icon={MessageCircle}
      title="This is a safe space"
      description="Share when you're ready. Your counselor will respond as soon as they can."
    />
  )
}

export function NoConversationsEmptyState({ type }: { type: "waiting" | "active" }) {
  return (
    <EmptyState
      icon={type === "waiting" ? Inbox : Users}
      title={type === "waiting" ? "No waiting conversations" : "No active conversations"}
      description={
        type === "waiting"
          ? "New conversations will appear here when patients reach out"
          : "Accept waiting conversations to start helping"
      }
    />
  )
}

export function NoSearchResultsEmptyState({ query }: { query: string }) {
  return (
    <EmptyState
      icon={Search}
      title="No results found"
      description={`We couldn't find anything matching "${query}". Try a different search term.`}
    />
  )
}

export function OfflineEmptyState() {
  return (
    <EmptyState
      icon={WifiOff}
      title="You're offline"
      description="Please check your internet connection and try again."
    />
  )
}
