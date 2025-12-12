"use client"

import { useState, useEffect } from "react"
import { X, Save, FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SessionNotesPanelProps {
  isOpen: boolean
  onClose: () => void
  conversationId: string
  patientName: string
}

/**
 * Session Notes Panel
 *
 * For demo/hackathon purposes, notes are stored in localStorage.
 * In production, these would be stored securely in Supabase with:
 * - Encryption at rest
 * - Access controls (counselor-only)
 * - Audit logging
 * - HIPAA compliance considerations
 */

export function SessionNotesPanel({
  isOpen,
  onClose,
  conversationId,
  patientName,
}: SessionNotesPanelProps) {
  const [notes, setNotes] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Load notes from localStorage when panel opens
  useEffect(() => {
    if (isOpen && conversationId) {
      const storageKey = `safespace_notes_${conversationId}`
      const savedNotes = localStorage.getItem(storageKey)
      if (savedNotes) {
        try {
          const parsed = JSON.parse(savedNotes)
          // Using requestAnimationFrame to batch state updates
          requestAnimationFrame(() => {
            setNotes(parsed.content || "")
            setLastSaved(parsed.updatedAt ? new Date(parsed.updatedAt) : null)
          })
        } catch {
          requestAnimationFrame(() => setNotes(savedNotes))
        }
      } else {
        requestAnimationFrame(() => {
          setNotes("")
          setLastSaved(null)
        })
      }
    }
  }, [isOpen, conversationId])

  // Save notes to localStorage
  const handleSave = () => {
    setIsSaving(true)

    // Simulate a brief delay for UX
    setTimeout(() => {
      const storageKey = `safespace_notes_${conversationId}`
      const data = {
        content: notes,
        updatedAt: new Date().toISOString(),
      }
      localStorage.setItem(storageKey, JSON.stringify(data))
      setLastSaved(new Date())
      setIsSaving(false)
    }, 300)
  }

  // Auto-save on close
  const handleClose = () => {
    if (notes.trim()) {
      const storageKey = `safespace_notes_${conversationId}`
      const data = {
        content: notes,
        updatedAt: new Date().toISOString(),
      }
      localStorage.setItem(storageKey, JSON.stringify(data))
    }
    onClose()
  }

  // Format last saved time
  const formatLastSaved = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-full max-w-md bg-background border-l border-border z-50",
          "transform transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <div>
              <h2 className="font-semibold text-foreground">Session Notes</h2>
              <p className="text-xs text-muted-foreground">{patientName}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex flex-col h-[calc(100%-120px)] p-4">
          {/* Notes textarea */}
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Write private session notes here...

These notes are only visible to you and help track the patient's progress.

Consider noting:
- Key themes discussed
- Patient's emotional state
- Progress indicators
- Follow-up topics"
            className={cn(
              "flex-1 w-full resize-none rounded-lg p-4",
              "bg-muted border-none",
              "text-foreground placeholder:text-muted-foreground/60",
              "focus:outline-none focus:ring-2 focus:ring-primary/20",
              "text-sm leading-relaxed"
            )}
          />

          {/* Last saved indicator */}
          {lastSaved && (
            <p className="text-xs text-muted-foreground mt-2">
              Last saved: {formatLastSaved(lastSaved)}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 px-4 py-3 border-t border-border bg-background">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Notes are stored locally for demo
            </p>
            <Button onClick={handleSave} disabled={isSaving} size="sm">
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Notes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
