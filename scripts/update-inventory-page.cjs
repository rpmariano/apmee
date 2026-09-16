const fs = require('fs');
let content = fs.readFileSync('src/pages/inventory.tsx', 'utf8');

if (!content.includes('import { TransactionForm }')) {
  content = content.replace(
    "import { InventoryForm } from '@/features/inventory/components/inventory-form'",
    "import { InventoryForm } from '@/features/inventory/components/inventory-form'\nimport { TransactionForm } from '@/features/inventory/components/transaction-form'"
  );
}

if (!content.includes('const [transactionItem, setTransactionItem] = useState<InventoryItem | undefined>()')) {
  content = content.replace(
    "const [editingItem, setEditingItem] = useState<InventoryItem | undefined>()",
    "const [editingItem, setEditingItem] = useState<InventoryItem | undefined>()\n  const [transactionItem, setTransactionItem] = useState<InventoryItem | undefined>()"
  );
}

// Remove old handleUpdateQuantity
const updateRegex = /const handleUpdateQuantity = async \([\s\S]*?\}\n\n/;
content = content.replace(updateRegex, "");

content = content.replace("onUpdateQuantity={canWriteInventory ? handleUpdateQuantity : undefined}", "onTransaction={canWriteInventory ? (item) => setTransactionItem(item) : undefined}");

if (!content.includes("transactionItem &&")) {
  content = content.replace(
    "{isFormOpen && (",
    `{transactionItem && (
        <TransactionForm
          item={transactionItem}
          onClose={() => setTransactionItem(undefined)}
        />
      )}

      {isFormOpen && (`
  );
}

fs.writeFileSync('src/pages/inventory.tsx', content);
