const fs = require('fs');
let content = fs.readFileSync('src/features/events/components/event-form.tsx', 'utf8');

content = content.replace("const [isDirty, setIsDirty] = useState(false)", "");
content = content.replace("onChange={() => setIsDirty(true)}", "");

const stateMatch = `const [status, setStatus] = useState<EventStatus>(event?.status ?? EVENT_STATUSES.PLANNED)`;

const computedIsDirty = `
  const isDirty = (
    title !== (event?.title ?? '') ||
    description !== (event?.description ?? '') ||
    location !== (event?.location ?? '') ||
    startDate !== toDateTimeLocal(event?.start_date) ||
    endDate !== toDateTimeLocal(event?.end_date) ||
    isAllDay !== (event?.is_all_day ?? false) ||
    status !== (event?.status ?? EVENT_STATUSES.PLANNED)
  )
`;

content = content.replace(stateMatch, stateMatch + "\n" + computedIsDirty);

fs.writeFileSync('src/features/events/components/event-form.tsx', content);
