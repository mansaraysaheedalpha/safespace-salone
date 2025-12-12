"use client"

import React from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <ErrorFallback
          error={this.state.error}
          onRetry={this.handleRetry}
        />
      )
    }

    return this.props.children
  }
}

interface ErrorFallbackProps {
  error?: Error | null
  onRetry?: () => void
  title?: string
  description?: string
}

export function ErrorFallback({
  error,
  onRetry,
  title = "Something went wrong",
  description = "We're sorry, but something unexpected happened. Please try again.",
}: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] px-6 py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-destructive" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm max-w-sm mb-6">{description}</p>

      {process.env.NODE_ENV === "development" && error && (
        <pre className="text-xs text-destructive bg-destructive/10 px-4 py-2 rounded-lg mb-6 max-w-md overflow-auto">
          {error.message}
        </pre>
      )}

      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      )}
    </div>
  )
}

// Hook for handling async errors
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  const handleError = React.useCallback((err: unknown) => {
    if (err instanceof Error) {
      setError(err)
    } else {
      setError(new Error(String(err)))
    }
  }, [])

  const clearError = React.useCallback(() => {
    setError(null)
  }, [])

  return { error, handleError, clearError }
}

// Inline error component for smaller error states
interface InlineErrorProps {
  message: string
  onRetry?: () => void
  className?: string
}

export function InlineError({ message, onRetry, className }: InlineErrorProps) {
  return (
    <div
      className={`flex items-center gap-2 text-destructive text-sm bg-destructive/10 px-4 py-3 rounded-lg ${className}`}
    >
      <AlertTriangle className="w-4 h-4 shrink-0" />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-destructive hover:underline text-xs font-medium"
        >
          Retry
        </button>
      )}
    </div>
  )
}
