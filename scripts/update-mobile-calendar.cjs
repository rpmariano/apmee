const fs = require('fs');
let content = fs.readFileSync('src/features/calendar/components/mobile-calendar.tsx', 'utf8');

content = content.replace(
  'export function MobileCalendar() {',
  `interface MobileCalendarProps {
  onEditEvent?: (event: Event) => void
}

export function MobileCalendar({ onEditEvent }: MobileCalendarProps) {`
);

content = content.replace(
  '<EventCard key={event.id} event={event} />',
  '<EventCard key={event.id} event={event} onEdit={onEditEvent} />'
);

fs.writeFileSync('src/features/calendar/components/mobile-calendar.tsx', content);
