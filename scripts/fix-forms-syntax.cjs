const fs = require('fs');

const forms = [
  'src/features/board/components/board-form.tsx',
  'src/features/events/components/event-form.tsx',
  'src/features/inventory/components/inventory-form.tsx',
  'src/features/treasury/components/movement-form.tsx',
  'src/features/quotas/components/quota-form.tsx',
  'src/features/tasks/components/task-form.tsx'
];

forms.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  // Find `{!isEditing ? 'Detalhes' : {something ? 'A' : 'B'}}`
  // Replace `{something` with `(something` and `}}` with `)}`
  const regex = /\{!isEditing \? 'Detalhes' : \{([^}]+)\}\}/g;
  content = content.replace(regex, "{!isEditing ? 'Detalhes' : ($1)}");
  
  fs.writeFileSync(file, content);
});

// Also check event-card.tsx line 51
let eventCard = fs.readFileSync('src/features/events/components/event-card.tsx', 'utf8');
// let's print lines 45-55 of event-card to see what's wrong
console.log("Event card check:");
const lines = eventCard.split('\n');
console.log(lines.slice(45, 55).join('\n'));
