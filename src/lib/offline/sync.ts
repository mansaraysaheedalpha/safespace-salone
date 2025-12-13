"use client"

import {
  getPendingMessages,
  removePendingMessage,
  updatePendingMessageRetry,
} from "./db"

const MAX_RETRIES = 3

interface SyncResult {
  synced: number
  failed: number
  pending: number
}

// Sync all pending messages
export async function syncPendingMessages(): Promise<SyncResult> {
  const result: SyncResult = { synced: 0, failed: 0, pending: 0 }

  try {
    const pendingMessages = await getPendingMessages()
    result.pending = pendingMessages.length

    if (pendingMessages.length === 0) {
      return result
    }

    console.log(`[Sync] Syncing ${pendingMessages.length} pending messages...`)

    for (const message of pendingMessages) {
      // Skip messages that have exceeded max retries
      if (message.retryCount >= MAX_RETRIES) {
        console.log(`[Sync] Message ${message.id} exceeded max retries, removing`)
        await removePendingMessage(message.id)
        result.failed++
        continue
      }

      try {
        const response = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversation_id: message.conversation_id,
            sender_id: message.sender_id,
            type: message.type,
            content: message.content,
            duration: message.duration,
            reply_to_id: message.reply_to_id,
          }),
        })

        if (response.ok) {
          await removePendingMessage(message.id)
          result.synced++
          console.log(`[Sync] Message ${message.id} synced successfully`)
        } else {
          await updatePendingMessageRetry(message.id)
          result.failed++
          console.log(`[Sync] Message ${message.id} failed to sync:`, await response.text())
        }
      } catch (error) {
        await updatePendingMessageRetry(message.id)
        result.failed++
        console.error(`[Sync] Error syncing message ${message.id}:`, error)
      }
    }

    return result
  } catch (error) {
    console.error("[Sync] Error getting pending messages:", error)
    return result
  }
}

// Register background sync (for browsers that support it)
export async function registerBackgroundSync(): Promise<boolean> {
  if (typeof window === "undefined") return false

  try {
    const registration = await navigator.serviceWorker.ready

    if ("sync" in registration) {
      await (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register("sync-messages")
      console.log("[Sync] Background sync registered")
      return true
    }
  } catch (error) {
    console.log("[Sync] Background sync not supported:", error)
  }

  return false
}

// Listen for sync messages from service worker
export function listenForSyncMessages(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {}

  const handleMessage = (event: MessageEvent) => {
    if (event.data?.type === "SYNC_MESSAGES") {
      console.log("[Sync] Received sync message from SW")
      callback()
    }
  }

  navigator.serviceWorker?.addEventListener("message", handleMessage)

  return () => {
    navigator.serviceWorker?.removeEventListener("message", handleMessage)
  }
}
