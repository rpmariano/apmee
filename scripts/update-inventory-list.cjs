const fs = require('fs');
let content = fs.readFileSync('src/features/inventory/components/inventory-list.tsx', 'utf8');

content = content.replace("onUpdateQuantity?: (item: InventoryItem, newQuantity: number) => void", "onTransaction?: (item: InventoryItem) => void");
content = content.replace("onUpdateQuantity={onUpdateQuantity}", "onTransaction={onTransaction}");
content = content.replace("onUpdateQuantity={onUpdateQuantity}", "onTransaction={onTransaction}");

fs.writeFileSync('src/features/inventory/components/inventory-list.tsx', content);
