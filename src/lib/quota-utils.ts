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

export interface ReconcileResult {
  validMovements: FinancialMovement[]
  idsToSoftDelete: string[]
  quotaLinksToUpdate: { quotaId: string; movementId: string }[]
}

/**
 * Checks if a movement description corresponds to an anonymous/generic quota
 * without any member name (e.g. "Pagamento de Quota 2026", "Quota 25/26", "Pagamento de Quota").
 * Legitimate quota movements must ALWAYS be attributed to an individual member.
 */
export function isGenericOrphanQuota(description: string): boolean {
  if (!description) return true
  const clean = description
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

  // 1. Key ends with :__geral__ (meaning no individual member name could be extracted)
  const key = getQuotaDeduplicationKey(description)
  if (!key || key.endsWith(':__geral__')) {
    return true
  }

  // 2. Generic description without member name
  if (
    clean === 'pagamento de quota' ||
    /^pagamento\s*(?:de\s*)?quotas?\s*(?:\d{2}[/-]\d{2}|\d{4}[/-]\d{4}|\d{4}[/-]\d{2}|\b20\d{2}\b)?$/i.test(clean) ||
    /^quotas?\s*(?:de\s*socios?|de\s*associados?)?\s*(?:\d{2}[/-]\d{2}|\d{4}[/-]\d{4}|\d{4}[/-]\d{2}|\b20\d{2}\b)?$/i.test(clean)
  ) {
    return true
  }

  return false
}

/**
 * Reconciles financial movements against the quotas table as the Single Source of Truth.
 * Enforces strict 1-to-1 parity:
 * - Each active paid quota has at most 1 movement in treasury.
 * - Anonymous/generic quota movements (e.g. "Pagamento de Quota 2026") are purged (soft-deleted).
 * - Duplicate movements for the same paid quota are purged (soft-deleted).
 * - Movements matching deleted or unpaid quotas are purged (soft-deleted).
 * - Orphan quota movements (no matching active paid quota) are purged (soft-deleted).
 * - Non-quota movements are left untouched.
 */
