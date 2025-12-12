"use client"

/**
 * Counselor Login Page
 *
 * NOTE: This is a simplified authentication flow for hackathon/demo purposes.
 * In production, this would use proper authentication:
 * - Supabase Auth with email/password or magic links
 * - OAuth providers (Google, etc.)
 * - Multi-factor authentication
 * - Rate limiting on login attempts
 * - Account lockout after failed attempts
 * - Secure session management with HttpOnly cookies
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ShieldCheck, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function CounselorLoginPage() {
  const router = useRouter()
  const [displayName, setDisplayName] = useState("")
  const [pin, setPin] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!displayName.trim()) {
      setError("Please enter your display name")
      return
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setError("PIN must be 4 digits")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/counselor-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName.trim(),
          pin,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Login failed")
      }

      // Save counselor session
      localStorage.setItem("safespace_counselor_session", data.user.id)
      localStorage.setItem(
        "safespace_counselor_info",
        JSON.stringify({
          id: data.user.id,
          displayName: data.user.display_name,
          avatarId: data.user.avatar_id,
        })
      )

      // Redirect to dashboard
      router.push("/counselor/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 4)
    setPin(value)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-primary" />
          <span className="font-semibold text-foreground">SafeSpace Counselor</span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-8">
          {/* Title */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Counselor Login
            </h1>
            <p className="text-muted-foreground text-sm">
              Sign in to access the counselor dashboard
            </p>
          </div>

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Display name */}
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
                disabled={isLoading}
                className="h-12"
              />
            </div>

            {/* PIN */}
            <div className="space-y-2">
              <Label htmlFor="pin">PIN</Label>
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={handlePinChange}
                placeholder="4-digit PIN"
                maxLength={4}
                disabled={isLoading}
                className="h-12 text-center text-xl tracking-[0.5em] font-mono"
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 px-4 py-3 rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit button */}
            <Button
              type="submit"
              disabled={isLoading || !displayName.trim() || pin.length !== 4}
              className="w-full h-12 text-base"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Signup link */}
          <div className="text-center text-sm text-muted-foreground">
            <p>
              Don&apos;t have an account?{" "}
              <Link
                href="/counselor/signup"
                className="text-primary hover:underline font-medium"
              >
                Register as Counselor
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
