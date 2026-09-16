const fs = require('fs');
let content = fs.readFileSync('src/features/inventory/components/inventory-card.tsx', 'utf8');

// Update props
content = content.replace(
  "onUpdateQuantity?: (item: InventoryItem, newQuantity: number) => void",
  "onTransaction?: (item: InventoryItem) => void"
);

// Replace card component usage
const oldExportRegex = /export function InventoryCard\(\{ item, onEdit, onUpdateQuantity \}: InventoryCardProps\) \{[\s\S]*?return \(/;

const newExport = `export function InventoryCard({ item, onEdit, onTransaction }: InventoryCardProps) {
  const isLowStock = item.min_stock !== null && item.quantity <= item.min_stock
  const categoryLabel = categoryLabels[item.category] || item.category

  return (`;

content = content.replace(oldExportRegex, newExport);

// Replace the +/- buttons with a single Movimentar button
const oldButtonsRegex = /<div className="flex items-center gap-3">[\s\S]*?<\/div>/;

const newButtons = `<div className="flex items-center gap-2">
            {onTransaction && (
              <button
                onClick={() => onTransaction(item)}
                className="flex items-center justify-center gap-1 rounded-[var(--radius-button)] border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-bold text-primary-700 transition-colors hover:bg-primary-100"
              >
                Movimentar
              </button>
            )}
          </div>`;

content = content.replace(oldButtonsRegex, newButtons);

fs.writeFileSync('src/features/inventory/components/inventory-card.tsx', content);
