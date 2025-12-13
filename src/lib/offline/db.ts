// IndexedDB storage for offline support
import type { Message, Conversation } from "@/types/database"

const DB_NAME = "safespace-offline"
const DB_VERSION = 1

// Store names
const STORES = {
  MESSAGES: "messages",
  CONVERSATIONS: "conversations",
  PENDING_MESSAGES: "pending_messages",
  USER_DATA: "user_data",
}

interface PendingMessage {
  id: string
  conversation_id: string
  sender_id: string
  type: "text" | "voice"
  content: string
  duration?: number
  reply_to_id?: string
  created_at: string
  retryCount: number
}

// Open database connection
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB not available"))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Messages store - indexed by conversation_id
      if (!db.objectStoreNames.contains(STORES.MESSAGES)) {
        const messagesStore = db.createObjectStore(STORES.MESSAGES, { keyPath: "id" })
        messagesStore.createIndex("conversation_id", "conversation_id", { unique: false })
        messagesStore.createIndex("created_at", "created_at", { unique: false })
      }

      // Conversations store
      if (!db.objectStoreNames.contains(STORES.CONVERSATIONS)) {
        const convStore = db.createObjectStore(STORES.CONVERSATIONS, { keyPath: "id" })
        convStore.createIndex("patient_id", "patient_id", { unique: false })
        convStore.createIndex("counselor_id", "counselor_id", { unique: false })
        convStore.createIndex("status", "status", { unique: false })
      }

      // Pending messages (to sync when online)
      if (!db.objectStoreNames.contains(STORES.PENDING_MESSAGES)) {
        const pendingStore = db.createObjectStore(STORES.PENDING_MESSAGES, { keyPath: "id" })
        pendingStore.createIndex("conversation_id", "conversation_id", { unique: false })
        pendingStore.createIndex("created_at", "created_at", { unique: false })
      }

      // User data (session info, etc.)
      if (!db.objectStoreNames.contains(STORES.USER_DATA)) {
        db.createObjectStore(STORES.USER_DATA, { keyPath: "key" })
      }
    }
  })
}

// Messages operations
export async function saveMessages(messages: Message[]): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(STORES.MESSAGES, "readwrite")
  const store = tx.objectStore(STORES.MESSAGES)

  for (const message of messages) {
    store.put(message)
  }

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onerror = () => {
      db.close()
      reject(tx.error)
    }
  })
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const db = await openDB()
  const tx = db.transaction(STORES.MESSAGES, "readonly")
  const store = tx.objectStore(STORES.MESSAGES)
  const index = store.index("conversation_id")

  return new Promise((resolve, reject) => {
    const request = index.getAll(conversationId)
    request.onsuccess = () => {
      db.close()
      const messages = request.result as Message[]
      // Sort by created_at
      messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      resolve(messages)
    }
    request.onerror = () => {
      db.close()
      reject(request.error)
    }
  })
}

export async function deleteMessages(conversationId: string): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(STORES.MESSAGES, "readwrite")
  const store = tx.objectStore(STORES.MESSAGES)
  const index = store.index("conversation_id")

  return new Promise((resolve, reject) => {
    const request = index.getAllKeys(conversationId)
    request.onsuccess = () => {
      const keys = request.result
      keys.forEach(key => store.delete(key))
    }
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onerror = () => {
      db.close()
      reject(tx.error)
    }
  })
}

// Conversations operations
export async function saveConversations(conversations: Conversation[]): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(STORES.CONVERSATIONS, "readwrite")
  const store = tx.objectStore(STORES.CONVERSATIONS)

  for (const conv of conversations) {
    store.put(conv)
  }

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onerror = () => {
      db.close()
      reject(tx.error)
    }
  })
}

export async function getConversation(conversationId: string): Promise<Conversation | null> {
  const db = await openDB()
  const tx = db.transaction(STORES.CONVERSATIONS, "readonly")
  const store = tx.objectStore(STORES.CONVERSATIONS)

  return new Promise((resolve, reject) => {
    const request = store.get(conversationId)
    request.onsuccess = () => {
      db.close()
      resolve(request.result || null)
    }
    request.onerror = () => {
      db.close()
      reject(request.error)
    }
  })
}

