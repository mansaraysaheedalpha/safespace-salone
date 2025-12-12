import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted",
        className
      )}
      {...props}
    />
  )
}

// Pre-built skeleton components for common use cases

export function MessageSkeleton({ isOwn = false }: { isOwn?: boolean }) {
  return (
    <div
      className={cn(
        "flex gap-2.5 max-w-[85%]",
        isOwn ? "ml-auto flex-row-reverse" : "mr-auto"
      )}
    >
      {!isOwn && <Skeleton className="w-8 h-8 rounded-full shrink-0" />}
      <div className={cn("space-y-2", isOwn ? "items-end" : "items-start")}>
        <Skeleton
          className={cn(
            "h-16 rounded-2xl",
            isOwn ? "w-48 rounded-br-md" : "w-56 rounded-bl-md"
          )}
        />
      </div>
    </div>
  )
}

export function MessageListSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <MessageSkeleton isOwn={false} />
      <MessageSkeleton isOwn={true} />
      <MessageSkeleton isOwn={false} />
      <MessageSkeleton isOwn={true} />
      <MessageSkeleton isOwn={false} />
    </div>
  )
}

export function ConversationCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-start gap-4">
        <Skeleton className="w-12 h-12 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-12" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-full" />
        </div>
        <Skeleton className="h-8 w-16 rounded-md shrink-0" />
      </div>
    </div>
  )
}

export function ConversationListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <ConversationCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function TopicCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-start gap-4">
        <Skeleton className="w-12 h-12 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    </div>
  )
}

export function TopicListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <TopicCardSkeleton key={i} />
      ))}
    </div>
  )
}