export function reconcileQuotasAndMovements(
  allMovements: FinancialMovement[],
  allQuotas: any[]
): ReconcileResult {
  const idsToSoftDelete: string[] = []
  const quotaLinksToUpdate: { quotaId: string; movementId: string }[] = []

  // If quotas couldn't be loaded or table is completely empty, fallback to description deduplication
  if (!allQuotas || allQuotas.length === 0) {
    const seenKeys = new Set<string>()
    const valid: FinancialMovement[] = []
    for (const m of allMovements) {
      const item = { ...m, account: m.account || 'banco' }
      if (m.category === 'Quotas de Sócios') {
        // Purge any anonymous/generic quota movement without a member
        if (isGenericOrphanQuota(m.description)) {
          idsToSoftDelete.push(m.id)
          continue
        }
        const key = getQuotaDeduplicationKey(m.description)
        if (key) {
          if (seenKeys.has(key)) {
            idsToSoftDelete.push(m.id)
            continue
          }
          seenKeys.add(key)
        }
      }
      valid.push(item)
    }
    return { validMovements: valid, idsToSoftDelete, quotaLinksToUpdate }
  }

  // 1. Separate quotas into deleted, unpaid, and active paid
  const deletedQuotas = allQuotas.filter((q) => q.deleted_at != null)
  const unpaidQuotas = allQuotas.filter((q) => !q.deleted_at && !q.paid)
  const paidQuotas = allQuotas.filter((q) => !q.deleted_at && q.paid)

  // 2. Separate movements into non-quota and quota
  const validMovements: FinancialMovement[] = []
  const availableQuotaMovements = new Map<string, FinancialMovement>()

  for (const m of allMovements) {
    const item: FinancialMovement = {
      ...m,
      account: m.account || 'banco',
    }
    if (m.category === 'Quotas de Sócios') {
      // Purge any anonymous/generic quota movement without a member
      if (isGenericOrphanQuota(m.description)) {
        idsToSoftDelete.push(m.id)
        continue
      }
      availableQuotaMovements.set(m.id, item)
    } else {
      validMovements.push(item)
    }
  }

  // 3. Purge movements explicitly linked to deleted or unpaid quotas
  for (const uq of [...deletedQuotas, ...unpaidQuotas]) {
    if (uq.movement_id && availableQuotaMovements.has(uq.movement_id)) {
      idsToSoftDelete.push(uq.movement_id)
      availableQuotaMovements.delete(uq.movement_id)
    }
  }

  // 4. Purge movements matching deleted or unpaid quotas (only if not matching any paid quota)
  for (const [id, m] of Array.from(availableQuotaMovements.entries())) {
    const matchesDeletedOrUnpaid = [...deletedQuotas, ...unpaidQuotas].some((q) =>
      isMovementMatchingQuota(m, null, q.contact?.name || '', q.year)
    )
    if (matchesDeletedOrUnpaid) {
      const matchesAnyPaid = paidQuotas.some((pq) =>
        isMovementMatchingQuota(m, pq.movement_id, pq.contact?.name || '', pq.year)
      )
      if (!matchesAnyPaid) {
        idsToSoftDelete.push(id)
        availableQuotaMovements.delete(id)
      }
    }
  }

  // 5. Match each paid quota to EXACTLY ONE movement (strict 1-to-1)
  // Sort paid quotas so that those with an existing movement_id are matched first
  const sortedPaidQuotas = [...paidQuotas].sort((a, b) => {
    if (a.movement_id && !b.movement_id) return -1
    if (!a.movement_id && b.movement_id) return 1
    return 0
  })

  for (const pq of sortedPaidQuotas) {
    const contactName = pq.contact?.name || ''
    const targetYear = pq.year ?? getCurrentSchoolYear()
    const expectedKey = getQuotaDeduplicationKey(
      `Quota ${formatSchoolYear(targetYear)} — ${contactName}`
    )

    // Score all available quota movements for this paid quota
    const candidates: { mov: FinancialMovement; score: number }[] = []

    for (const m of availableQuotaMovements.values()) {
      let score = 0

      // Priority 1: Direct ID match
      if (pq.movement_id && m.id === pq.movement_id) {
        score = 100
      }
      // Priority 2: Matches category, name, and year
      else if (isMovementMatchingQuota(m, pq.movement_id, contactName, targetYear)) {
        score = 80
      }
      // Priority 3: Matches normalized deduplication key
      else if (expectedKey && getQuotaDeduplicationKey(m.description) === expectedKey) {
        score = 60
      }
      // Priority 4: Partial name match (first + last name)
      else if (contactName) {
        const parts = contactName
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .split(/\s+/)
          .filter(Boolean)
        const descClean = (m.description || '')
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')

        if (parts.length >= 2 && descClean.includes(parts[0]) && descClean.includes(parts[parts.length - 1])) {
          score = 40
        }
      }

      if (score > 0) {
        candidates.push({ mov: m, score })
      }
    }

    if (candidates.length > 0) {
      // Sort candidates: highest score first, then most recently updated/created, then matching amount
      candidates.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score
        const dateB = new Date(b.mov.updated_at || b.mov.created_at || b.mov.date).getTime()
        const dateA = new Date(a.mov.updated_at || a.mov.created_at || a.mov.date).getTime()
        if (dateB !== dateA) return dateB - dateA
        const diffA = Math.abs(Number(a.mov.amount) - Number(pq.amount || 10))
        const diffB = Math.abs(Number(b.mov.amount) - Number(pq.amount || 10))
        return diffA - diffB
      })

      // The best candidate is the primary movement
      const primaryMov = candidates[0].mov
      validMovements.push(primaryMov)
      availableQuotaMovements.delete(primaryMov.id)

      // If quota's movement_id didn't match or was missing, register link update
      if (pq.movement_id !== primaryMov.id) {
        quotaLinksToUpdate.push({ quotaId: pq.id, movementId: primaryMov.id })
      }

      // Any other candidates are DUPLICATES for this paid quota -> soft delete them!
      for (let i = 1; i < candidates.length; i++) {
        const dupMov = candidates[i].mov
        idsToSoftDelete.push(dupMov.id)
        availableQuotaMovements.delete(dupMov.id)
      }
    }
  }

  // 6. Any remaining movements in availableQuotaMovements are UNCLAIMED ORPHANS!
  // Since all active paid quotas have claimed their movement, any leftover quota movement
  // is an orphan (from a deleted quota, extra manual entry, test record, etc.).
  // Soft delete them so Treasury count exactly equals paid quotas count!
  for (const [orphanId] of availableQuotaMovements.entries()) {
    idsToSoftDelete.push(orphanId)
  }

  // 7. Sort all valid movements by date descending, then created_at descending
  validMovements.sort((a, b) => {
    const timeB = new Date(b.date).getTime()
    const timeA = new Date(a.date).getTime()
    if (timeB !== timeA) return timeB - timeA
    return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
  })

  return { validMovements, idsToSoftDelete, quotaLinksToUpdate }
}
