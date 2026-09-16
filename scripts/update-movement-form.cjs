const fs = require('fs');
let content = fs.readFileSync('src/features/treasury/components/movement-form.tsx', 'utf8');

// Add imports
if (!content.includes("useEvents")) {
  content = content.replace(
    "import { CustomSelect } from '@/components/ui/custom-select'",
    "import { CustomSelect } from '@/components/ui/custom-select'\nimport { useEvents } from '@/features/events/api/use-events'"
  );
}

// Add state
if (!content.includes("eventId")) {
  content = content.replace(
    "const [category, setCategory] = useState(movement?.category ?? '')",
    "const [category, setCategory] = useState(movement?.category ?? '')\n  const [eventId, setEventId] = useState(movement?.event_id ?? '')\n  const { data: events } = useEvents()"
  );
}

// Update onSubmit
if (!content.includes("event_id: eventId || null")) {
  content = content.replace(
    "category,",
    "category,\n      event_id: eventId || null,"
  );
}

// Add Event Select
const eventSelect = `<div className="flex flex-col gap-1.5 z-[50]">
              <label className="text-sm font-medium text-secondary-700">Evento (Opcional)</label>
              <CustomSelect
                value={eventId}
                onChange={(val) => setEventId(val)}
                options={(events || []).map(e => ({ label: e.title, value: e.id }))}
                placeholder="Sem evento"
              />
            </div>
`;

if (!content.includes("Evento (Opcional)")) {
  content = content.replace(
    '<div className="my-2 border-t border-warm-200" />',
    eventSelect + '\n          <div className="my-2 border-t border-warm-200" />'
  );
}

fs.writeFileSync('src/features/treasury/components/movement-form.tsx', content);
