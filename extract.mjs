import fs from 'fs';

const text = fs.readFileSync('src/App.tsx', 'utf-8');
const match = text.match(/const EXTENSION_BOT_JS = `([\s\S]*?)`;\n\nexport default function/);
if (match) {
    fs.writeFileSync('temp_bot.js', match[1]);
    console.log("Extracted temp_bot.js successfully");
} else {
    console.error("Could not find EXTENSION_BOT_JS");
}
