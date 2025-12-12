export type UserRole = 'patient' | 'counselor'

export type ConversationUrgency = 'low' | 'normal' | 'high'

export type ConversationStatus = 'active' | 'closed'

export type MessageType = 'text' | 'voice'

export interface User {
  id: string
  display_name: string
  avatar_id: string
  pin_hash: string
  role: UserRole
  created_at: string
}

export interface Conversation {
  id: string
  patient_id: string
  counselor_id: string | null
  topic: string
  urgency: ConversationUrgency
  status: ConversationStatus
  created_at: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  type: MessageType
  content: string
  duration: number | null
  created_at: string
  reply_to_id: string | null
  read_at: string | null
}

export interface ReplyToMessage {
  id: string
  content: string
  type: MessageType
  sender_id: string
}

export interface UserPresence {
  user_id: string
  is_online: boolean
  last_seen: string
  updated_at: string
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User
        Insert: Omit<User, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<User, 'id'>>
        Relationships: []
      }
      conversations: {
        Row: Conversation
        Insert: Omit<Conversation, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<Conversation, 'id'>>
        Relationships: [
          {
            foreignKeyName: "conversations_patient_id_fkey"
            columns: ["patient_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_counselor_id_fkey"
            columns: ["counselor_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      messages: {
        Row: Message
        Insert: Omit<Message, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<Message, 'id'>>
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: UserRole
      conversation_urgency: ConversationUrgency
      conversation_status: ConversationStatus
      message_type: MessageType
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
