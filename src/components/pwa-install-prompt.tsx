"use client"

import { useState, useEffect } from "react"
import { Download, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

const STORAGE_KEY = "safespace_pwa_prompt_dismissed"

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)

  useEffect(() => {
    // Check if already dismissed
    const dismissed = localStorage.getItem(STORAGE_KEY)
    if (dismissed) {
      return
    }

    // Check if already installed (running as standalone PWA)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      return
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      // Delay showing the prompt for a better UX
      setTimeout(() => setShowPrompt(true), 3000)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    // Listen for successful installation
    const handleAppInstalled = () => {
      setShowPrompt(false)
      setDeferredPrompt(null)
    }

    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    setIsInstalling(true)

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === "accepted") {
        setShowPrompt(false)
      }
    } catch (error) {
      console.error("Install prompt error:", error)
    } finally {
      setIsInstalling(false)
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem(STORAGE_KEY, "true")
  }

  if (!showPrompt || !deferredPrompt) {
    return null
  }

  return (
    <div
      className={cn(
        "fixed bottom-20 left-4 right-4 z-50",
        "max-w-md mx-auto",
        "animate-in slide-in-from-bottom-4 fade-in duration-300"
      )}
    >
      <div className="bg-card border border-border rounded-xl shadow-lg p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Download className="w-5 h-5 text-primary" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground text-sm">
              Add SafeSpace to Home Screen
            </h3>
            <p className="text-muted-foreground text-xs mt-0.5">
              Quick access, works offline, and feels like a native app
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="shrink-0 text-muted-foreground hover:text-foreground p-1 -m-1"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDismiss}
            className="flex-1"
          >
            Not now
          </Button>
          <Button
            size="sm"
            onClick={handleInstall}
            disabled={isInstalling}
            className="flex-1"
          >
            {isInstalling ? "Installing..." : "Install"}
          </Button>
        </div>
      </div>
    </div>
  )
}