export async function getConversationsByUser(userId: string, role: "patient" | "counselor"): Promise<Conversation[]> {
  const db = await openDB()
  const tx = db.transaction(STORES.CONVERSATIONS, "readonly")
  const store = tx.objectStore(STORES.CONVERSATIONS)
  const indexName = role === "patient" ? "patient_id" : "counselor_id"
  const index = store.index(indexName)

  return new Promise((resolve, reject) => {
    const request = index.getAll(userId)
    request.onsuccess = () => {
      db.close()
      resolve(request.result as Conversation[])
    }
    request.onerror = () => {
      db.close()
      reject(request.error)
    }
  })
}

// Pending messages (offline queue)
export async function addPendingMessage(message: PendingMessage): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(STORES.PENDING_MESSAGES, "readwrite")
  const store = tx.objectStore(STORES.PENDING_MESSAGES)
  store.put(message)

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onerror = () => {
      db.close()
      reject(tx.error)
    }
  })
}

export async function getPendingMessages(): Promise<PendingMessage[]> {
  const db = await openDB()
  const tx = db.transaction(STORES.PENDING_MESSAGES, "readonly")
  const store = tx.objectStore(STORES.PENDING_MESSAGES)

  return new Promise((resolve, reject) => {
    const request = store.getAll()
    request.onsuccess = () => {
      db.close()
      const messages = request.result as PendingMessage[]
      // Sort by created_at
      messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      resolve(messages)
    }
    request.onerror = () => {
      db.close()
      reject(request.error)
    }
  })
}

export async function removePendingMessage(id: string): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(STORES.PENDING_MESSAGES, "readwrite")
  const store = tx.objectStore(STORES.PENDING_MESSAGES)
  store.delete(id)

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onerror = () => {
      db.close()
      reject(tx.error)
    }
  })
}

export async function updatePendingMessageRetry(id: string): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(STORES.PENDING_MESSAGES, "readwrite")
  const store = tx.objectStore(STORES.PENDING_MESSAGES)

  return new Promise((resolve, reject) => {
    const getRequest = store.get(id)
    getRequest.onsuccess = () => {
      const message = getRequest.result as PendingMessage | undefined
      if (message) {
        message.retryCount = (message.retryCount || 0) + 1
        store.put(message)
      }
    }
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onerror = () => {
      db.close()
      reject(tx.error)
    }
  })
}

// User data operations
export async function saveUserData(key: string, data: unknown): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(STORES.USER_DATA, "readwrite")
  const store = tx.objectStore(STORES.USER_DATA)
  store.put({ key, data, updatedAt: new Date().toISOString() })

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onerror = () => {
      db.close()
      reject(tx.error)
    }
  })
}

export async function getUserData<T>(key: string): Promise<T | null> {
  const db = await openDB()
  const tx = db.transaction(STORES.USER_DATA, "readonly")
  const store = tx.objectStore(STORES.USER_DATA)

  return new Promise((resolve, reject) => {
    const request = store.get(key)
    request.onsuccess = () => {
      db.close()
      resolve(request.result?.data || null)
    }
    request.onerror = () => {
      db.close()
      reject(request.error)
    }
  })
}

// Clear all offline data
export async function clearAllOfflineData(): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(
    [STORES.MESSAGES, STORES.CONVERSATIONS, STORES.PENDING_MESSAGES, STORES.USER_DATA],
    "readwrite"
  )

  tx.objectStore(STORES.MESSAGES).clear()
  tx.objectStore(STORES.CONVERSATIONS).clear()
  tx.objectStore(STORES.PENDING_MESSAGES).clear()
  tx.objectStore(STORES.USER_DATA).clear()

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onerror = () => {
      db.close()
      reject(tx.error)
    }
  })
}

// Get pending message count (for badges)
export async function getPendingMessageCount(): Promise<number> {
  const db = await openDB()
  const tx = db.transaction(STORES.PENDING_MESSAGES, "readonly")
  const store = tx.objectStore(STORES.PENDING_MESSAGES)

  return new Promise((resolve, reject) => {
    const request = store.count()
    request.onsuccess = () => {
      db.close()
      resolve(request.result)
    }
    request.onerror = () => {
      db.close()
      reject(request.error)
    }
  })
}
