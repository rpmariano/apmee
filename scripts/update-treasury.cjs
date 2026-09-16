const fs = require('fs');
let content = fs.readFileSync('src/pages/treasury.tsx', 'utf8');

// 1. Update filter type
content = content.replace(
  "type FilterValue = FinancialType | 'all'",
  "type FilterValue = FinancialType | 'all' | 'events'"
);

// 2. Add events tab
content = content.replace(
  "{ value: 'expense', label: 'Despesas' },",
  "{ value: 'expense', label: 'Despesas' },\n  { value: 'events', label: 'Eventos' },"
);

// 3. Import EventFinances
if (!content.includes('EventFinances')) {
  content = content.replace(
    "import { MovementList } from '@/features/treasury/components/movement-list'",
    "import { MovementList } from '@/features/treasury/components/movement-list'\nimport { EventFinances } from '@/features/treasury/components/event-finances'"
  );
}

// 4. Update the render logic
const renderLogic = `{activeTab === 'events' ? (
        <EventFinances onEditMovement={handleEditMovement} />
      ) : (
        <>
          <div className="px-4 py-4">
            <TreasurySummary movements={movements} filter={activeTab} />
          </div>

          <div className="px-4">
            <MovementList 
              filter={activeTab} 
              onEditMovement={handleEditMovement} 
            />
          </div>
        </>
      )}`;

const oldRenderLogicRegex = /<div className="px-4 py-4">\s*<TreasurySummary movements=\{movements\} filter=\{activeTab\} \/>\s*<\/div>\s*<div className="px-4">\s*<MovementList\s*filter=\{activeTab\}\s*onEditMovement=\{handleEditMovement\}\s*\/>\s*<\/div>/;

content = content.replace(oldRenderLogicRegex, renderLogic);

fs.writeFileSync('src/pages/treasury.tsx', content);
