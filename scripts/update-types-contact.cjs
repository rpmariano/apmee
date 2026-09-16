const fs = require('fs');
let content = fs.readFileSync('src/types/database.ts', 'utf8');

if (!content.includes('is_member: boolean')) {
  content = content.replace(
    "avatar_url: string | null",
    "avatar_url: string | null\n  is_member: boolean"
  );
}

fs.writeFileSync('src/types/database.ts', content);
