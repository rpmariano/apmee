const fs = require('fs');
let content = fs.readFileSync('src/features/inventory/components/inventory-form.tsx', 'utf8');

const oldCatRegex = /<label className="text-sm font-medium text-secondary-700">Categoria<\/label>\s*<CustomSelect[\s\S]*?\/>/;

const newCategory = `<label className="text-sm font-medium text-secondary-700">Categoria</label>
            <CustomSelect
              value={category}
              onChange={(val) => {
                setCategory(val as InventoryCategory)
                setName('')
              }}
              options={INVENTORY_CATEGORIES}
            />`;

content = content.replace(oldCatRegex, newCategory);
fs.writeFileSync('src/features/inventory/components/inventory-form.tsx', content);
