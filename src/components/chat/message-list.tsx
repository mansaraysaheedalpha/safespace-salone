"use client"

import { useEffect, useRef } from "react"
import { MessageCircle } from "lucide-react"
import { MessageBubble } from "./message-bubble"
import type { Message } from "@/types/database"

interface MessageListProps {
  messages: Message[]
  currentUserId: string
  getUserInfo: (userId: string) => { avatarId?: string; name?: string } | undefined
}

export function MessageList({
  messages,
  currentUserId,
  getUserInfo,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Group messages by date
  const groupMessagesByDate = (msgs: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = []
    let currentDate = ""

    msgs.forEach((msg) => {
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
  }

  const messageGroups = groupMessagesByDate(messages)

  // Check if should show avatar (first message or different sender)
  const shouldShowAvatar = (msg: Message, index: number, groupMsgs: Message[]) => {
    if (index === 0) return true
    return groupMsgs[index - 1].sender_id !== msg.sender_id
  }

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

            return (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={isOwn}
                senderAvatarId={senderInfo?.avatarId}
                senderName={senderInfo?.name}
                showAvatar={shouldShowAvatar(message, msgIndex, group.messages)}
              />
            )
          })}
        </div>
      ))}

      {/* Scroll anchor */}
      <div ref={bottomRef} />
    </div>
  )
}
