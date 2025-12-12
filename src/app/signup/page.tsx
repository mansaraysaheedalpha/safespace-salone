"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { AvatarPicker } from "@/components/avatar-picker"
import { UserAvatar } from "@/components/user-avatar"
import { cn } from "@/lib/utils"
import { generateRandomName, saveUserSession } from "@/lib/auth"
import type { AvatarOption } from "@/data/avatars"

type Step = 1 | 2 | 3

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarOption | null>(null)
  const [displayName, setDisplayName] = useState("")
  const [pin, setPin] = useState(["", "", "", ""])
  const [confirmPin, setConfirmPin] = useState(["", "", "", ""])
  const [pinError, setPinError] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const pinRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  const confirmPinRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  const handleAvatarSelect = (avatar: AvatarOption) => {
    setSelectedAvatar(avatar)
  }

  const handleGenerateRandomName = () => {
    setDisplayName(generateRandomName())
  }

  const handlePinChange = (index: number, value: string, isConfirm: boolean) => {
    if (!/^\d*$/.test(value)) return

    const newPin = isConfirm ? [...confirmPin] : [...pin]
    newPin[index] = value.slice(-1)

    if (isConfirm) {
      setConfirmPin(newPin)
    } else {
      setPin(newPin)
    }

    setPinError("")
    setError("")

    // Auto-focus next input
    if (value && index < 3) {
      const refs = isConfirm ? confirmPinRefs : pinRefs
      refs[index + 1].current?.focus()
    }
  }

  const handlePinKeyDown = (
    index: number,
    e: React.KeyboardEvent,
    isConfirm: boolean
  ) => {
    if (e.key === "Backspace") {
      const currentPin = isConfirm ? confirmPin : pin
      if (!currentPin[index] && index > 0) {
        const refs = isConfirm ? confirmPinRefs : pinRefs
        refs[index - 1].current?.focus()
      }
    }
  }

  const handleSubmit = async () => {
    const pinString = pin.join("")
    const confirmPinString = confirmPin.join("")

    if (pinString.length !== 4) {
      setPinError("Please enter a 4-digit PIN")
      return
    }

    if (pinString !== confirmPinString) {
      setPinError("PINs do not match")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          display_name: displayName.trim(),
          avatar_id: selectedAvatar?.id,
          pin: pinString,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create account")
      }

      // Save user session
      saveUserSession(data.user.id)

      // Store additional user info for quick access
      localStorage.setItem(
        "safespace_user_info",
        JSON.stringify({
          id: data.user.id,
          displayName: data.user.display_name,
          avatarId: data.user.avatar_id,
        })
      )

      // Redirect to topics page
      router.push("/topics")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setIsSubmitting(false)
    }
  }

  const canContinue = () => {
    switch (step) {
      case 1:
        return selectedAvatar !== null
      case 2:
        return displayName.trim().length >= 2
      case 3:
        return pin.every((d) => d !== "") && confirmPin.every((d) => d !== "")
      default:
        return false
    }
  }

  const nextStep = () => {
    if (step < 3) setStep((step + 1) as Step)
  }

  const prevStep = () => {
    if (step > 1) setStep((step - 1) as Step)
  }

  // Focus first PIN input when entering step 3
  useEffect(() => {
    if (step === 3) {
      pinRefs[0].current?.focus()
    }
  }, [step])

  return (
    <div className="min-h-screen flex flex-col px-6 py-8 bg-linear-to-b from-background via-secondary/10 to-background">
      {/* Header with back button */}
      <div className="flex items-center justify-between mb-8">
        {step > 1 ? (
          <button
            onClick={prevStep}
            className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={() => router.push("/")}
            className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Go home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        {/* Progress indicator */}
        <div className="flex gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                s === step
                  ? "bg-primary w-6"
                  : s < step
                    ? "bg-primary"
                    : "bg-muted"
              )}
            />
          ))}
        </div>

        {/* Spacer for alignment */}
        <div className="w-9" />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center max-w-sm mx-auto w-full">
        {/* Step 1: Avatar Selection */}
        {step === 1 && (
          <div className="w-full animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-semibold text-foreground mb-2">
                Choose Your Avatar
              </h1>
              <p className="text-muted-foreground">
                This is how you&apos;ll appear. No photos, no real names.
              </p>
            </div>

            <AvatarPicker
              selectedId={selectedAvatar?.id ?? null}
              onSelect={handleAvatarSelect}
            />

            {selectedAvatar && (
              <div className="mt-6 text-center animate-in fade-in duration-300">
                <p className="text-sm text-muted-foreground">
                  Selected: <span className="text-primary">{selectedAvatar.name}</span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Display Name */}
        {step === 2 && (
          <div className="w-full animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-8">
              {selectedAvatar && (
                <div className="flex justify-center mb-4">
                  <UserAvatar avatarId={selectedAvatar.id} size="lg" />
                </div>
              )}
              <h1 className="text-2xl font-semibold text-foreground mb-2">
                What should we call you?
              </h1>
              <p className="text-muted-foreground">
                Pick a name or get a random one. Not your real name!
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName" className="sr-only">
                  Display Name
                </Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Enter a display name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="h-12 text-center text-lg bg-muted/50 border-muted"
                  maxLength={20}
                />
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleGenerateRandomName}
                className="w-full h-11 border-dashed border-primary/50 text-primary hover:bg-primary/10"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Surprise Me
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: PIN Creation */}
        {step === 3 && (
          <div className="w-full animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-8">
              {selectedAvatar && (
                <div className="flex justify-center mb-4">
                  <UserAvatar avatarId={selectedAvatar.id} size="lg" />
                </div>
              )}
              <h1 className="text-2xl font-semibold text-foreground mb-2">
                Create a 4-digit PIN
              </h1>
              <p className="text-muted-foreground">
                This keeps your conversations private. Remember it!
              </p>
            </div>

            <div className="space-y-6">
              {/* PIN Input */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground text-center block">
                  Enter PIN
                </Label>
                <div className="flex justify-center gap-3">
                  {pin.map((digit, index) => (
                    <input
                      key={index}
                      ref={pinRefs[index]}
                      type="password"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handlePinChange(index, e.target.value, false)}
                      onKeyDown={(e) => handlePinKeyDown(index, e, false)}
                      className={cn(
                        "w-14 h-14 text-center text-2xl font-semibold rounded-xl",
                        "bg-muted/50 border-2 border-muted",
                        "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
                        "transition-all"
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* Confirm PIN Input */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground text-center block">
                  Confirm PIN
                </Label>
                <div className="flex justify-center gap-3">
                  {confirmPin.map((digit, index) => (
                    <input
                      key={index}
                      ref={confirmPinRefs[index]}
                      type="password"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handlePinChange(index, e.target.value, true)}
                      onKeyDown={(e) => handlePinKeyDown(index, e, true)}
                      className={cn(
                        "w-14 h-14 text-center text-2xl font-semibold rounded-xl",
                        "bg-muted/50 border-2 border-muted",
                        "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
                        "transition-all"
                      )}
                    />
                  ))}
                </div>
              </div>

              {(pinError || error) && (
                <p className="text-sm text-destructive text-center animate-in fade-in">
                  {pinError || error}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Action button */}
        <div className="w-full mt-auto pt-8">
          {step < 3 ? (
            <Button
              onClick={nextStep}
              disabled={!canContinue()}
              className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90 rounded-xl"
            >
              Continue
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canContinue() || isSubmitting}
              className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90 rounded-xl"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner size="sm" className="border-primary-foreground/30 border-t-primary-foreground" />
                  Creating...
                </span>
              ) : (
                "Create My Safe Space"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
