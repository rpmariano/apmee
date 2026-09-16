const fs = require('fs');
let content = fs.readFileSync('src/features/contacts/components/contact-form.tsx', 'utf8');

content = content.replace("const [isDirty, setIsDirty] = useState(false)", "");
content = content.replace("onChange={() => setIsDirty(true)}", "");

const stateRegex = /const \[name, setName\] = useState[\s\S]*?const \[isMember, setIsMember\] = useState.*?false\)/;

const stateMatch = content.match(stateRegex)[0];

const computedIsDirty = `
  const isDirty = (
    name !== (contact?.name ?? '') ||
    category !== (contact?.category ?? 'pai') ||
    email !== (contact?.email ?? '') ||
    phone !== (contact?.phone ?? '') ||
    whatsapp !== (contact?.whatsapp ?? '') ||
    notes !== (contact?.notes ?? '') ||
    isMember !== (contact?.is_member ?? false)
  )
`;

content = content.replace(stateMatch, stateMatch + "\n" + computedIsDirty);

fs.writeFileSync('src/features/contacts/components/contact-form.tsx', content);
