const fs = require('fs');
let content = fs.readFileSync('src/types/database.ts', 'utf8');

// Insert InventoryTransactionType
if (!content.includes("InventoryTransactionType")) {
  content = content.replace(
    "export type InventoryCategory = 'consumivel' | 'alimento' | 'mobilizado'",
    "export type InventoryCategory = 'consumivel' | 'alimento' | 'mobilizado'\nexport type InventoryTransactionType = 'in' | 'out'"
  );
}

// Add the interface
const transactionInterface = `\nexport interface InventoryTransaction {
  id: string
  item_id: string
  type: InventoryTransactionType
  quantity: number
  event_id: string | null
  notes: string | null
  created_by: string | null
  created_at: string
}\n`;

if (!content.includes("InventoryTransaction {")) {
  content += transactionInterface;
}

fs.writeFileSync('src/types/database.ts', content);
