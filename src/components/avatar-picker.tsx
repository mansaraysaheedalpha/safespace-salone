"use client"

import { cn } from "@/lib/utils"
import { avatars, type AvatarOption } from "@/data/avatars"

interface AvatarPickerProps {
  selectedId: string | null
  onSelect: (avatar: AvatarOption) => void
}

export function AvatarPicker({ selectedId, onSelect }: AvatarPickerProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {avatars.map((avatar) => {
        const Icon = avatar.icon
        const isSelected = selectedId === avatar.id

        return (
          <button
            key={avatar.id}
            type="button"
            onClick={() => onSelect(avatar)}
            className={cn(
              "relative flex flex-col items-center gap-2 p-2 rounded-xl transition-all duration-200",
              "hover:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              isSelected && "bg-muted/50"
            )}
            aria-label={`Select ${avatar.name} avatar`}
            aria-pressed={isSelected}
          >
            <div
              className={cn(
                "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200",
                avatar.color,
                isSelected
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110"
                  : "hover:scale-105"
              )}
            >
              <Icon className="w-7 h-7 text-white" strokeWidth={1.5} />
            </div>
            <span
              className={cn(
                "text-xs text-center leading-tight transition-colors",
                isSelected ? "text-foreground font-medium" : "text-muted-foreground"
              )}
            >
              {avatar.name}
            </span>
          </button>
        )
      })}
    </div>
  )
}
