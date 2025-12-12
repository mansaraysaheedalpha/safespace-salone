"use client"

import { memo, useCallback } from "react"
import {
  Brain,
  CloudRain,
  Heart,
  Shield,
  Pill,
  Flower2,
  Sparkles,
  Flame,
  Moon,
  Briefcase,
  Stethoscope,
  MessageCircleHeart,
  Check,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { EXPERTISE_CATEGORIES, type ExpertiseCategory } from "@/lib/constants/expertise"

// Map icon names to components
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Brain,
  CloudRain,
  Heart,
  Shield,
  Pill,
  Flower2,
  Sparkles,
  Flame,
  Moon,
  Briefcase,
  Stethoscope,
  MessageCircleHeart,
}

interface ExpertiseSelectorProps {
  selected: string[]
  onChange: (selected: string[]) => void
  disabled?: boolean
}

export const ExpertiseSelector = memo(function ExpertiseSelector({
  selected,
  onChange,
  disabled = false,
}: ExpertiseSelectorProps) {
  const toggleExpertise = useCallback(
    (expertiseId: string) => {
      if (disabled) return

      if (selected.includes(expertiseId)) {
        onChange(selected.filter((id) => id !== expertiseId))
      } else {
        onChange([...selected, expertiseId])
      }
    },
    [selected, onChange, disabled]
  )

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {EXPERTISE_CATEGORIES.map((expertise) => (
        <ExpertiseCard
          key={expertise.id}
          expertise={expertise}
          isSelected={selected.includes(expertise.id)}
          onToggle={toggleExpertise}
          disabled={disabled}
        />
      ))}
    </div>
  )
})

interface ExpertiseCardProps {
  expertise: ExpertiseCategory
  isSelected: boolean
  onToggle: (id: string) => void
  disabled: boolean
}

const ExpertiseCard = memo(function ExpertiseCard({
  expertise,
  isSelected,
  onToggle,
  disabled,
}: ExpertiseCardProps) {
  const IconComponent = ICON_MAP[expertise.icon] || MessageCircleHeart

  return (
    <button
      type="button"
      onClick={() => onToggle(expertise.id)}
      disabled={disabled}
      className={cn(
        "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        isSelected
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-card hover:border-primary/50 hover:bg-muted/50",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
          <Check className="w-3 h-3 text-primary-foreground" />
        </div>
      )}

      {/* Icon */}
      <IconComponent
        className={cn(
          "w-8 h-8",
          isSelected ? "text-primary" : "text-muted-foreground"
        )}
      />

      {/* Name */}
      <span
        className={cn(
          "text-sm font-medium text-center leading-tight",
          isSelected ? "text-primary" : "text-foreground"
        )}
      >
        {expertise.name}
      </span>
    </button>
  )
})

// Compact version for displaying selected expertise
interface ExpertiseBadgesProps {
  expertiseIds: string[]
  maxDisplay?: number
}

export const ExpertiseBadges = memo(function ExpertiseBadges({
  expertiseIds,
  maxDisplay = 3,
}: ExpertiseBadgesProps) {
  const displayedIds = expertiseIds.slice(0, maxDisplay)
  const remaining = expertiseIds.length - maxDisplay

  return (
    <div className="flex flex-wrap gap-1">
      {displayedIds.map((id) => {
        const expertise = EXPERTISE_CATEGORIES.find((e) => e.id === id)
        if (!expertise) return null

        const IconComponent = ICON_MAP[expertise.icon] || MessageCircleHeart

        return (
          <span
            key={id}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs"
          >
            <IconComponent className="w-3 h-3" />
            {expertise.name}
          </span>
        )
      })}
      {remaining > 0 && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs">
          +{remaining} more
        </span>
      )}
    </div>
  )
})
