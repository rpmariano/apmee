const fs = require('fs');
let content = fs.readFileSync('src/features/inventory/api/use-inventory-transactions.ts', 'utf8');

content = content.replace(
  ".select('*, event:events(title)')",
  ".select('*, event:events(title), item:inventory_items(name)')"
);

content = content.replace(
  "return data as (InventoryTransaction & { event?: { title: string } })[]",
  "return data as (InventoryTransaction & { event?: { title: string }, item?: { name: string } })[]"
);

fs.writeFileSync('src/features/inventory/api/use-inventory-transactions.ts', content);
