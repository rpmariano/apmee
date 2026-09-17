const fs = require('fs');

const cards = [
  { file: 'src/features/board/components/board-card.tsx', propName: 'member' },
  { file: 'src/features/contacts/components/contact-card.tsx', propName: 'contact' },
  { file: 'src/features/inventory/components/inventory-card.tsx', propName: 'item' },
  { file: 'src/features/quotas/components/quota-card.tsx', propName: 'quota' },
  { file: 'src/features/tasks/components/task-card.tsx', propName: 'task' },
  { file: 'src/features/treasury/components/movement-card.tsx', propName: 'movement' }
];

cards.forEach(({ file, propName }) => {
  let content = fs.readFileSync(file, 'utf8');

  // Replace className="..." with cn("...", onEdit && "cursor-pointer active:scale-[0.98]")
  // and add onClick
  // Many might already have cn(), some not.

  // Let's replace the first '<div className="' or '<div \n      className={cn('
  if (content.includes('className={cn(')) {
    // If it already has cn(), we just need to ensure onClick and active:scale are there
    // Actually board-card already has cn() and onClick.
    if (!content.includes('active:scale-[0.98]')) {
      content = content.replace(
        'cursor-pointer hover:shadow-md"',
        'cursor-pointer active:scale-[0.98] hover:shadow-md"'
      );
    }
  } else {
    // Standard <div className="flex flex-col... ">
    const rootDivRegex = /<div\s+className="([^"]+shadow-sm[^"]*)"\s*>/;
    const match = content.match(rootDivRegex);
    if (match) {
      content = content.replace(
        rootDivRegex,
        `<div 
      className={cn(
        "${match[1]}",
        onEdit && "cursor-pointer active:scale-[0.98]"
      )}
      onClick={() => onEdit && onEdit(${propName})}
    >`
      );
    }
  }
  
  fs.writeFileSync(file, content);
});

console.log('Cards updated to be fully clickable');
