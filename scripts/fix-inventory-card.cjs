const fs = require('fs');
let content = fs.readFileSync('src/features/inventory/components/inventory-card.tsx', 'utf8');

content = content.replace("Minus, Plus,", "");

fs.writeFileSync('src/features/inventory/components/inventory-card.tsx', content);
