const fs = require('fs');
let content = fs.readFileSync('src/pages/treasury.tsx', 'utf8');

const regex = /<div className="px-4 mt-2">[\s\S]*?<\/div>\s*<\/div>/;

const renderLogic = `{activeTab === 'events' ? (
        <EventFinances onEditMovement={handleEditMovement} />
      ) : (
        <div className="px-4 mt-2">
          <TreasurySummary movements={movements} isLoading={isLoading} />
          
          <div className="mt-6">
            <h3 className="font-bold text-foreground mb-2">Movimentos</h3>
            <MovementList 
              movements={movements} 
              filter={activeTab as any} 
              isLoading={isLoading} 
              onEdit={canWriteTreasury ? handleEditMovement : undefined} 
            />
          </div>
        </div>
      )}`;

content = content.replace(regex, renderLogic);
fs.writeFileSync('src/pages/treasury.tsx', content);
