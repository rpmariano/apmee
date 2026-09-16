const fs = require('fs');
let content = fs.readFileSync('src/features/tasks/components/task-form.tsx', 'utf8');

content = content.replace("const [isDirty, setIsDirty] = useState(false)", "");
content = content.replace("onChange={() => setIsDirty(true)}", "");

const stateMatch = `const [assignedTo, setAssignedTo] = useState(task?.assigned_to ?? '')`;

const computedIsDirty = `
  const isDirty = (
    title !== (task?.title ?? '') ||
    description !== (task?.description ?? '') ||
    priority !== (task?.priority ?? TASK_PRIORITIES.MEDIUM) ||
    status !== (task?.status ?? TASK_STATUSES.TODO) ||
    dueDate !== toDateString(task?.due_date) ||
    assignedTo !== (task?.assigned_to ?? '')
  )
`;

content = content.replace(stateMatch, stateMatch + "\n" + computedIsDirty);

fs.writeFileSync('src/features/tasks/components/task-form.tsx', content);
