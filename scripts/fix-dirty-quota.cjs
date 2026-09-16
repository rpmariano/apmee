const fs = require('fs');
let content = fs.readFileSync('src/features/quotas/components/quota-form.tsx', 'utf8');

content = content.replace("const [isDirty, setIsDirty] = useState(false)", "");
content = content.replace("onChange={() => setIsDirty(true)}", "");

const stateMatch = `const [isUploading, setIsUploading] = useState(false)`;

const computedIsDirty = `
  const isDirty = (
    contactId !== (quota?.contact_id ?? '') ||
    year !== (quota?.year ?? new Date().getFullYear()) ||
    amount !== (quota?.amount ?? '15') ||
    paid !== (quota?.paid ?? false) ||
    paidDate !== (quota?.paid_date ? toDateString(quota.paid_date) : '') ||
    paymentMethod !== (quota?.payment_method ?? '') ||
    file !== null
  )
`;

content = content.replace(stateMatch, stateMatch + "\n" + computedIsDirty);

fs.writeFileSync('src/features/quotas/components/quota-form.tsx', content);
