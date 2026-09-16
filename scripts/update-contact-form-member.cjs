const fs = require('fs');
let content = fs.readFileSync('src/features/contacts/components/contact-form.tsx', 'utf8');

if (!content.includes('const [isMember, setIsMember] = useState')) {
  content = content.replace(
    "const [notes, setNotes] = useState(contact?.notes ?? '')",
    "const [notes, setNotes] = useState(contact?.notes ?? '')\n  const [isMember, setIsMember] = useState(contact?.is_member ?? false)"
  );
}

if (!content.includes('is_member: isMember')) {
  content = content.replace(
    "notes: notes || null,",
    "notes: notes || null,\n      is_member: isMember,"
  );
}

const checkboxUI = `
          <div className="flex items-center gap-3 rounded-[var(--radius-button)] border border-warm-200 bg-surface px-4 py-3 shadow-sm z-[100]">
            <input
              type="checkbox"
              id="is_member"
              checked={isMember}
              onChange={(e) => setIsMember(e.target.checked)}
              className="h-5 w-5 rounded border-warm-300 text-primary-500 focus:ring-primary-500"
            />
            <label htmlFor="is_member" className="flex flex-col">
              <span className="text-sm font-bold text-foreground">É Associado?</span>
              <span className="text-xs text-muted">Elegível para pagamento de quotas</span>
            </label>
          </div>
`;

if (!content.includes('É Associado?')) {
  content = content.replace(
    '<div className="flex flex-col gap-1.5 z-[100]">',
    checkboxUI + '\n\n          <div className="flex flex-col gap-1.5 z-[100]">'
  );
}

fs.writeFileSync('src/features/contacts/components/contact-form.tsx', content);
