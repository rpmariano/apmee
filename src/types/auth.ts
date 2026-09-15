import type { PermissionLevel, UserRole } from './database'

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  permissionLevel: PermissionLevel
  displayName: string | null
  avatarUrl: string | null
}

export interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}
