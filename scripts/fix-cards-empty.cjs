const fs = require('fs');

const cards = [
  'src/features/board/components/board-card.tsx',
  'src/features/contacts/components/contact-card.tsx',
  'src/features/events/components/event-card.tsx',
  'src/features/inventory/components/inventory-card.tsx',
  'src/features/quotas/components/quota-card.tsx',
  'src/features/tasks/components/task-card.tsx',
  'src/features/treasury/components/movement-card.tsx'
];

cards.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\{onEdit && \(\s*\)\}/g, '');
  fs.writeFileSync(file, content);
});

console.log('Fixed empty onEdit expressions');
