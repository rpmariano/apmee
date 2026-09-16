const fs = require('fs');
let content = fs.readFileSync('src/features/inventory/components/inventory-form.tsx', 'utf8');

const nameFieldRegex = /<div className="flex flex-col gap-1\.5 z-\[70\]">[\s\S]*?<\/div>/;
const catFieldRegex = /<div className="flex flex-col gap-1\.5">[\s\S]*?<label className="text-sm font-medium text-secondary-700">Categoria<\/label>[\s\S]*?<\/div>/;

const nameMatch = content.match(nameFieldRegex)[0];
const catMatch = content.match(catFieldRegex)[0];

// Swap their positions in the content
// They appear sequentially: Name then Category.
const combinedRegex = new RegExp(
  nameMatch.replace(/[.*+?^$\\{}()|[\\]\\\\]/g, '\\\\$&') + "\\n\\n          " + catMatch.replace(/[.*+?^$\\{}()|[\\]\\\\]/g, '\\\\$&')
);

const swapped = catMatch.replace('gap-1.5"', 'gap-1.5 z-[80]"') + "\n\n          " + nameMatch.replace('z-[70]', 'z-[70]');

content = content.replace(nameMatch + "\n\n          " + catMatch, swapped);

fs.writeFileSync('src/features/inventory/components/inventory-form.tsx', content);
