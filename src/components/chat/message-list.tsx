"use client"

import { useEffect, useRef, useMemo, useCallback, memo } from "react"
import { MessageCircle } from "lucide-react"
import { MessageBubble } from "./message-bubble"
import type { Message, ReplyToMessage } from "@/types/database"

interface ExtendedMessage extends Message {
  replyTo?: ReplyToMessage | null
  status?: "sending" | "sent" | "error"
}

interface MessageListProps {
  messages: (Message | ExtendedMessage)[]
  currentUserId: string
  getUserInfo: (userId: string) => { avatarId?: string; name?: string } | undefined
  onDeleteMessage?: (messageId: string) => void
  onReplyMessage?: (message: ReplyToMessage) => void
}

export const MessageList = memo(function MessageList({
  messages,
  currentUserId,
  getUserInfo,
  onDeleteMessage,
  onReplyMessage,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Create a map for quick message lookup (for reply references)
  const messageMap = useMemo(() => {
    const map = new Map<string, Message | ExtendedMessage>()
    messages.forEach(msg => map.set(msg.id, msg))
    return map
  }, [messages])

  // Group messages by date - memoized for performance
  const messageGroups = useMemo(() => {
    const groups: { date: string; messages: (Message | ExtendedMessage)[] }[] = []
    let currentDate = ""

    messages.forEach((msg) => {
      const msgDate = new Date(msg.created_at).toLocaleDateString([], {
        weekday: "long",
        month: "short",
        day: "numeric",
      })

      if (msgDate !== currentDate) {
        currentDate = msgDate
        groups.push({ date: msgDate, messages: [msg] })
      } else {
        groups[groups.length - 1].messages.push(msg)
      }
    })

    return groups
  }, [messages])

  // Get reply info for a message - memoized callback
  const getReplyTo = useCallback((msg: Message | ExtendedMessage): ReplyToMessage | null => {
    if (!msg.reply_to_id) return null

    // First check if replyTo is already populated
    if ('replyTo' in msg && msg.replyTo) return msg.replyTo

    // Otherwise look it up in the message map
    const replyMsg = messageMap.get(msg.reply_to_id)
    if (!replyMsg) return null

    return {
      id: replyMsg.id,
      content: replyMsg.content || "",
      type: replyMsg.type,
      sender_id: replyMsg.sender_id,
    }
  }, [messageMap])

  // Check if should show avatar (first message or different sender)
  const shouldShowAvatar = useCallback((msg: Message | ExtendedMessage, index: number, groupMsgs: (Message | ExtendedMessage)[]) => {
    if (index === 0) return true
    return groupMsgs[index - 1].sender_id !== msg.sender_id
  }, [])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <MessageCircle className="w-8 h-8 text-primary" strokeWidth={1.5} />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          This is a safe space
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Share when you&apos;re ready. Your counselor will respond as soon as they can.
        </p>
      </div>
    )
  }

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-4 py-4 space-y-6"
    >
      {messageGroups.map((group, groupIndex) => (
        <div key={groupIndex} className="space-y-3">
          {/* Date separator */}
          <div className="flex items-center justify-center">
            <div className="bg-muted px-3 py-1 rounded-full">
              <span className="text-xs text-muted-foreground">
                {group.date}
              </span>
            </div>
          </div>

          {/* Messages in this group */}
          {group.messages.map((message, msgIndex) => {
            const isOwn = message.sender_id === currentUserId
            const senderInfo = getUserInfo(message.sender_id)

            // Add replyTo info to the message
            const messageWithReply = {
              ...message,
              replyTo: getReplyTo(message),
            }

            return (
              <MessageBubble
                key={message.id}
                message={messageWithReply}
                isOwn={isOwn}
                senderAvatarId={senderInfo?.avatarId}
                senderName={senderInfo?.name}
                showAvatar={shouldShowAvatar(message, msgIndex, group.messages)}
                onDelete={onDeleteMessage}
                onReply={onReplyMessage}
              />
            )
          })}
        </div>
      ))}

      {/* Scroll anchor */}
      <div ref={bottomRef} />
    </div>
  )
})
