const fs = require('fs');
let content = fs.readFileSync('src/features/treasury/components/event-finances.tsx', 'utf8');

if (!content.includes('import { useInventoryTransactions }')) {
  content = content.replace(
    "import { useMovements } from '@/features/treasury/api/use-treasury'",
    "import { useMovements } from '@/features/treasury/api/use-treasury'\nimport { useInventoryTransactions } from '@/features/inventory/api/use-inventory-transactions'\nimport { ArrowDownRight, ArrowUpRight, Package } from 'lucide-react'"
  );
}

if (!content.includes('const { data: transactions }')) {
  content = content.replace(
    "const { data: movements, isLoading: isLoadingMovements } = useMovements()",
    "const { data: movements, isLoading: isLoadingMovements } = useMovements()\n  const { data: transactions, isLoading: isLoadingTransactions } = useInventoryTransactions()"
  );
}

content = content.replace(
  "if (isLoadingEvents || isLoadingMovements) {",
  "if (isLoadingEvents || isLoadingMovements || isLoadingTransactions) {"
);

// Add the inventory transactions section
const newSection = `
          <div className="flex flex-col gap-3 mt-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-secondary-600">
              Material Movimentado
            </h3>
            {eventTransactions.length === 0 ? (
              <p className="text-sm text-muted text-center py-4">Nenhum registo de inventário para este evento.</p>
            ) : (
              eventTransactions.map(t => (
                <div key={t.id} className="flex gap-3 rounded-[var(--radius-card)] border border-warm-200 bg-surface p-3">
                  <div className={\`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md \${t.type === 'in' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}\`}>
                    {t.type === 'in' ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      {t.type === 'in' ? 'Entrada' : 'Saída'} de {t.quantity}
                    </p>
                    {t.notes && <p className="text-xs text-muted mt-0.5">{t.notes}</p>}
                  </div>
                </div>
              ))
            )}
          </div>
`;

if (!content.includes("Material Movimentado")) {
  content = content.replace(
    "const eventMovements = (movements || []).filter(m => m.event_id === selectedEventId)",
    "const eventMovements = (movements || []).filter(m => m.event_id === selectedEventId)\n  const eventTransactions = (transactions || []).filter(t => t.event_id === selectedEventId)"
  );
  
  content = content.replace(
    "            )}",
    "            )}\n          </div>\n" + newSection
  );
}

fs.writeFileSync('src/features/treasury/components/event-finances.tsx', content);
