const fs = require('fs');
let content = fs.readFileSync('src/features/treasury/components/movement-form.tsx', 'utf8');

content = content.replace("const [isDirty, setIsDirty] = useState(false)", "");
content = content.replace("onChange={() => setIsDirty(true)}", "");

const stateMatch = `const [file, setFile] = useState<File | null>(null)`;

const computedIsDirty = `
  const isDirty = (
    type !== (movement?.type ?? 'expense') ||
    amount !== (movement?.amount ?? '') ||
    description !== (movement?.description ?? '') ||
    category !== (movement?.category ?? '') ||
    eventId !== (movement?.event_id ?? '') ||
    date !== toDateString(movement?.date) ||
    file !== null
  )
`;

content = content.replace(stateMatch, stateMatch + "\n" + computedIsDirty);

fs.writeFileSync('src/features/treasury/components/movement-form.tsx', content);
