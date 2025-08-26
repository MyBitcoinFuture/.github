const fs = require('fs');
const path = require('path');

const cliFile = path.join(__dirname, 'cli/cli.js');
let content = fs.readFileSync(cliFile, 'utf8');

// Pattern to match case statements that have const declarations
const casePattern = /(case\s+['"`][^'"`]+['"`]\s*:\s*\n\s*const\s+)/g;

// Replace with case statements wrapped in braces
content = content.replace(casePattern, (match, casePart) => {
  return casePart.replace(/:\s*\n\s*/, ': {\n              ');
});

// Add closing braces before break statements in case blocks
const breakPattern = /(\s+break;\s*\n\s*)(case\s+['"`][^'"`]+['"`]\s*:)/g;
content = content.replace(breakPattern, (match, breakPart, nextCase) => {
  return breakPart.replace(/break;\s*\n\s*/, 'break;\n            }\n\n            ');
});

// Handle the last case in each switch statement
const lastBreakPattern = /(\s+break;\s*\n\s*)(default\s*:)/g;
content = content.replace(lastBreakPattern, (match, breakPart, defaultPart) => {
  return breakPart.replace(/break;\s*\n\s*/, 'break;\n            }\n\n            ');
});

// Handle the very last break in switch statements
const finalBreakPattern = /(\s+break;\s*\n\s*)(\s*}\s*\/\/\s*end\s+switch)/g;
content = content.replace(finalBreakPattern, (match, breakPart, endPart) => {
  return breakPart.replace(/break;\s*\n\s*/, 'break;\n            }\n\n            ');
});

// Also handle cases where there's no break but the case ends
const caseEndPattern = /(\s*}\s*\/\/\s*end\s+switch)/g;
content = content.replace(caseEndPattern, (match) => {
  return '            }\n\n            ' + match;
});

fs.writeFileSync(cliFile, content);
console.log('Fixed case declarations in CLI file');
