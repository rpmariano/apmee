const fs = require('fs');
let content = fs.readFileSync('src/features/treasury/components/event-finances.tsx', 'utf8');

content = content.replace(", Package } from 'lucide-react'", " } from 'lucide-react'");

fs.writeFileSync('src/features/treasury/components/event-finances.tsx', content);
