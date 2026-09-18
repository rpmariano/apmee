/**
 * School Year Utilities for APMEE
 * 
 * Regra: O ano letivo inicia em Setembro de um ano e termina em Julho do ano seguinte.
 * Exemplo:
 * - Em Setembro de 2026: Ano letivo 2026/2027 -> '26/27'
 * - Em Maio de 2027: Ainda no ano letivo 2026/2027 -> '26/27'
 * - Em Setembro de 2027: Ano letivo 2027/2028 -> '27/28'
 */

/**
 * Returns the starting calendar year of the current school year.
 * Month 8 = September (0-indexed: 0 = Jan, 8 = Sep)
 */
export function getCurrentSchoolYear(date: Date = new Date()): number {
  const month = date.getMonth()
  const year = date.getFullYear()
  // September (8) to December (11): startYear is current year
  // January (0) to August (7): startYear is previous year
  return month >= 8 ? year : year - 1
}

/**
 * Formats a start year into school year notation, e.g.:
 * 2026 -> '26/27'
 * 2027 -> '27/28'
 * Also handles two-digit years (e.g. 26 -> '26/27') or already formatted strings.
 */
export function formatSchoolYear(startYear: number | string): string {
  if (typeof startYear === 'string') {
    // If already in 'XX/YY' format, return as is
    if (/^\d{2}\/\d{2}$/.test(startYear.trim())) {
      return startYear.trim()
    }
    const parsed = parseInt(startYear, 10)
    if (isNaN(parsed)) return startYear
    startYear = parsed
  }

  const num = startYear < 100 ? 2000 + startYear : startYear
  const startShort = String(num).slice(-2)
  const endShort = String(num + 1).slice(-2)
  return `${startShort}/${endShort}`
}

/**
 * Generates options for a school year select dropdown.
 * Defaults to current year, 1 future year, and 4 past years.
 */
export function getSchoolYearOptions(pastYears = 4, futureYears = 1): { label: string; value: number }[] {
  const current = getCurrentSchoolYear()
  const options: { label: string; value: number }[] = []

  for (let y = current + futureYears; y >= current - pastYears; y--) {
    options.push({
      label: y === current ? `${formatSchoolYear(y)} (Atual)` : formatSchoolYear(y),
      value: y,
    })
  }

  return options
}
