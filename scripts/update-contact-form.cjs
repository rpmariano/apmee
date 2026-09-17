const fs = require('fs');

let content = fs.readFileSync('src/features/contacts/components/contact-form.tsx', 'utf8');

// Add isEditing
content = content.replace(
  'const [isMember, setIsMember] = useState(contact?.is_member ?? false)',
  'const [isMember, setIsMember] = useState(contact?.is_member ?? false)\n  const [isEditing, setIsEditing] = useState(!contact)'
);

// Modify handleCloseClick to ignore isDirty if not editing? Wait, if we are NOT editing, isDirty will always be false unless we accidentally changed something.
// But we should also handle "switching back to view mode if dirty" if they cancel edit? The user said "tentarmos fazer back com os controlos do android ou menu, deve de surgir a popup do sair sem gravar". This is already handled by `handleCloseClick` and `useHardwareBack`. 
// If they click 'X', they will get the popup.

// Header text
content = content.replace(
  "{contact ? 'Editar Contacto' : 'Novo Contacto'}",
  "{!isEditing ? 'Detalhes do Contacto' : (contact ? 'Editar Contacto' : 'Novo Contacto')}"
);

// Add disabled={!isEditing} to input/textarea/CustomSelect
// We can just use a global regex:
content = content.replace(/<input\b/g, '<input disabled={!isEditing} ');
content = content.replace(/<textarea\b/g, '<textarea disabled={!isEditing} ');
content = content.replace(/<CustomSelect\b/g, '<CustomSelect disabled={!isEditing} ');

// Make sure we don't duplicate disabled if it already existed (none of them had `disabled` except the submit button, wait, let's check).
// Actually, `disabled={isLoading}` was on the submit button. We didn't replace `<button`.

// Bottom buttons
content = content.replace(
  /<div className="border-t border-warm-200 bg-surface p-4">([\s\S]*?)<\/button>\s*<\/div>/,
  `<div className="border-t border-warm-200 bg-surface p-4">
          {isEditing ? (
            $1</button>
          ) : (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); setIsEditing(true); }}
              className="flex w-full items-center justify-center rounded-[var(--radius-button)] bg-primary-400 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-500 active:scale-95"
            >
              Editar Contacto
            </button>
          )}
        </div>`
);

fs.writeFileSync('src/features/contacts/components/contact-form.tsx', content);
console.log('contact-form updated');
