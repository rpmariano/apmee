const fs = require('fs');

const forms = [
  { file: 'src/features/board/components/board-form.tsx', prop: 'member', label: 'Membro' },
  { file: 'src/features/events/components/event-form.tsx', prop: 'event', label: 'Evento' },
  { file: 'src/features/inventory/components/inventory-form.tsx', prop: 'item', label: 'Item' },
  { file: 'src/features/treasury/components/movement-form.tsx', prop: 'movement', label: 'Movimento' },
  { file: 'src/features/quotas/components/quota-form.tsx', prop: 'quota', label: 'Quota' },
  { file: 'src/features/tasks/components/task-form.tsx', prop: 'task', label: 'Tarefa' }
];

forms.forEach(({ file, prop, label }) => {
  let content = fs.readFileSync(file, 'utf8');

  // 1. Add isEditing state
  // We look for `const [showUnsaved, setShowUnsaved] = useState(false)`
  if (!content.includes('const [isEditing, setIsEditing] = useState')) {
    content = content.replace(
      'const [showUnsaved, setShowUnsaved] = useState(false)',
      `const [showUnsaved, setShowUnsaved] = useState(false)\n  const [isEditing, setIsEditing] = useState(!${prop})`
    );
  }

  // 2. Change Header Text
  // This is tricky, usually it's inside `<h2 className="text-lg font-bold text-foreground">`
  // E.g. `{event ? 'Editar Evento' : 'Novo Evento'}`
  const headerRegex = new RegExp(`\\{${prop} \\? 'Editar [^']+' : 'Novo [^']+'\\}`);
  const match = content.match(headerRegex);
  if (match) {
    const original = match[0]; // e.g. {event ? 'Editar Evento' : 'Novo Evento'}
    const viewText = `'Detalhes'`; // or 'Ver Evento'
    content = content.replace(
      original,
      `{!isEditing ? 'Detalhes' : ${original}}`
    );
  } else {
      // maybe it's just 'Novo Movimento'
      const h2Regex = /<h2 className="text-lg font-bold text-foreground">\s*\{?([^<]+)\}?\s*<\/h2>/;
      const h2Match = content.match(h2Regex);
      if (h2Match) {
          content = content.replace(
            h2Regex,
            `<h2 className="text-lg font-bold text-foreground">\n          {!isEditing ? 'Detalhes' : (${prop} ? 'Editar' : 'Novo')}\n        </h2>`
          );
      }
  }

  // 3. Add disabled={!isEditing} to inputs
  content = content.replace(/<input(?!\s+disabled)([^>]*)>/g, '<input disabled={!isEditing} $1>');
  content = content.replace(/<textarea(?!\s+disabled)([^>]*)>/g, '<textarea disabled={!isEditing} $1>');
  content = content.replace(/<CustomSelect(?!\s+disabled)([^>]*)>/g, '<CustomSelect disabled={!isEditing} $1>');

  // 4. Update Bottom Buttons
  // Usually wrapped in `<div className="border-t border-warm-200 bg-surface p-4">`
  const bottomBtnRegex = /<div className="border-t border-warm-200 bg-surface p-4">\s*<button[\s\S]*?type="submit"[\s\S]*?<\/button>\s*<\/div>/;
  const btnMatch = content.match(bottomBtnRegex);
  if (btnMatch) {
      const originalBlock = btnMatch[0];
      const buttonHtmlMatch = originalBlock.match(/<button[\s\S]*?<\/button>/);
      if (buttonHtmlMatch) {
          const buttonHtml = buttonHtmlMatch[0];
          const newBlock = `<div className="border-t border-warm-200 bg-surface p-4">
          {isEditing ? (
            ${buttonHtml}
          ) : (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); setIsEditing(true); }}
              className="flex w-full items-center justify-center rounded-[var(--radius-button)] bg-primary-400 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-500 active:scale-95"
            >
              Editar ${label}
            </button>
          )}
        </div>`;
          content = content.replace(originalBlock, newBlock);
      }
  }

  fs.writeFileSync(file, content);
});

console.log('Forms updated for view/edit modes');
