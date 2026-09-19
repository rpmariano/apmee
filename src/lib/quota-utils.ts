import { formatSchoolYear, getCurrentSchoolYear } from '@/lib/school-year'
import type { FinancialMovement } from '@/types/database'

/**
 * Normalizes a quota movement description into a unique key: `${year}:${cleanedName}`.
 * Allows identifying identical quota payments regardless of formatting:
 * - Unicode dashes (— vs -)
 * - School year formats (25/26, 2025/2026, 2025-2026, 2025, or omitted)
 * - Diacritics/accents (João vs Joao, Conceição vs Conceicao)
 * - Name variations (first + last name: "Rui Pedro Mariano" vs "Rui Mariano")
 * - Prefixes ("Quota 25/26", "Quotas de Sócios", "Pagamento de Quota")
 */
export function getQuotaDeduplicationKey(description: string): string {
  if (!description) return ''

  // 1. Remove accents/diacritics and convert to lower case
  const clean = description
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

  // 2. Extract and standardize school year
  // Matches: 25/26, 2025/2026, 2025-2026, 2025/26, 25-26, 2025, 2026
  const yearMatch = clean.match(/(\d{2}[/-]\d{2}|\d{4}[/-]\d{4}|\d{4}[/-]\d{2}|\b20\d{2}\b)/)
  let yearPart = formatSchoolYear(getCurrentSchoolYear()).toLowerCase() // Default to active school year if omitted

  if (yearMatch) {
    const raw = yearMatch[1].replace('-', '/')
    if (raw.length === 5) {
      // 25/26
      yearPart = raw
    } else if (raw.length === 9) {
      // 2025/2026 -> 25/26
      yearPart = `${raw.slice(2, 4)}/${raw.slice(7, 9)}`
    } else if (raw.length === 7) {
      // 2025/26 -> 25/26
      yearPart = `${raw.slice(2, 4)}/${raw.slice(5, 7)}`
    } else if (raw.length === 4) {
      // 2025 -> 25/26
      const y = parseInt(raw, 10)
      yearPart = `${String(y).slice(-2)}/${String(y + 1).slice(-2)}`
    }
  }

  // 3. Clean and isolate member name
  let namePart = clean
    // Remove "pagamento de", "pagamento"
    .replace(/\bpagamento\s*(?:de\s*)?/gi, '')
    // Remove "quotas de socios", "quota de socio", "quotas", "quota"
    .replace(/\bquotas?\s*(?:de\s*socios?|de\s*associados?|socios?|associados?)?\b/gi, '')
    // Remove extracted year strings
    .replace(/(?:\d{2}[/-]\d{2}|\d{4}[/-]\d{4}|\d{4}[/-]\d{2}|\b20\d{2}\b)/g, '')
    // Remove separating punctuation (dashes, slashes, colons, bullets)
    .replace(/[-—–:/•.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  // 4. Normalize name by first + last name to bridge middle-name differences
  const parts = namePart.split(' ').filter(Boolean)
  let normalizedPerson = namePart
  if (parts.length >= 2) {
    normalizedPerson = `${parts[0]} ${parts[parts.length - 1]}`
  } else if (parts.length === 1) {
    normalizedPerson = parts[0]
  } else {
    normalizedPerson = '__geral__'
  }

  return `${yearPart}:${normalizedPerson}`
}

/**
 * Checks if a financial movement matches a given quota by ID or by Category + Contact Name + School Year.
 * Resilient against unicode dashes (— vs -), year formats (25/26 vs 2025/2026), accents, and middle names.
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

  const descClean = mov.description
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
  const contactClean = contactName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

  // Contact name matching: full string, first + last name, or single name
  const contactParts = contactClean.split(/\s+/).filter(Boolean)
  const nameMatches =
    descClean.includes(contactClean) ||
    (() => {
      if (contactParts.length >= 2) {
        return (
          descClean.includes(contactParts[0]) &&
          descClean.includes(contactParts[contactParts.length - 1])
        )
      }
      return contactParts.length === 1 && descClean.includes(contactParts[0])
    })()

  if (!nameMatches) {
    return false
  }

  // Year matching
  const yShort = formatSchoolYear(targetYear).toLowerCase() // e.g. '25/26'

  // If description has an explicit year, ensure it matches this quota's year
  const yearInDescMatch = mov.description.match(/(\d{2}[/-]\d{2}|\d{4}[/-]\d{4}|\d{4}[/-]\d{2}|\b20\d{2}\b)/)
  if (yearInDescMatch) {
    const foundRaw = yearInDescMatch[1].replace('-', '/')
    let foundYear = foundRaw
    if (foundRaw.length === 9) {
      foundYear = `${foundRaw.slice(2, 4)}/${foundRaw.slice(7, 9)}`
    } else if (foundRaw.length === 7) {
      foundYear = `${foundRaw.slice(2, 4)}/${foundRaw.slice(5, 7)}`
    } else if (foundRaw.length === 4) {
      const y = parseInt(foundRaw, 10)
      foundYear = `${String(y).slice(-2)}/${String(y + 1).slice(-2)}`
    }
    if (foundYear !== yShort) {
      return false
    }
  }

  return true
}
