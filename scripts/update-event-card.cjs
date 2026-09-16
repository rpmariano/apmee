const fs = require('fs');
let content = fs.readFileSync('src/features/events/components/event-card.tsx', 'utf8');

// Replace the root div of the card
content = content.replace(
  /<div\s+className="relative flex flex-col gap-4 rounded-\[var\(--radius-card\)\] border border-warm-200 bg-surface p-4 shadow-sm transition-all hover:shadow-md">/,
  `<div 
      className={cn(
        "relative flex flex-col gap-4 rounded-[var(--radius-card)] border border-warm-200 bg-surface p-4 shadow-sm transition-all hover:shadow-md",
        onEdit && "cursor-pointer active:scale-[0.98]"
      )}
      onClick={() => onEdit && onEdit(event)}
    >`
);

// We need to remove the onClick from the inner MoreVertical button so it doesn't double-fire, or just let it bubble.
// Let's just remove the onClick from the button and let it bubble.
content = content.replace(
  /onClick=\{\(\) => onEdit\(event\)\}/,
  ''
);

fs.writeFileSync('src/features/events/components/event-card.tsx', content);
