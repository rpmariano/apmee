import { useAuth } from '@/providers/auth-provider'
import { FINANCIAL_MODULES } from '@/lib/constants'

/**
 * Hook for checking user permissions across the app.
 * Uses the permission level (superadmin, nivel_1, nivel_2) independently of the role.
 */
export function usePermissions() {
  const { user } = useAuth()

  const isSuperAdmin = user?.permissionLevel === 'superadmin'
  const isNivel1 = user?.permissionLevel === 'nivel_1'
  const isNivel2 = user?.permissionLevel === 'nivel_2'

  /**
   * Check if the user can write to a specific module.
   * nivel_2 users cannot write to financial modules (treasury, quotas).
   */
  const canWrite = (module: string): boolean => {
    if (!user) return false
    if (isSuperAdmin || isNivel1) return true
    // nivel_2: can write to everything except financial modules
    return !FINANCIAL_MODULES.includes(module as (typeof FINANCIAL_MODULES)[number])
  }

  /**
   * Check if the user has access to technical features (logs, config).
   * Only superadmin has access.
   */
  const canAccessTechnical = (): boolean => {
    return isSuperAdmin
  }

  /**
   * Check if the user is in read-only mode for financial modules.
   */
  const isFinancialReadOnly = (): boolean => {
    return isNivel2
  }

  return {
    isSuperAdmin,
    isNivel1,
    isNivel2,
    canWrite,
    canAccessTechnical,
    isFinancialReadOnly,
    role: user?.role ?? null,
    permissionLevel: user?.permissionLevel ?? null,
  }
}
