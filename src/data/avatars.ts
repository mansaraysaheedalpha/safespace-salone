import {
  Waves,
  Mountain,
  Sun,
  Flower2,
  Cloud,
  Leaf,
  Star,
  Heart,
  type LucideIcon,
} from "lucide-react"

export interface AvatarOption {
  id: string
  name: string
  color: string
  icon: LucideIcon
}

export const avatars: AvatarOption[] = [
  {
    id: "calm-ocean",
    name: "Calm Ocean",
    color: "bg-cyan-600",
    icon: Waves,
  },
  {
    id: "gentle-mountain",
    name: "Gentle Mountain",
    color: "bg-indigo-600",
    icon: Mountain,
  },
  {
    id: "warm-sunset",
    name: "Warm Sunset",
    color: "bg-amber-500",
    icon: Sun,
  },
  {
    id: "peaceful-garden",
    name: "Peaceful Garden",
    color: "bg-rose-500",
    icon: Flower2,
  },
  {
    id: "soft-cloud",
    name: "Soft Cloud",
    color: "bg-sky-500",
    icon: Cloud,
  },
  {
    id: "forest-calm",
    name: "Forest Calm",
    color: "bg-emerald-600",
    icon: Leaf,
  },
  {
    id: "night-star",
    name: "Night Star",
    color: "bg-purple-600",
    icon: Star,
  },
  {
    id: "kind-heart",
    name: "Kind Heart",
    color: "bg-pink-500",
    icon: Heart,
  },
]

export function getAvatarById(id: string): AvatarOption | undefined {
  return avatars.find((avatar) => avatar.id === id)
}

export function getDefaultAvatar(): AvatarOption {
  return avatars[0]
}
