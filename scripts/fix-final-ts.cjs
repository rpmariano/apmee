const fs = require('fs');

// Fix board-form.tsx button block
let content = fs.readFileSync('src/features/board/components/board-form.tsx', 'utf8');
const boardBtnRegex = /<div className="mt-4 pt-4 border-t border-warm-200">\s*<button[\s\S]*?Guardar Membro<\/button>\s*<\/div>/;
const match = content.match(boardBtnRegex);
if (match) {
  const originalBlock = match[0];
  const buttonHtmlMatch = originalBlock.match(/<button[\s\S]*?<\/button>/);
  if (buttonHtmlMatch) {
    const buttonHtml = buttonHtmlMatch[0];
    const newBlock = `<div className="mt-4 pt-4 border-t border-warm-200">
          {isEditing ? (
            ${buttonHtml}
          ) : (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); setIsEditing(true); }}
              className="flex w-full items-center justify-center rounded-[var(--radius-button)] bg-primary-400 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-500 active:scale-95"
            >
              Editar Membro
            </button>
          )}
        </div>`;
    content = content.replace(originalBlock, newBlock);
  }
}
fs.writeFileSync('src/features/board/components/board-form.tsx', content);

// Fix task-card.tsx
content = fs.readFileSync('src/features/tasks/components/task-card.tsx', 'utf8');
content = content.replace(
  /isDone && "opacity-75 bg-warm-50"\s*\)\}>/,
  `isDone && "opacity-75 bg-warm-50",
      onEdit && "cursor-pointer active:scale-[0.98]"
    )}
    onClick={() => onEdit && onEdit(task)}>`
);
fs.writeFileSync('src/features/tasks/components/task-card.tsx', content);

console.log('Fixed final TS errors');
