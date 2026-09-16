const fs = require('fs');
let content = fs.readFileSync('src/features/board/components/board-card.tsx', 'utf8');

content = content.replace(
  `"flex flex-col gap-2 rounded-[var(--radius-card)] border bg-surface p-4 shadow-sm transition-all"`,
  `"flex flex-col gap-2 rounded-[var(--radius-card)] border border-warm-200 bg-surface p-4 shadow-sm transition-all"`
);

fs.writeFileSync('src/features/board/components/board-card.tsx', content);
