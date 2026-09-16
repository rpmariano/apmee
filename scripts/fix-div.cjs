const fs = require('fs');
let content = fs.readFileSync('src/features/treasury/components/event-finances.tsx', 'utf8');

content = content.replace("          </div>\n\n          </div>", "          </div>");

fs.writeFileSync('src/features/treasury/components/event-finances.tsx', content);
