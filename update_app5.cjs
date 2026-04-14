const fs = require('fs');

const appPath = './src/App.tsx';
let appContent = fs.readFileSync(appPath, 'utf8');

const newBotContent = fs.readFileSync('./new_bot_content.js', 'utf8');

// Replace EXTENSION_BOT_JS
const botStartStr = 'const EXTENSION_BOT_JS = `// KAREN & ARYAN Floating App - bot.js';
const botStartIndex = appContent.indexOf(botStartStr);

if (botStartIndex !== -1) {
    // Find the end of the string.
    const endMarker = 'export default function App() {';
    const botEndIndex = appContent.indexOf(endMarker, botStartIndex);
    if (botEndIndex !== -1) {
        // Find the `;\n\n just before it
        const actualEnd = appContent.lastIndexOf('`;', botEndIndex);
        if (actualEnd !== -1) {
            const before = appContent.substring(0, botStartIndex);
            const after = appContent.substring(actualEnd + 2); // skip `;
            appContent = before + 'const EXTENSION_BOT_JS = `' + newBotContent + '`;' + after;
        } else {
            console.log("Could not find `; before export default function App() {");
        }
    } else {
        console.log("Could not find end of EXTENSION_BOT_JS");
    }
} else {
    console.log("Could not find start of EXTENSION_BOT_JS");
}

fs.writeFileSync(appPath, appContent);
console.log('App.tsx updated successfully.');
