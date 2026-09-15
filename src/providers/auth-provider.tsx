import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { supabase } from '@/lib/supabase'
import type { AuthContextType, AuthUser } from '@/types/auth'
import type { AllowedUser } from '@/types/database'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  /**
   * Fetches the user's profile from allowed_users.
   * Returns null if the user is not in the whitelist.
   */
  const fetchUserProfile = useCallback(
    async (email: string): Promise<AllowedUser | null> => {
      const { data, error } = await supabase
        .from('allowed_users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single()

      if (error || !data) return null
      return data as AllowedUser
    },
    []
  )

  /**
   * Maps a Supabase session + allowed_users row to an AuthUser.
   */
  const buildAuthUser = useCallback(
    (sessionUserId: string, profile: AllowedUser): AuthUser => ({
      id: sessionUserId,
      email: profile.email,
      role: profile.role,
      permissionLevel: profile.permission_level,
      displayName: profile.display_name,
      avatarUrl: profile.avatar_url,
    }),
    []
  )

  /**
   * Initializes the session on mount and subscribes to auth state changes.
   */
  useEffect(() => {
    let mounted = true

    const initSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user?.email && mounted) {
          const profile = await fetchUserProfile(session.user.email)
          if (profile) {
            setUser(buildAuthUser(session.user.id, profile))
          } else {
            // User exists in Google but NOT in allowed_users → sign out
            await supabase.auth.signOut()
            setUser(null)
          }
        }
      } catch {
        setUser(null)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    initSession()

    // Subscribe to auth changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      if (event === 'SIGNED_IN' && session?.user?.email) {
        setIsLoading(true)
        const profile = await fetchUserProfile(session.user.email)
        if (profile) {
          setUser(buildAuthUser(session.user.id, profile))
        } else {
          // Not in whitelist → reject
          await supabase.auth.signOut()
          setUser(null)
          // TODO: Show a toast notification to the user
          console.warn('Acesso não autorizado: email não registado.')
        }
        setIsLoading(false)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setIsLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchUserProfile, buildAuthUser])

  const signIn = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + import.meta.env.BASE_URL,
      },
    })
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook to access the auth context.
 * Must be used within an AuthProvider.
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
