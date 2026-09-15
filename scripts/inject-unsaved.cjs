const fs = require('fs');
const glob = require('glob');
const files = glob.sync('src/features/**/components/*-form.tsx');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  if (content.includes('UnsavedDialog')) return;
  
  // 1. Imports
  content = content.replace(/import \{ useState \} from 'react'/, 'import { useState, useRef } from \'react\'');
  
  if (!content.includes('useRef')) {
    content = content.replace(/import React, \{ useState \} from 'react'/, 'import React, { useState, useRef } from \'react\'');
  }
  
  content = content.replace(/interface /, 'import { UnsavedDialog } from \'@/components/ui/unsaved-dialog\'\n\ninterface ');

  // 2. Add hooks
  const funcRegex = /(export function [A-Za-z]+Form\([^)]+\)\s*\{)/;
  const hookInjection = `
  const [isDirty, setIsDirty] = useState(false)
  const [showUnsaved, setShowUnsaved] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const handleCloseClick = () => {
    if (isDirty) setShowUnsaved(true)
    else onClose()
  }

  const handleSaveAndClose = () => {
    setShowUnsaved(false)
    formRef.current?.requestSubmit()
  }
`;
  content = content.replace(funcRegex, '$1\n' + hookInjection);

  // 3. Update onClick={onClose}
  content = content.replace(/onClick=\{onClose\}/g, 'onClick={handleCloseClick}');

  // 4. Update <form ...>
  content = content.replace(/<form([^>]*)onSubmit=\{handleSubmit\}/, '<form ref={formRef} onChange={() => setIsDirty(true)} $1 onSubmit={handleSubmit}');

  // 5. Add dialog at the bottom
  const dialogHtml = `
      <UnsavedDialog
        isOpen={showUnsaved}
        onCancel={() => setShowUnsaved(false)}
        onDiscard={() => {
          setShowUnsaved(false)
          onClose()
        }}
        onSave={handleSaveAndClose}
      />
`;
  
  const lastDivIndex = content.lastIndexOf('</div>');
  if (lastDivIndex !== -1) {
    content = content.slice(0, lastDivIndex) + dialogHtml + content.slice(lastDivIndex);
  }

  fs.writeFileSync(file, content);
  console.log('Processed:', file);
});
