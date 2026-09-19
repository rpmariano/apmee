import { formatSchoolYear } from '@/lib/school-year'
import type { FinancialMovement } from '@/types/database'

/**
 * Normalizes a quota movement description into a unique key: `${year}:${cleanedName}`.
 * Allows identifying identical quota payments regardless of formatting (em-dash, hyphen, full year, etc.).
 * 
 * Examples:
 * - "Quota 25/26 — Manuel Marques" -> "25/26:manuel marques"
 * - "Quota 25/26 - Manuel Marques"  -> "25/26:manuel marques"
 * - "Quota 2025/2026 — Manuel Marques" -> "25/26:manuel marques"
 */
export function getQuotaDeduplicationKey(description: string): string {
  if (!description) return ''
  const clean = description.toLowerCase().trim()

  // Extract year if present (e.g. 25/26 or 2025/2026 or 2025)
  const yearMatch = clean.match(/(\d{2}\/\d{2}|\d{4}\/\d{4}|\b20\d{2}\b)/)
  let yearPart = 'current'
  if (yearMatch) {
    const rawYear = yearMatch[1]
    if (rawYear.length === 5) {
      yearPart = rawYear // e.g. 25/26
    } else if (rawYear.length === 9) {
      // 2025/2026 -> 25/26
      yearPart = `${rawYear.slice(2, 4)}/${rawYear.slice(7, 9)}`
    } else if (rawYear.length === 4) {
      // 2025 -> 25/26
      const y = parseInt(rawYear, 10)
      yearPart = `${String(y).slice(-2)}/${String(y + 1).slice(-2)}`
    }
  }

  // Remove prefixes like "quota", "quotas de sócios", year prefix, dashes, and extra spaces
  const namePart = clean
    .replace(/^quotas?\s*(?:de\s*s[óo]cios)?/i, '')
    .replace(/^(?:\d{2}\/\d{2}|\d{4}\/\d{4}|\d{4})/i, '')
    .replace(/^[-—–:]+/, '')
    .replace(/[-—–:]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return `${yearPart}:${namePart}`
}

/**
 * Checks if a financial movement matches a given quota by ID or by Category + Contact Name + School Year.
 * Resilient against unicode dashes (— vs -), year formats (25/26 vs 2025/2026), and minor spacing differences.
 */
export function isMovementMatchingQuota(
  mov: FinancialMovement,
  quotaMovementId: string | null | undefined,
  contactName: string,
  targetYear: number
): boolean {
  // 1. Direct ID match
  if (quotaMovementId && mov.id === quotaMovementId) {
    return true
  }

  // 2. Must be category 'Quotas de Sócios'
  if (mov.category !== 'Quotas de Sócios') {
    return false
  }

  const desc = mov.description.toLowerCase().trim()
  const cleanContactName = contactName.toLowerCase().trim()

  // Contact name matching: full string or first + last name
  const nameMatches =
    desc.includes(cleanContactName) ||
    (() => {
      const parts = cleanContactName.split(/\s+/).filter(Boolean)
      if (parts.length >= 2) {
        return desc.includes(parts[0]) && desc.includes(parts[parts.length - 1])
      }
      return false
    })()

  if (!nameMatches) {
    return false
  }

  // Year matching
  const yShort = formatSchoolYear(targetYear).toLowerCase() // e.g. '25/26'
  const yFullYear = targetYear < 100 ? 2000 + targetYear : targetYear
  const yLong = `${yFullYear}/${yFullYear + 1}` // e.g. '2025/2026'

  // If description has an explicit year, ensure it matches this quota's year
  const yearInDescMatch = desc.match(/(\d{2}\/\d{2}|\d{4}\/\d{4})/)
  if (yearInDescMatch) {
    const foundYear = yearInDescMatch[1]
    if (foundYear !== yShort && foundYear !== yLong) {
      return false
    }
  }

  return true
}
