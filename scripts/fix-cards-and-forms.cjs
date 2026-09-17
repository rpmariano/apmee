const fs = require('fs');

// Fix contact-card.tsx
let content = fs.readFileSync('src/features/contacts/components/contact-card.tsx', 'utf8');
content = content.replace(
  /<div className="flex flex-col gap-3 rounded-\[var\(--radius-card\)\] border border-warm-200 bg-surface p-4 shadow-sm transition-all hover:shadow-md">/,
  `<div 
      className={cn(
        "flex flex-col gap-3 rounded-[var(--radius-card)] border border-warm-200 bg-surface p-4 shadow-sm transition-all hover:shadow-md",
        onEdit && "cursor-pointer active:scale-[0.98]"
      )}
      onClick={() => onEdit && onEdit(contact)}
    >`
);
fs.writeFileSync('src/features/contacts/components/contact-card.tsx', content);

// Fix inventory-card.tsx
content = fs.readFileSync('src/features/inventory/components/inventory-card.tsx', 'utf8');
content = content.replace(
  /<div className="flex flex-col gap-3 rounded-\[var\(--radius-card\)\] border border-warm-200 bg-surface p-4 shadow-sm transition-all hover:shadow-md">/,
  `<div 
      className={cn(
        "flex flex-col gap-3 rounded-[var(--radius-card)] border border-warm-200 bg-surface p-4 shadow-sm transition-all hover:shadow-md",
        onEdit && "cursor-pointer active:scale-[0.98]"
      )}
      onClick={() => onEdit && onEdit(item)}
    >`
);
fs.writeFileSync('src/features/inventory/components/inventory-card.tsx', content);

// Fix task-card.tsx
content = fs.readFileSync('src/features/tasks/components/task-card.tsx', 'utf8');
content = content.replace(
  /<div className="flex flex-col gap-3 rounded-\[var\(--radius-card\)\] border border-warm-200 bg-surface p-4 shadow-sm transition-all hover:shadow-md">/,
  `<div 
      className={cn(
        "flex flex-col gap-3 rounded-[var(--radius-card)] border border-warm-200 bg-surface p-4 shadow-sm transition-all hover:shadow-md",
        onEdit && "cursor-pointer active:scale-[0.98]"
      )}
      onClick={() => onEdit && onEdit(task)}
    >`
);
fs.writeFileSync('src/features/tasks/components/task-card.tsx', content);

// Fix board-form.tsx multiple attributes on line 76
// error TS17001: JSX elements cannot have multiple attributes with the same name.
// error TS6133: 'setIsEditing' is declared but its value is never read.
content = fs.readFileSync('src/features/board/components/board-form.tsx', 'utf8');
// Let's remove duplicate disabled
content = content.replace(/disabled=\{!isEditing\}\s+disabled=\{!isEditing\}/g, 'disabled={!isEditing}');
content = content.replace(/disabled\s+disabled=\{!isEditing\}/g, 'disabled={!isEditing}');
content = content.replace(/disabled=\{!isEditing\}\s+disabled/g, 'disabled={!isEditing}');
// If it has multiple, let's just make sure there's only one.
content = content.replace(/(<CustomSelect[^>]*disabled=\{!isEditing\}[^>]*)disabled=\{!isEditing\}/g, '$1');
content = content.replace(/(<input[^>]*disabled=\{!isEditing\}[^>]*)disabled=\{!isEditing\}/g, '$1');

// Why is setIsEditing never read? Because my regex for buttons failed on board-form.
// Let's replace the button block in board-form manually.
const boardBtn = /<button[\s\S]*?type="submit"[\s\S]*?Guardar Membro<\/button>/;
const boardBtnMatch = content.match(boardBtn);
if (boardBtnMatch && !content.includes('Editar Membro')) {
  content = content.replace(
    boardBtnMatch[0],
    `{isEditing ? (
            ${boardBtnMatch[0]}
          ) : (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); setIsEditing(true); }}
              className="flex w-full items-center justify-center rounded-[var(--radius-button)] bg-primary-400 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-500 active:scale-95"
            >
              Editar Membro
            </button>
          )}`
  );
}
fs.writeFileSync('src/features/board/components/board-form.tsx', content);

// Fix quota-form.tsx duplicate attributes
content = fs.readFileSync('src/features/quotas/components/quota-form.tsx', 'utf8');
content = content.replace(/disabled=\{!isEditing\}\s+disabled/g, 'disabled={!isEditing}');
content = content.replace(/disabled\s+disabled=\{!isEditing\}/g, 'disabled={!isEditing}');
content = content.replace(/disabled=\{!isEditing\}\s+disabled=\{!isEditing\}/g, 'disabled={!isEditing}');
fs.writeFileSync('src/features/quotas/components/quota-form.tsx', content);

console.log('Fixed cards and forms');
