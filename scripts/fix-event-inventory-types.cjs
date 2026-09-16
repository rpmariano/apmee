const fs = require('fs');
let content = fs.readFileSync('src/features/events/components/event-inventory-manager.tsx', 'utf8');

content = content.replace(
  ".insert({ event_id: eventId, item_id: selectedItemId, quantity })",
  ".insert({ event_id: eventId, item_id: selectedItemId, quantity } as any)"
);

fs.writeFileSync('src/features/events/components/event-inventory-manager.tsx', content);
