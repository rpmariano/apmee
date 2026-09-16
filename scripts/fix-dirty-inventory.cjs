const fs = require('fs');
let content = fs.readFileSync('src/features/inventory/components/inventory-form.tsx', 'utf8');

content = content.replace("const [isDirty, setIsDirty] = useState(false)", "");
content = content.replace("onChange={() => setIsDirty(true)}", "");

const stateMatch = `const [notes, setNotes] = useState(item?.notes ?? '')`;

const computedIsDirty = `
  const isDirty = (
    name !== (item?.name ?? '') ||
    category !== (item?.category ?? 'consumivel') ||
    quantity !== (item?.quantity ?? 0) ||
    unit !== (item?.unit ?? 'un') ||
    minStock !== (item?.min_stock ?? 0) ||
    location !== (item?.location ?? '') ||
    notes !== (item?.notes ?? '')
  )
`;

content = content.replace(stateMatch, stateMatch + "\n" + computedIsDirty);

fs.writeFileSync('src/features/inventory/components/inventory-form.tsx', content);
