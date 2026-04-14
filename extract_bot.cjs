const fs = require('fs');
const appCode = fs.readFileSync('src/App.tsx', 'utf8');

const startIdx = appCode.indexOf('const EXTENSION_BOT_JS = `\n') + 'const EXTENSION_BOT_JS = `\n'.length;
const endIdx = appCode.indexOf('\n`;\n\nexport default function App() {');

if (startIdx !== -1 && endIdx !== -1) {
    const botCode = appCode.substring(startIdx, endIdx).replace(/\\\\/g, '\\').replace(/\\`/g, '`').replace(/\\\$/g, '$');
    fs.writeFileSync('bot_extracted.js', botCode);
    console.log("Extracted bot.js");
} else {
    console.log("Could not extract bot.js");
}
