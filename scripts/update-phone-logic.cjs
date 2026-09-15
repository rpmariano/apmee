const fs = require('fs');
let content = fs.readFileSync('src/features/contacts/components/contact-form.tsx', 'utf8');

const regex = /\s*\/\/\s*Auto-fill WhatsApp with phone number if it's empty when phone is typed\s*const handlePhoneChange = \(val: string\) => \{\s*setPhone\(val\)\s*if \(\!whatsapp\) setWhatsapp\(val\)\s*\}/;

const newLogic = `
  const handlePhoneChange = (val: string) => {
    if (whatsapp === phone || !whatsapp) {
      setWhatsapp(val)
    }
    setPhone(val)
  }

  const handleWhatsappChange = (val: string) => {
    if (phone === whatsapp || !phone) {
      setPhone(val)
    }
    setWhatsapp(val)
  }`;

content = content.replace(regex, newLogic);
fs.writeFileSync('src/features/contacts/components/contact-form.tsx', content);
