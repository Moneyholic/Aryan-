const fs = require('fs');

const appTsxPath = 'src/App.tsx';
let appTsx = fs.readFileSync(appTsxPath, 'utf8');

const botCode = fs.readFileSync('bot_evaluated_mod.js', 'utf8');

// Escape backticks and template variables
const escapedBotCode = botCode.replace(/\\/g, '\\\\').replace(/\`/g, '\\`').replace(/\$\{/g, '\\${');

const startMarker = 'const EXTENSION_BOT_JS = `';
const endMarker = '`;';

const startIndex = appTsx.indexOf(startMarker);
if (startIndex === -1) {
    console.error("Could not find start marker");
    process.exit(1);
}

const endIndex = appTsx.indexOf(endMarker, startIndex + startMarker.length);
if (endIndex === -1) {
    console.error("Could not find end marker");
    process.exit(1);
}

const newAppTsx = appTsx.substring(0, startIndex + startMarker.length) + '\n' + escapedBotCode + '\n' + appTsx.substring(endIndex);

fs.writeFileSync(appTsxPath, newAppTsx);
console.log("Successfully injected modified bot code into App.tsx");
