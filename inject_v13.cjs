const fs = require('fs');
const botCode = fs.readFileSync('bot_extracted.js', 'utf8');
let appCode = fs.readFileSync('src/App.tsx', 'utf8');

// Update UI text
appCode = appCode.replace(/v12\.0/g, 'v13.0');

// Inject bot.js
const escapedBotCode = botCode.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');

const startIdx = appCode.indexOf('const EXTENSION_BOT_JS = `\n') + 'const EXTENSION_BOT_JS = `\n'.length;
const endIdx = appCode.indexOf('\n`;\n\nexport default function App() {');

if (startIdx !== -1 && endIdx !== -1) {
    appCode = appCode.substring(0, startIdx) + escapedBotCode + appCode.substring(endIdx);
    fs.writeFileSync('src/App.tsx', appCode);
    console.log("Injected bot.js and updated App.tsx for v13.0");
} else {
    console.log("Could not inject bot.js");
}
