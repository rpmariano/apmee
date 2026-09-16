const fs = require('fs');
let content = fs.readFileSync('src/index.css', 'utf8');

const newThemeShadows = `  /* Elevated Shadows for Depth */
  --shadow-sm: 0 4px 20px -2px rgba(66, 77, 89, 0.12), 0 1px 3px -1px rgba(66, 77, 89, 0.08);
  --shadow-md: 0 10px 30px -4px rgba(66, 77, 89, 0.16), 0 4px 10px -2px rgba(66, 77, 89, 0.12);
  --shadow-lg: 0 15px 40px -5px rgba(66, 77, 89, 0.2), 0 5px 15px -3px rgba(66, 77, 89, 0.15);
  
  /* Fonts */`;

content = content.replace("  /* Fonts */", newThemeShadows);

// Let's also add a subtle inner shadow or a tiny top border highlight for "estrutura" (structure).
// We can redefine utilities for .shadow-sm to include a subtle box-shadow ring.
// Actually, Tailwind 4 uses native CSS custom properties for box shadow.

fs.writeFileSync('src/index.css', content);
