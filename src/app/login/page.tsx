"use client"

/**
 * Patient Login Page
 *
 * PIN-only login for quick access.
 * Handles redirect parameter for notification click navigation.
 */

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Heart, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function PatientLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pin, setPin] = useState("")
  const [showPin, setShowPin] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null)

  // Get redirect URL from query params
  useEffect(() => {
    const redirect = searchParams.get("redirect")
    if (redirect) {
      setRedirectUrl(decodeURIComponent(redirect))
    }
  }, [searchParams])

  // Check if already logged in
  useEffect(() => {
    const session = localStorage.getItem("safespace_user_id")
    if (session && redirectUrl) {
      // Already logged in and has redirect, go there
      router.push(redirectUrl)
    }
  }, [router, redirectUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setError("PIN must be 4 digits")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Login failed")
      }

      // Save patient session
      localStorage.setItem("safespace_user_id", data.user.id)
      localStorage.setItem(
        "safespace_user_info",
        JSON.stringify({
          id: data.user.id,
          displayName: data.user.display_name,
          avatarId: data.user.avatar_id,
        })
      )

      // Redirect priority: redirect param > active conversation > topics
      if (redirectUrl) {
        router.push(redirectUrl)
      } else if (data.activeConversation) {
        router.push(`/chat/${data.activeConversation.id}`)
      } else {
        router.push("/topics")
      }
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
        <Link href="/" className="flex items-center gap-2">
          <Heart className="w-6 h-6 text-primary" />
          <span className="font-semibold text-foreground">SafeSpace Salone</span>
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-8">
          {/* Title */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Welcome Back
            </h1>
            <p className="text-muted-foreground text-sm">
              Enter your PIN to continue
            </p>
          </div>

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* PIN */}
            <div className="space-y-2">
              <Label htmlFor="pin">PIN</Label>
              <div className="relative">
                <Input
                  id="pin"
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  value={pin}
                  onChange={handlePinChange}
                  placeholder="Enter 4-digit PIN"
                  maxLength={4}
                  disabled={isLoading}
                  autoFocus
                  className="h-14 text-center text-2xl tracking-[0.5em] font-mono pr-12"
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
              disabled={isLoading || pin.length !== 4}
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
                href="/signup"
                className="text-primary hover:underline font-medium"
              >
                Create one
              </Link>
            </p>
          </div>

          {/* Back to home */}
          <div className="text-center">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Back to home
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function PatientLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <PatientLoginForm />
    </Suspense>
  )
}
