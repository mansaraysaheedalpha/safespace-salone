"use client"

import Link from "next/link"
import { ShieldCheck, MessageCircle, Lock, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-muted/30">
      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md flex flex-col items-center text-center">

          {/* Logo */}
          <div className="relative mb-8 animate-in fade-in duration-700">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150" />
            <div className="relative bg-gradient-to-br from-primary/20 to-primary/5 p-5 rounded-full border border-primary/30">
              <ShieldCheck className="w-14 h-14 text-primary" strokeWidth={1.5} />
            </div>
          </div>

          {/* App Name */}
          <div className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              SafeSpace
            </h1>
            <span className="text-xl font-medium text-primary">
              Salone
            </span>
          </div>

          {/* Tagline */}
          <p className="text-muted-foreground mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            A safe place to talk.
            <br />
            <span className="text-foreground/80">Anonymous. Private. Always here.</span>
          </p>

          {/* Primary CTA */}
          <div className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <Button
              asChild
              size="lg"
              className="w-full h-14 text-base font-semibold rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
            >
              <Link href="/signup">
                Get Support
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full h-12 text-base rounded-xl"
            >
              <Link href="/login">
                I already have an account
              </Link>
            </Button>
          </div>

          {/* Features */}
          <div className="w-full mt-12 grid grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
            <div className="flex flex-col items-center gap-2 p-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Lock className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">Anonymous</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">Free Chat</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Heart className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">Real Support</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-6 text-center animate-in fade-in duration-700 delay-700">
        <Link
          href="/counselor/login"
          className="text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          I&apos;m a Counselor
        </Link>
        <p className="text-xs text-muted-foreground/60 mt-4">
          Your identity stays hidden. Your feelings matter.
        </p>
      </footer>

      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      </div>
    </div>
  )
}
