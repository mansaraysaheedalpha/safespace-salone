const RANDOM_NAMES = [
  "BraveHeart",
  "NewDawn",
  "GentleSoul",
  "HopefulOne",
  "CalmSpirit",
  "BrightStar",
  "PeacefulMind",
  "KindSoul",
  "WarmLight",
  "StrongHeart",
  "QuietStrength",
  "GentleWave",
  "SoftBreeze",
  "WiseOwl",
  "FreeBird",
  "RisingPhoenix",
  "TruePath",
  "OpenHeart",
  "ClearMind",
  "SteadyStep",
]

const SESSION_KEY = "safespace_user_id"

/**
 * Simple hash function for PIN (hackathon only!)
 * In production, use bcrypt or argon2 on the server
 */
export function hashPin(pin: string): string {
  // Simple hash using btoa + salt for hackathon demo
  // NOT SECURE FOR PRODUCTION
  const salt = "safespace_salone_2024"
  const combined = salt + pin + salt
  return btoa(combined)
}

/**
 * Verify PIN against stored hash
 */
export function verifyPin(pin: string, hash: string): boolean {
  return hashPin(pin) === hash
}

/**
 * Generate a random encouraging display name
 */
export function generateRandomName(): string {
  const randomIndex = Math.floor(Math.random() * RANDOM_NAMES.length)
  return RANDOM_NAMES[randomIndex]
}

/**
 * Get all available random names
 */
export function getRandomNames(): string[] {
  return [...RANDOM_NAMES]
}

/**
 * Save user session to localStorage
 */
export function saveUserSession(userId: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(SESSION_KEY, userId)
  }
}

/**
 * Get user session from localStorage
 */
export function getUserSession(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem(SESSION_KEY)
  }
  return null
}

/**
 * Clear user session from localStorage
 */
export function clearUserSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SESSION_KEY)
  }
}

/**
 * Check if user is logged in
 */
export function isLoggedIn(): boolean {
  return getUserSession() !== null
}
