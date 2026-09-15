import { MobileCalendar } from '@/features/calendar/components/mobile-calendar'

export default function CalendarPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="sticky top-0 z-10 bg-background/95 pb-2 pt-6 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="px-4">
          <h1 className="text-xl font-bold text-foreground">Calendário</h1>
        </div>
      </div>

      <div className="px-4 pb-8 pt-4">
        <MobileCalendar />
      </div>
    </div>
  )
}

