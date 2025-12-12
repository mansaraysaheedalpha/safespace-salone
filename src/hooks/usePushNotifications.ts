"use client"

import { useState, useEffect, useCallback } from "react"

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray.buffer as ArrayBuffer
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Check if push notifications are supported
  useEffect(() => {
    const checkSupport = async () => {
      if (
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        VAPID_PUBLIC_KEY
      ) {
        setIsSupported(true)
        try {
          // Register service worker
          const reg = await navigator.serviceWorker.register("/sw.js")
          setRegistration(reg)
          console.log("[Push] Service worker registered")

          // Check if already subscribed
          const subscription = await reg.pushManager.getSubscription()
          setIsSubscribed(!!subscription)
        } catch (err) {
          console.error("[Push] Service worker registration failed:", err)
          setError("Failed to register service worker")
        }
      }
    }

    checkSupport()
  }, [])

  // Subscribe to push notifications
  const subscribe = useCallback(
    async (userId: string, userType: "patient" | "counselor" = "counselor") => {
      if (!isSupported || !registration || !VAPID_PUBLIC_KEY) {
        console.log("[Push] Not supported or not ready")
        return false
      }

      try {
        // Request notification permission
        const permission = await Notification.requestPermission()
        if (permission !== "granted") {
          setError("Notification permission denied")
          return false
        }

        // Subscribe to push
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        })

        console.log("[Push] Subscribed:", subscription)

        // Save subscription to server
        const response = await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            user_type: userType,
            subscription: subscription.toJSON(),
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to save subscription")
        }

        setIsSubscribed(true)
        setError(null)
        console.log("[Push] Subscription saved to server")
        return true
      } catch (err) {
        console.error("[Push] Subscribe error:", err)
        setError(err instanceof Error ? err.message : "Failed to subscribe")
        return false
      }
    },
    [isSupported, registration]
  )

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(
    async (userId: string) => {
      if (!registration) return false

      try {
        const subscription = await registration.pushManager.getSubscription()
        if (subscription) {
          await subscription.unsubscribe()

          // Remove from server
          await fetch(
            `/api/push/subscribe?user_id=${userId}&endpoint=${encodeURIComponent(
              subscription.endpoint
            )}`,
            { method: "DELETE" }
          )
        }

        setIsSubscribed(false)
        return true
      } catch (err) {
        console.error("[Push] Unsubscribe error:", err)
        setError(err instanceof Error ? err.message : "Failed to unsubscribe")
        return false
      }
    },
    [registration]
  )

  return {
    isSupported,
    isSubscribed,
    error,
    subscribe,
    unsubscribe,
  }
}
