const fs = require('fs');
let content = fs.readFileSync('src/components/ui/menu-alerts.tsx', 'utf8');

content = content.replace(
  'className="fixed inset-0 z-50',
  'className="fixed inset-0 z-[100]'
);

fs.writeFileSync('src/components/ui/menu-alerts.tsx', content);
