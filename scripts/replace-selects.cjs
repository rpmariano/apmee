const fs = require('fs');

// 1. Inventory Form
let inv = fs.readFileSync('src/features/inventory/components/inventory-form.tsx', 'utf8');
if (!inv.includes('CustomSelect')) {
  inv = inv.replace("import { UnsavedDialog } from '@/components/ui/unsaved-dialog'", "import { UnsavedDialog } from '@/components/ui/unsaved-dialog'\nimport { CustomSelect } from '@/components/ui/custom-select'");
  const catSelectRegex = /<select[\s\S]*?value=\{category\}[\s\S]*?onChange=\{\(e\) => setCategory\(e\.target\.value as InventoryCategory\)\}[\s\S]*?<\/select>/;
  const catSelectNew = `
            <CustomSelect
              value={category}
              onChange={(val) => setCategory(val as InventoryCategory)}
              options={[
                { label: 'Consumível (ex: papel, canetas)', value: 'consumivel' },
                { label: 'Durável (ex: impressora, colunas)', value: 'duravel' },
              ]}
            />
  `;
  inv = inv.replace(catSelectRegex, catSelectNew);
  inv = inv.replace('<div className="flex flex-col gap-1.5">\n            <label className="text-sm font-medium text-secondary-700">Categoria</label>', '<div className="flex flex-col gap-1.5 z-[60]">\n            <label className="text-sm font-medium text-secondary-700">Categoria</label>');
  fs.writeFileSync('src/features/inventory/components/inventory-form.tsx', inv);
  console.log('Inventory done');
}

// 2. Event Form
let ev = fs.readFileSync('src/features/events/components/event-form.tsx', 'utf8');
if (!ev.includes('CustomSelect')) {
  ev = ev.replace("import { UnsavedDialog } from '@/components/ui/unsaved-dialog'", "import { UnsavedDialog } from '@/components/ui/unsaved-dialog'\nimport { CustomSelect } from '@/components/ui/custom-select'");
  const statusSelectRegex = /<select[\s\S]*?value=\{status\}[\s\S]*?onChange=\{\(e\) => setStatus\(e\.target\.value as EventStatus\)\}[\s\S]*?<\/select>/;
  const statusSelectNew = `
            <CustomSelect
              value={status}
              onChange={(val) => setStatus(val as EventStatus)}
              options={Object.values(EVENT_STATUSES).map((s) => ({
                label: STATUS_LABELS[s],
                value: s,
              }))}
            />
  `;
  ev = ev.replace(statusSelectRegex, statusSelectNew);
  ev = ev.replace('<div className="flex flex-col gap-1.5">\n            <label className="text-sm font-medium text-secondary-700">Estado</label>', '<div className="flex flex-col gap-1.5 z-[60]">\n            <label className="text-sm font-medium text-secondary-700">Estado</label>');
  fs.writeFileSync('src/features/events/components/event-form.tsx', ev);
  console.log('Events done');
}
