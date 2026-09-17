const fs = require('fs');

// 1. Fix board-form duplicate disabled
let content = fs.readFileSync('src/features/board/components/board-form.tsx', 'utf8');
content = content.replace(
  '<input disabled={!isEditing} \n              type="email"\n              value={email}\n              onChange={(e) => setEmail(e.target.value)}\n              required\n              disabled={!!member}',
  '<input disabled={!isEditing || !!member} \n              type="email"\n              value={email}\n              onChange={(e) => setEmail(e.target.value)}\n              required'
);
fs.writeFileSync('src/features/board/components/board-form.tsx', content);

// 2. Fix quota-form duplicate disabled
content = fs.readFileSync('src/features/quotas/components/quota-form.tsx', 'utf8');
content = content.replace(
  '<CustomSelect disabled={!isEditing} \n              value={contactId}\n              onChange={(val) => setContactId(val)}\n              options={(contacts || []).map(c => ({ label: c.name, value: c.id }))}\n              placeholder={isLoadingContacts ? \'A carregar associados...\' : \'Selecione o associado\'}\n              disabled={!!quota}',
  '<CustomSelect disabled={!isEditing || !!quota} \n              value={contactId}\n              onChange={(val) => setContactId(val)}\n              options={(contacts || []).map(c => ({ label: c.name, value: c.id }))}\n              placeholder={isLoadingContacts ? \'A carregar associados...\' : \'Selecione o associado\'}'
);
fs.writeFileSync('src/features/quotas/components/quota-form.tsx', content);

// 3. Fix inventory-card onEdit
content = fs.readFileSync('src/features/inventory/components/inventory-card.tsx', 'utf8');
content = content.replace(
  'isLowStock && "border-orange-200 bg-orange-50"\n    )}>',
  'isLowStock && "border-orange-200 bg-orange-50",\n      onEdit && "cursor-pointer active:scale-[0.98]"\n    )}\n    onClick={() => onEdit && onEdit(item)}>'
);
fs.writeFileSync('src/features/inventory/components/inventory-card.tsx', content);

// 4. Fix task-card onEdit
content = fs.readFileSync('src/features/tasks/components/task-card.tsx', 'utf8');
content = content.replace(
  'isDone && "opacity-75 bg-warm-50"\n    )}>',
  'isDone && "opacity-75 bg-warm-50",\n      onEdit && "cursor-pointer active:scale-[0.98]"\n    )}\n    onClick={() => onEdit && onEdit(task)}>'
);

// We should also remove the explicit `onClick={() => onEdit && onEdit(task)}` if it was somehow nested, but it wasn't. Wait, task-card has a button for toggling status!
// If the whole card is clickable, clicking the toggle status button will ALSO trigger onEdit(task) (event bubbling).
// We should add `e.stopPropagation()` to the toggle status button.
content = content.replace(
  'onClick={() => onToggleStatus(task)}',
  'onClick={(e) => { e.stopPropagation(); onToggleStatus(task); }}'
);
fs.writeFileSync('src/features/tasks/components/task-card.tsx', content);

// 5. Similar check for inventory-card. It has `onTransaction` button (Movimentar).
content = fs.readFileSync('src/features/inventory/components/inventory-card.tsx', 'utf8');
content = content.replace(
  'onClick={() => onTransaction(item)}',
  'onClick={(e) => { e.stopPropagation(); onTransaction(item); }}'
);
fs.writeFileSync('src/features/inventory/components/inventory-card.tsx', content);

console.log('Fixed typescript issues');
