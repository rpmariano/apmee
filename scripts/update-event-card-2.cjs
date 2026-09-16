const fs = require('fs');
let content = fs.readFileSync('src/features/events/components/event-card.tsx', 'utf8');

// The original class name is exactly:
// className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-warm-200 bg-surface p-4 shadow-sm transition-all hover:shadow-md"

content = content.replace(
  /<div className="flex flex-col gap-3 rounded-\[var\(--radius-card\)\] border border-warm-200 bg-surface p-4 shadow-sm transition-all hover:shadow-md">/,
  `<div 
      className={cn(
        "flex flex-col gap-3 rounded-[var(--radius-card)] border border-warm-200 bg-surface p-4 shadow-sm transition-all hover:shadow-md",
        onEdit && "cursor-pointer active:scale-[0.98]"
      )}
      onClick={() => onEdit && onEdit(event)}
    >`
);

// To avoid the MoreVertical double firing when the user clicks the card, we could stop propagation on the button, but removing onClick is fine since the whole card handles it.
content = content.replace(
  /onClick=\{\(\) => onEdit\(event\)\}/,
  ''
);

fs.writeFileSync('src/features/events/components/event-card.tsx', content);
