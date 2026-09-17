import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility for merging Tailwind CSS classes with clsx.
 * Used by shadcn/ui components.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Gets up to 2 uppercase initials from a person's name or email.
 * E.g.: "Rui Mariano" -> "RM", "admin@apmee.pt" -> "AD", "Mariano" -> "MA"
 */
export function getInitials(name?: string | null): string {
  if (!name) return 'AP'
  if (name.includes('@')) {
    const userPart = name.split('@')[0]
    return userPart.slice(0, 2).toUpperCase()
  }
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'AP'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
