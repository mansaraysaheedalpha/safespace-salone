import Link from "next/link"
import { Shield, Home, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-background">
      <div className="text-center max-w-md mx-auto page-enter">
        {/* Icon */}
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Shield className="w-12 h-12 text-primary" strokeWidth={1.5} />
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-foreground mb-2">404</h1>
        <h2 className="text-xl font-medium text-foreground mb-4">
          Page Not Found
        </h2>

        {/* Message */}
        <p className="text-muted-foreground mb-8">
          Don&apos;t worry, you&apos;re still safe here.
          <br />
          Let&apos;s get you back to familiar ground.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild className="btn-press">
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Link>
          </Button>
          <Button asChild variant="outline" className="btn-press">
            <Link href="/topics">
              <MessageCircle className="w-4 h-4 mr-2" />
              Start a Chat
            </Link>
          </Button>
        </div>

        {/* Supportive message */}
        <p className="text-sm text-muted-foreground mt-12">
          Remember: It&apos;s okay to ask for help.
          <br />
          <span className="text-primary">SafeSpace</span> is here for you.
        </p>
      </div>
    </div>
  )
}
