const fs = require('fs');
let content = fs.readFileSync('src/pages/inventory.tsx', 'utf8');

content = content.replace(
  "<InventoryList category={activeTab} onEditItem={handleEditItem} />",
  "<InventoryList filter={activeTab} onEditItem={handleEditItem} onTransaction={(item) => setTransactionItem(item)} />"
);

fs.writeFileSync('src/pages/inventory.tsx', content);
