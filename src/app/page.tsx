"use client"

import Link from "next/link"
import { ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-linear-to-b from-background via-secondary/20 to-background">
      {/* Main content container */}
      <div className="w-full max-w-100 flex flex-col items-center text-center space-y-8 animate-in fade-in duration-1000">

        {/* Logo/Icon */}
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150" />
          <div className="relative bg-linear-to-br from-primary/20 to-secondary/20 p-6 rounded-full border border-primary/20">
            <ShieldCheck className="w-16 h-16 text-primary" strokeWidth={1.5} />
          </div>
        </div>

        {/* App Name */}
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">
            SafeSpace
            <span className="block text-2xl font-normal text-primary mt-1">
              Salone
            </span>
          </h1>
        </div>

        {/* Tagline */}
        <p className="text-lg text-muted-foreground leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
          A safe place to talk.
          <br />
          <span className="text-foreground/80">Anonymous. Private. Always here.</span>
        </p>

        {/* Action Buttons */}
        <div className="w-full space-y-3 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
          <Button
            asChild
            size="lg"
            className="w-full h-14 text-lg font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02]"
          >
            <Link href="/signup">
              Get Support
            </Link>
          </Button>

          <Button
            asChild
            variant="ghost"
            size="lg"
            className="w-full h-12 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-xl transition-all"
          >
            <Link href="/counselor/login">
              I&apos;m a Counselor
            </Link>
          </Button>
        </div>

        {/* Footer message */}
        <p className="text-sm text-muted-foreground/70 pt-8 animate-in fade-in duration-1000 delay-700">
          Your identity stays hidden.
          <br />
          <span className="text-accent/80">Your feelings matter.</span>
        </p>
      </div>

      {/* Decorative elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-secondary/10 rounded-full blur-3xl" />
      </div>
    </div>
  )
}
