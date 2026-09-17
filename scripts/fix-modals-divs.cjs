const fs = require('fs');
const path = require('path');

const files = [
  'src/features/board/components/board-form.tsx',
  'src/features/contacts/components/contact-form.tsx',
  'src/features/events/components/event-form.tsx',
  'src/features/inventory/components/inventory-form.tsx',
  'src/features/inventory/components/transaction-form.tsx', // Actually didn't match the regex earlier
  'src/features/quotas/components/quota-form.tsx',
  'src/features/tasks/components/task-form.tsx',
  'src/features/treasury/components/movement-form.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('{/* Phone container */')) {
    // Need to insert a closing div before the very last </div>
    // Let's find the last </div>
    const lastDivIndex = content.lastIndexOf('</div>');
    if (lastDivIndex !== -1) {
      content = content.substring(0, lastDivIndex) + '</div>\n' + content.substring(lastDivIndex);
      fs.writeFileSync(file, content);
      console.log(`Updated ${file}`);
    }
  }
}

// Now handle transaction-form.tsx separately (it had a different structure)
let txContent = fs.readFileSync('src/features/inventory/components/transaction-form.tsx', 'utf8');
if (!txContent.includes('{/* Phone container */')) {
  txContent = txContent.replace(
    /className="fixed inset-0 z-\[100\] flex flex-col bg-background"/,
    'className="fixed inset-0 z-[100] flex justify-center bg-warm-100">{/* Phone container */<div className="flex w-full max-w-[430px] flex-col bg-background shadow-xl"'
  );
  if (txContent.includes('{/* Phone container */')) {
    const lastDivIndex = txContent.lastIndexOf('</div>');
    if (lastDivIndex !== -1) {
      txContent = txContent.substring(0, lastDivIndex) + '</div>\n' + txContent.substring(lastDivIndex);
      fs.writeFileSync('src/features/inventory/components/transaction-form.tsx', txContent);
      console.log('Updated transaction-form.tsx');
    }
  }
}

// Now handle menu-alerts.tsx
let alertsContent = fs.readFileSync('src/components/ui/menu-alerts.tsx', 'utf8');
if (!alertsContent.includes('{/* Phone container */')) {
  alertsContent = alertsContent.replace(
    /className="fixed inset-0 z-\[100\] flex flex-col bg-background\/80 backdrop-blur-sm animate-in fade-in"/,
    'className="fixed inset-0 z-[100] flex justify-center bg-warm-100/80 backdrop-blur-sm animate-in fade-in">{/* Phone container */<div className="flex w-full max-w-[430px] flex-col bg-background shadow-xl"'
  );
  if (alertsContent.includes('{/* Phone container */')) {
     const lastDivIndex = alertsContent.lastIndexOf('</div>');
     if (lastDivIndex !== -1) {
       alertsContent = alertsContent.substring(0, lastDivIndex) + '</div>\n' + alertsContent.substring(lastDivIndex);
       fs.writeFileSync('src/components/ui/menu-alerts.tsx', alertsContent);
       console.log('Updated menu-alerts.tsx');
     }
  }
}

console.log('Done');
