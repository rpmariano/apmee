const fs = require('fs');
const glob = require('glob'); // Not available by default, let's just use fs.readdirSync or hardcode the list.
const path = require('path');

const files = [
  'src/features/board/components/board-form.tsx',
  'src/features/contacts/components/contact-form.tsx',
  'src/features/events/components/event-form.tsx',
  'src/features/inventory/components/inventory-form.tsx',
  'src/features/inventory/components/transaction-form.tsx',
  'src/features/quotas/components/quota-form.tsx',
  'src/features/tasks/components/task-form.tsx',
  'src/features/treasury/components/movement-form.tsx'
];

files.forEach(file => {
  const filePath = path.join('C:/Users/rpmar/APMEE', file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    // Replace z-50 with z-[100] for the main modal wrapper
    content = content.replace(/className="fixed inset-0 z-50/g, 'className="fixed inset-0 z-[100]');
    // Wait, transaction-form uses a different wrapper maybe? Let's also replace general `z-50` in fixed wrappers if any.
    // Also ensure safe-area padding at the bottom for modern phones.
    // Replace "pb-safe" or add pb-8 if not present on the inner scrollable div to give breathing room.
    fs.writeFileSync(filePath, content);
  }
});

console.log("Updated z-index in forms.");
