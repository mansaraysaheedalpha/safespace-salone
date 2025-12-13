"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { ShieldCheck, LogOut, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/components/user-avatar"

interface CounselorInfo {
  id: string
  displayName: string
  avatarId: string
}

export default function CounselorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [counselorInfo, setCounselorInfo] = useState<CounselorInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for counselor session
  useEffect(() => {
    const checkSession = () => {
      // Skip auth check on login and signup pages
      if (pathname === "/counselor/login" || pathname === "/counselor/signup") {
        setIsLoading(false)
        return
      }

      const sessionId = localStorage.getItem("safespace_counselor_session")
      const storedInfo = localStorage.getItem("safespace_counselor_info")

      if (!sessionId || !storedInfo) {
        router.push("/counselor/login")
        return
      }

      try {
        const info = JSON.parse(storedInfo)
        setCounselorInfo(info)
      } catch {
        // Invalid session, redirect to login
        localStorage.removeItem("safespace_counselor_session")
        localStorage.removeItem("safespace_counselor_info")
        router.push("/counselor/login")
        return
      }

      setIsLoading(false)
    }

    checkSession()
  }, [pathname, router])

  const handleLogout = () => {
    localStorage.removeItem("safespace_counselor_session")
    localStorage.removeItem("safespace_counselor_info")
    router.push("/counselor/login")
  }

  // Show loading state while checking session
  const isAuthPage = pathname === "/counselor/login" || pathname === "/counselor/signup"

  if (isLoading && !isAuthPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // Login and signup pages don't need the header
  if (isAuthPage) {
    return <>{children}</>
  }

  // Chat pages have their own header, so don't show layout header
  const isChatPage = pathname?.startsWith("/counselor/chat")
  if (isChatPage) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo and title */}
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            <span className="font-semibold text-foreground">SafeSpace Counselor</span>
          </div>

          {/* User info and logout */}
          <div className="flex items-center gap-3">
            {counselorInfo && (
              <>
                <div className="flex items-center gap-2">
                  <UserAvatar avatarId={counselorInfo.avatarId} size="sm" />
                  <span className="text-sm font-medium text-foreground hidden sm:block">
                    {counselorInfo.displayName}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <LogOut className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main content with padding for fixed header */}
      <main className="flex-1 pt-16">
        {children}
      </main>
    </div>
  )
}
