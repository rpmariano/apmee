const fs = require('fs');
let content = fs.readFileSync('src/index.css', 'utf8');

// Replace the previous shadows
content = content.replace(
  /  \/\* Elevated Shadows for Depth \*\/[\s\S]*?\/\* Fonts \*\//,
  `  /* Elevated Shadows for Depth & Structure */
  --shadow-sm: 0 4px 15px -2px rgba(66, 77, 89, 0.08), 0 1px 3px -1px rgba(66, 77, 89, 0.04), inset 0 1px 0 0 rgba(255, 255, 255, 0.9);
  --shadow-md: 0 10px 25px -4px rgba(66, 77, 89, 0.12), 0 4px 10px -2px rgba(66, 77, 89, 0.08), inset 0 1px 0 0 rgba(255, 255, 255, 0.9);
  --shadow-lg: 0 20px 40px -5px rgba(66, 77, 89, 0.18), 0 8px 15px -3px rgba(66, 77, 89, 0.12), inset 0 1px 0 0 rgba(255, 255, 255, 0.9);
  
  /* Fonts */`
);

fs.writeFileSync('src/index.css', content);
