/**
 * Counselor Expertise Categories
 *
 * These categories are used to:
 * 1. Allow counselors to select their areas of expertise during signup
 * 2. Route patient conversations to matching counselors
 */

export interface ExpertiseCategory {
  id: string
  name: string
  description: string
  icon: string // Lucide icon name
}

export const EXPERTISE_CATEGORIES: ExpertiseCategory[] = [
  {
    id: "anxiety",
    name: "Anxiety & Stress",
    description: "Help with worry, panic attacks, and stress management",
    icon: "Brain",
  },
  {
    id: "depression",
    name: "Depression",
    description: "Support for sadness, hopelessness, and low motivation",
    icon: "CloudRain",
  },
  {
    id: "relationships",
    name: "Relationships",
    description: "Family, romantic, and social relationship issues",
    icon: "Heart",
  },
  {
    id: "trauma",
    name: "Trauma & PTSD",
    description: "Processing traumatic experiences and PTSD symptoms",
    icon: "Shield",
  },
  {
    id: "addiction",
    name: "Addiction",
    description: "Substance abuse and behavioral addiction support",
    icon: "Pill",
  },
  {
    id: "grief",
    name: "Grief & Loss",
    description: "Coping with death, loss, and major life changes",
    icon: "Flower2",
  },
  {
    id: "self-esteem",
    name: "Self-Esteem",
    description: "Building confidence and self-worth",
    icon: "Sparkles",
  },
  {
    id: "anger",
    name: "Anger Management",
    description: "Managing anger, frustration, and emotional regulation",
    icon: "Flame",
  },
  {
    id: "sleep",
    name: "Sleep Issues",
    description: "Insomnia, sleep disorders, and sleep hygiene",
    icon: "Moon",
  },
  {
    id: "work",
    name: "Work & Career",
    description: "Job stress, career decisions, and workplace issues",
    icon: "Briefcase",
  },
  {
    id: "medical",
    name: "Medical Advice",
    description: "Health-related concerns (for medical professionals)",
    icon: "Stethoscope",
  },
  {
    id: "general",
    name: "General Support",
    description: "General mental health and emotional support",
    icon: "MessageCircleHeart",
  },
]

/**
 * Maps patient topics to counselor expertise categories
 * This allows routing conversations to counselors with matching expertise
 */
export const TOPIC_TO_EXPERTISE: Record<string, string> = {
  // Direct matches
  anxiety: "anxiety",
  depression: "depression",
  relationships: "relationships",
  trauma: "trauma",
  addiction: "addiction",
  grief: "grief",
  "self-esteem": "self-esteem",
  anger: "anger",
  sleep: "sleep",
  work: "work",

  // Mapped topics
  family: "relationships",
  stress: "anxiety",
  health: "medical",
  other: "general",

  // Fallback for any unmapped topics
  default: "general",
}

/**
 * Get expertise category ID for a given topic
 */
export function getExpertiseForTopic(topic: string): string {
  const lowerTopic = topic.toLowerCase()
  return TOPIC_TO_EXPERTISE[lowerTopic] || TOPIC_TO_EXPERTISE.default
}

/**
 * Get expertise category details by ID
 */
export function getExpertiseById(id: string): ExpertiseCategory | undefined {
  return EXPERTISE_CATEGORIES.find((e) => e.id === id)
}
