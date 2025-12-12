import { memo } from "react"
import { cn } from "@/lib/utils"
import { getAvatarById, getDefaultAvatar } from "@/data/avatars"

type AvatarSize = "sm" | "md" | "lg"

interface UserAvatarProps {
  avatarId: string
  size?: AvatarSize
  className?: string
}

const sizeClasses: Record<AvatarSize, { container: string; icon: string }> = {
  sm: {
    container: "w-8 h-8",
    icon: "w-4 h-4",
  },
  md: {
    container: "w-10 h-10",
    icon: "w-5 h-5",
  },
  lg: {
    container: "w-14 h-14",
    icon: "w-7 h-7",
  },
}

export const UserAvatar = memo(function UserAvatar({ avatarId, size = "md", className }: UserAvatarProps) {
  const avatar = getAvatarById(avatarId) ?? getDefaultAvatar()
  const Icon = avatar.icon
  const sizes = sizeClasses[size]

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center flex-shrink-0",
        avatar.color,
        sizes.container,
        className
      )}
      title={avatar.name}
      aria-label={`${avatar.name} avatar`}
    >
      <Icon className={cn("text-white", sizes.icon)} strokeWidth={1.5} />
    </div>
  )
})
