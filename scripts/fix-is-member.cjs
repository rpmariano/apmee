const fs = require('fs');
let content = fs.readFileSync('src/types/database.ts', 'utf8');

// Remove from AllowedUser
content = content.replace("avatar_url: string | null\n  is_member: boolean\n  is_active: boolean", "avatar_url: string | null\n  is_active: boolean");

// Add to Contact
content = content.replace(
  "notes: string | null\n  created_by: string | null",
  "notes: string | null\n  is_member: boolean\n  created_by: string | null"
);

fs.writeFileSync('src/types/database.ts', content);
