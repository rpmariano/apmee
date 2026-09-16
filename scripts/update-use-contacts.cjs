const fs = require('fs');
let content = fs.readFileSync('src/features/contacts/api/use-contacts.ts', 'utf8');

content = content.replace(
  "export function useContacts(category?: ContactCategory | 'all') {",
  "export function useContacts(category?: ContactCategory | 'all' | 'members') {"
);

const newLogic = `if (category && category !== 'all') {
        if (category === 'members') {
          query = query.eq('is_member', true)
        } else {
          query = query.eq('category', category)
        }
      }`;

content = content.replace(
  `if (category && category !== 'all') {
        query = query.eq('category', category)
      }`,
  newLogic
);

fs.writeFileSync('src/features/contacts/api/use-contacts.ts', content);
