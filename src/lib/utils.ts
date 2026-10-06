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

/**
 * Checks if a phone number is a Portuguese mobile number (prefixes 91, 92, 93, or 96).
 * Handles national format as well as international prefixes (+351, 00351).
 */
export function isPortugueseMobile(phone?: string | null): boolean {
  if (!phone) return false
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '')
  let digits = cleaned
  if (digits.startsWith('+351')) {
    digits = digits.slice(4)
  } else if (digits.startsWith('00351')) {
    digits = digits.slice(5)
  } else if (digits.startsWith('351') && digits.length > 9) {
    digits = digits.slice(3)
  }
  return /^(91|92|93|96)/.test(digits)
}
