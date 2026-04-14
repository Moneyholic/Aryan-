const fs = require('fs');
const botCode = fs.readFileSync('bot_extracted.js', 'utf8');
let appCode = fs.readFileSync('src/App.tsx', 'utf8');

const startIdx = appCode.indexOf('const EXTENSION_BOT_JS = `');
if (startIdx !== -1) {
    const appStartIdx = appCode.indexOf('  const [isDownloading, setIsDownloading] = useState(false);');
    
    if (appStartIdx !== -1) {
        const before = appCode.substring(0, startIdx);
        const after = appCode.substring(appStartIdx);
        
        const escapedBotCode = botCode.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
        
        const newMiddle = "const EXTENSION_BOT_JS = `\n" + escapedBotCode + "\n`;\n\nexport default function App() {\n";
        
        fs.writeFileSync('src/App.tsx', before + newMiddle + after);
        console.log("Fixed App.tsx successfully!");
    } else {
        console.log("Could not find App component start.");
    }
} else {
    console.log("Could not find EXTENSION_BOT_JS.");
}
