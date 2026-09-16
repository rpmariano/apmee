const fs = require('fs');
let content = fs.readFileSync('src/features/events/components/event-form.tsx', 'utf8');

if (!content.includes('EventInventoryManager')) {
  content = content.replace(
    "import { CustomSelect } from '@/components/ui/custom-select'",
    "import { CustomSelect } from '@/components/ui/custom-select'\nimport { EventInventoryManager } from './event-inventory-manager'"
  );
}

const managerUI = `
        {event?.id ? (
          <EventInventoryManager eventId={event.id} eventStatus={status} />
        ) : (
          <div className="rounded-[var(--radius-card)] bg-warm-50 p-4 border border-warm-100 text-center mt-2">
            <p className="text-sm text-secondary-600">Guarde o evento primeiro para poder associar material do inventário.</p>
          </div>
        )}
`;

if (!content.includes('EventInventoryManager eventId=')) {
  content = content.replace(
    '<div className="border-t border-warm-200 bg-surface p-4">',
    managerUI + '\n\n        <div className="border-t border-warm-200 bg-surface p-4">'
  );
}

fs.writeFileSync('src/features/events/components/event-form.tsx', content);
