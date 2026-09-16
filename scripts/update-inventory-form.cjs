const fs = require('fs');
let content = fs.readFileSync('src/features/inventory/components/inventory-form.tsx', 'utf8');

const newDefs = `const INVENTORY_CATEGORIES = [
  { label: 'Consumíveis', value: 'consumivel' },
  { label: 'Alimentos', value: 'alimento' },
  { label: 'Mobilizado', value: 'mobilizado' }
]

const ITEMS_BY_CATEGORY: Record<string, string[]> = {
  'consumivel': ['Pratos de papel', 'Pratos de Plástico', 'Talheres', 'Guardanapos', 'Copos de plástico'],
  'alimento': ['Pacote batata frita', 'Pacote de pipocas', 'Sumos Naturais', 'Refrigerantes', 'Água', 'Pão cachorro', 'Salsicha'],
  'mobilizado': ['Microfone', 'Coluna', 'Máquina Café']
}

interface InventoryFormProps`;
content = content.replace('interface InventoryFormProps', newDefs);

const oldNameRegex = /<div className="flex flex-col gap-1\.5">\s*<label className="text-sm font-medium text-secondary-700">Nome do Item <span className="text-primary-500">\*<\/span><\/label>\s*<input[\s\S]*?placeholder="Ex: Resmas de Papel A4"\s*\/>\s*<\/div>/;
const newName = `<div className="flex flex-col gap-1.5 z-[70]">
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
content = content.replace(oldNameRegex, newName);

const oldCatRegex = /<div className="flex flex-col gap-1\.5 z-\[60\]">\s*<label className="text-sm font-medium text-secondary-700">Categoria<\/label>\s*<CustomSelect[\s\S]*?<\/CustomSelect>\s*<\/div>/;
const newCategory = `<div className="flex flex-col gap-1.5 z-[60]">
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
content = content.replace(oldCatRegex, newCategory);

// Wait, the regex might fail if it was z-[60] or not. In the original file it didn't have z-[60].
const oldCatRegex2 = /<div className="flex flex-col gap-1\.5">\s*<label className="text-sm font-medium text-secondary-700">Categoria<\/label>\s*<CustomSelect[\s\S]*?<\/CustomSelect>\s*<\/div>/;
content = content.replace(oldCatRegex2, newCategory);

fs.writeFileSync('src/features/inventory/components/inventory-form.tsx', content);
