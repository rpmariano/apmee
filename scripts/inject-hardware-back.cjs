const fs = require('fs');
const glob = require('glob'); // Note: we can just use native fs readdir if glob is not installed, but let's just hardcode paths since there are only 7

const files = [
  'src/features/contacts/components/contact-form.tsx',
  'src/features/board/components/board-form.tsx',
  'src/features/tasks/components/task-form.tsx',
  'src/features/inventory/components/inventory-form.tsx',
  'src/features/quotas/components/quota-form.tsx',
  'src/features/events/components/event-form.tsx',
  'src/features/treasury/components/movement-form.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  if (!content.includes('useHardwareBack')) {
    // Inject import
    content = content.replace(
      "import { UnsavedDialog }",
      "import { useHardwareBack } from '@/hooks/use-hardware-back'\nimport { UnsavedDialog }"
    );
    
    // Inject hook call right after handleCloseClick definition
    // We can just place it after `const formRef = useRef<HTMLFormElement>(null)`
    const hookCall = `
  useHardwareBack(true, handleCloseClick)
`;
    content = content.replace(
      /const handleCloseClick = \(\) => \{[\s\S]*?\n  \}/,
      (match) => match + '\n' + hookCall
    );
    
    fs.writeFileSync(file, content);
    console.log(`Injected useHardwareBack into ${file}`);
  }
}
