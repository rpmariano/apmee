const fs = require('fs');

let content = fs.readFileSync('src/features/board/components/board-form.tsx', 'utf8');

// Replace the specific button block using split/replace
content = content.replace(
  /<div className="mt-4 pt-4 border-t border-warm-200">[\s\S]*?<\/form>/,
  `<div className="mt-4 pt-4 border-t border-warm-200">
            {isEditing ? (
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center rounded-[var(--radius-button)] bg-primary-400 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-500 active:scale-95 disabled:opacity-50"
              >
                {isLoading ? 'A Guardar...' : 'Guardar Membro'}
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setIsEditing(true); }}
                className="flex w-full items-center justify-center rounded-[var(--radius-button)] bg-primary-400 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-500 active:scale-95"
              >
                Editar Membro
              </button>
            )}
          </div>
        </form>`
);

fs.writeFileSync('src/features/board/components/board-form.tsx', content);

console.log('Fixed board form');
