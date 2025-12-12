"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Shield, Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserAvatar } from "@/components/user-avatar"
import { ExpertiseSelector } from "@/components/expertise-selector"
import { avatars } from "@/data/avatars"
import { cn } from "@/lib/utils"

export default function CounselorSignupPage() {
  const router = useRouter()
  const [displayName, setDisplayName] = useState("")
  const [selectedAvatar, setSelectedAvatar] = useState("calm-ocean")
  const [selectedExpertise, setSelectedExpertise] = useState<string[]>([])
  const [pin, setPin] = useState("")
  const [confirmPin, setConfirmPin] = useState("")
  const [showPin, setShowPin] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validation
    if (!displayName.trim()) {
      setError("Please enter your name")
      return
    }

    if (displayName.trim().length < 2) {
      setError("Name must be at least 2 characters")
      return
    }

    if (selectedExpertise.length === 0) {
      setError("Please select at least one area of expertise")
      return
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setError("PIN must be exactly 4 digits")
      return
    }

    if (pin !== confirmPin) {
      setError("PINs do not match")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/counselor-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName.trim(),
          avatar_id: selectedAvatar,
          expertise: selectedExpertise,
          pin,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create account")
      }

      // Store counselor session and info in localStorage
      localStorage.setItem("safespace_counselor_session", data.user.id)
      localStorage.setItem(
        "safespace_counselor_info",
        JSON.stringify({
          id: data.user.id,
          displayName: data.user.display_name,
          avatarId: data.user.avatar_id,
          expertise: data.user.expertise,
        })
      )

      // Redirect to dashboard
      router.push("/counselor/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col px-6 py-8 bg-background">
      {/* Back link */}
      <Link
        href="/counselor/login"
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Back to login</span>
      </Link>

      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Join as Counselor</h1>
        <p className="text-muted-foreground mt-2">
          Create your counselor account to help others
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-md mx-auto w-full space-y-6">
        {/* Avatar selection */}
        <div className="space-y-3">
          <Label>Choose your avatar</Label>
          <div className="grid grid-cols-4 gap-3">
            {avatars.map((avatar) => (
              <button
                key={avatar.id}
                type="button"
                onClick={() => setSelectedAvatar(avatar.id)}
                className={cn(
                  "p-2 rounded-xl border-2 transition-all",
                  selectedAvatar === avatar.id
                    ? "border-primary bg-primary/10"
                    : "border-transparent hover:border-border"
                )}
              >
                <UserAvatar avatarId={avatar.id} size="md" />
              </button>
            ))}
          </div>
        </div>

        {/* Display name */}
        <div className="space-y-2">
          <Label htmlFor="displayName">Your professional name</Label>
          <Input
            id="displayName"
            type="text"
            placeholder="Dr. Hope"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="h-12"
            maxLength={30}
          />
          <p className="text-xs text-muted-foreground">
            This is how patients will see you
          </p>
        </div>

        {/* Expertise selection */}
        <div className="space-y-3">
          <Label>
            Areas of expertise{" "}
            <span className="text-muted-foreground font-normal">
              (select all that apply)
            </span>
          </Label>
          <ExpertiseSelector
            selected={selectedExpertise}
            onChange={setSelectedExpertise}
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground">
            You&apos;ll only see conversations matching your expertise
          </p>
        </div>

        {/* PIN */}
        <div className="space-y-2">
          <Label htmlFor="pin">Create a 4-digit PIN</Label>
          <div className="relative">
            <Input
              id="pin"
              type={showPin ? "text" : "password"}
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className="h-12 pr-10 text-center tracking-widest text-lg"
              maxLength={4}
              inputMode="numeric"
            />
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Confirm PIN */}
        <div className="space-y-2">
          <Label htmlFor="confirmPin">Confirm PIN</Label>
          <Input
            id="confirmPin"
            type={showPin ? "text" : "password"}
            placeholder="••••"
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            className="h-12 text-center tracking-widest text-lg"
            maxLength={4}
            inputMode="numeric"
          />
        </div>

        {/* Error message */}
        {error && (
          <p className="text-sm text-destructive text-center animate-in fade-in">
            {error}
          </p>
        )}

        {/* Submit button */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 text-base font-medium btn-press"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create Counselor Account"
          )}
        </Button>

        {/* Login link */}
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/counselor/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  )
}
