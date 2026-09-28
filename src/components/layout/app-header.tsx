import { Link } from 'react-router-dom'
import { MenuAlerts } from '@/components/ui/menu-alerts'
import { UserHeaderProfile } from '@/components/ui/user-header-profile'
import { getCurrentSchoolYear, formatSchoolYear } from '@/lib/school-year'

/**
 * Global institutional header — displayed across all screens in AppShell.
 * Contains the school association brand, active academic year, alerts bell, and user profile avatar.
 */
export function AppHeader() {
  return (
    <header className="shrink-0 z-30 bg-background/95 px-4 pt-3 pb-2.5 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-warm-200/80">
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2.5 min-w-0 group"
          aria-label="Ir para a Página Inicial"
        >
          <img
            src={`${import.meta.env.BASE_URL}logo_cropped.jpeg`}
            alt="Logótipo APMEE EB Cobre"
            className="h-10 w-10 rounded-full object-cover border border-warm-200 shadow-xs shrink-0 transition-transform group-active:scale-95"
          />
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-black tracking-tight text-foreground truncate group-hover:text-primary-600 transition-colors">
              APMEE · EB Cobre
            </span>
            <span className="text-xs font-semibold text-primary-600">
              Ano Letivo {formatSchoolYear(getCurrentSchoolYear())}
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-1 shrink-0">
          <MenuAlerts />
          <UserHeaderProfile />
        </div>
      </div>
    </header>
  )
}
