const fs = require('fs');

let appCode = fs.readFileSync('src/App.tsx', 'utf8');
const botCode = fs.readFileSync('bot_evaluated_mod4.js', 'utf8');

// Escape backticks and ${}
const escapedBotCode = botCode.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');

const startMarker = 'const EXTENSION_BOT_JS = `\n';
const endMarker = '})();`;\n\nexport default function App() {';

const startIndex = appCode.indexOf(startMarker);
const endIndex = appCode.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
    const newAppCode = appCode.substring(0, startIndex + startMarker.length) + escapedBotCode + '\n' + appCode.substring(endIndex);
    fs.writeFileSync('src/App.tsx', newAppCode);
    console.log('Successfully injected modified bot code back into App.tsx');
} else {
    console.error('Could not find markers in App.tsx');
    console.log('startIndex:', startIndex, 'endIndex:', endIndex);
}
