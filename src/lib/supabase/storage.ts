import { createClient } from "./client"

const VOICE_NOTES_BUCKET = "voice-notes"

/**
 * Upload a voice note to Supabase Storage
 * @param conversationId - The conversation ID
 * @param blob - The audio blob to upload
 * @returns The public URL of the uploaded file
 */
export async function uploadVoiceNote(
  conversationId: string,
  blob: Blob
): Promise<string> {
  const supabase = createClient()

  // Generate unique filename
  const timestamp = Date.now()
  const extension = getExtensionFromMimeType(blob.type)
  const filePath = `${conversationId}/${timestamp}.${extension}`

  // Upload to storage
  const { data, error } = await supabase.storage
    .from(VOICE_NOTES_BUCKET)
    .upload(filePath, blob, {
      contentType: blob.type,
      cacheControl: "3600",
      upsert: false,
    })

  if (error) {
    console.error("Upload voice note error:", error)
    throw new Error("Failed to upload voice note")
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(VOICE_NOTES_BUCKET)
    .getPublicUrl(data.path)

  return urlData.publicUrl
}

/**
 * Delete a voice note from storage
 * @param url - The public URL of the voice note
 */
export async function deleteVoiceNote(url: string): Promise<void> {
  const supabase = createClient()

  // Extract path from URL
  const urlObj = new URL(url)
  const pathMatch = urlObj.pathname.match(/\/voice-notes\/(.+)$/)
  if (!pathMatch) return

  const filePath = pathMatch[1]

  const { error } = await supabase.storage
    .from(VOICE_NOTES_BUCKET)
    .remove([filePath])

  if (error) {
    console.error("Delete voice note error:", error)
  }
}

/**
 * Get file extension from MIME type
 */
function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    "audio/webm": "webm",
    "audio/webm;codecs=opus": "webm",
    "audio/mp4": "m4a",
    "audio/mpeg": "mp3",
    "audio/ogg": "ogg",
    "audio/wav": "wav",
  }
  return mimeToExt[mimeType] || "webm"
}

/**
 * Create a local object URL for audio preview (doesn't upload)
 * @param blob - The audio blob
 * @returns Local object URL
 */
export function createLocalAudioUrl(blob: Blob): string {
  return URL.createObjectURL(blob)
}

/**
 * Revoke a local object URL to free memory
 * @param url - The object URL to revoke
 */
export function revokeLocalAudioUrl(url: string): void {
  if (url.startsWith("blob:")) {
    URL.revokeObjectURL(url)
  }
}
