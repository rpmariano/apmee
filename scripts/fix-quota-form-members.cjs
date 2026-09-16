const fs = require('fs');
let content = fs.readFileSync('src/features/quotas/components/quota-form.tsx', 'utf8');

content = content.replace("useContacts('associado')", "useContacts('members')");

fs.writeFileSync('src/features/quotas/components/quota-form.tsx', content);
