const fs = require('fs');
let content = fs.readFileSync('src/features/inventory/components/inventory-form.tsx', 'utf8');

const regex = /<label className="text-sm font-medium text-secondary-700">Categoria<\/label>[\s\S]*?<\/CustomSelect>/;

const replacement = `<label className="text-sm font-medium text-secondary-700">Categoria</label>
            <CustomSelect
              value={category}
              onChange={(val) => {
                setCategory(val as InventoryCategory)
                setName('')
              }}
              options={INVENTORY_CATEGORIES}
            />`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/features/inventory/components/inventory-form.tsx', content);
