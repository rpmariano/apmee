const fs = require('fs');
let content = fs.readFileSync('src/features/treasury/components/movement-form.tsx', 'utf8');

// Undo the bad state replace
content = content.replace(
  "const [category,\n      event_id: eventId || null, setCategory] = useState(movement?.category ?? '')",
  "const [category, setCategory] = useState(movement?.category ?? '')"
);

// Properly insert event_id in the onSubmit body
const submitBody = `onSubmit({
      type,
      amount: Number(amount),
      description,
      category,
      date: dateIso,
      receipt_url: finalReceiptUrl,
    })`;

const newSubmitBody = `onSubmit({
      type,
      amount: Number(amount),
      description,
      category,
      event_id: eventId || null,
      date: dateIso,
      receipt_url: finalReceiptUrl,
    })`;

content = content.replace(submitBody, newSubmitBody);

fs.writeFileSync('src/features/treasury/components/movement-form.tsx', content);
