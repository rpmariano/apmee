const fs = require('fs');
let content = fs.readFileSync('src/features/treasury/components/event-finances.tsx', 'utf8');

content = content.replace(
  "{t.type === 'in' ? 'Entrada' : 'Saída'} de {t.quantity}",
  "{t.type === 'in' ? 'Entrada' : 'Saída'} de {t.quantity} {t.item?.name ? `(\${t.item.name})` : ''}"
);

fs.writeFileSync('src/features/treasury/components/event-finances.tsx', content);
