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

  // Remove MoreVertical import
  content = content.replace(/,\s*MoreVertical|MoreVertical\s*,?/, '');

  // Remove MoreVertical button block
  const moreBtnRegex = /\{onEdit && \(\s*<button[^>]*onClick=\{[^}]*\}[^>]*>\s*<MoreVertical[^>]*\/>\s*<\/button>\s*\)\}/;
  content = content.replace(moreBtnRegex, '');
  
  // Also quota-card might have a different structure, let's just do a generic removal of MoreVertical block if any
  const moreBtnRegex2 = /<button[^>]*>\s*<MoreVertical[^>]*\/>\s*<\/button>/g;
  content = content.replace(moreBtnRegex2, '');

  // Ensure root div is clickable. 
  // Let's replace the first `<div className="flex flex-col...` or similar with cn() if not already there, 
  // but some already have cn().
  // Instead of complex regex, let's just make sure onEdit logic is placed in the root.
  // Actually, I'll do this via simple string replacements for each file or using a general regex if possible.
  
  fs.writeFileSync(file, content);
});

console.log('Removed MoreVertical');
