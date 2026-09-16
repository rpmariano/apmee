const fs = require('fs');
let content = fs.readFileSync('src/features/inventory/components/inventory-form.tsx', 'utf8');

const nameField = `          <div className="flex flex-col gap-1.5 z-[70]">
            <label className="text-sm font-medium text-secondary-700">Nome do Item <span className="text-primary-500">*</span></label>
            <CustomSelect
              value={name}
              onChange={(val) => setName(val)}
              options={(ITEMS_BY_CATEGORY[category] || []).map(i => ({ label: i, value: i }))}
              placeholder="Selecione ou crie..."
              creatable
              required
            />
          </div>`;

const catField = `          <div className="flex flex-col gap-1.5 z-[80]">
            <label className="text-sm font-medium text-secondary-700">Categoria</label>
            <CustomSelect
              value={category}
              onChange={(val) => {
                setCategory(val as InventoryCategory)
                setName('')
              }}
              options={INVENTORY_CATEGORIES}
            />
  
          </div>`;

content = content.replace(nameField, catField);
content = content.replace(`          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary-700">Categoria</label>
            <CustomSelect
              value={category}
              onChange={(val) => {
                setCategory(val as InventoryCategory)
                setName('')
              }}
              options={INVENTORY_CATEGORIES}
            />
  
          </div>`, nameField);

fs.writeFileSync('src/features/inventory/components/inventory-form.tsx', content);
