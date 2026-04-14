const fs = require('fs');

const appTsx = fs.readFileSync('./src/App.tsx', 'utf8');

const startMarker = 'const EXTENSION_BOT_JS = \`';
const startIndex = appTsx.indexOf(startMarker);
const endMarker = '})();\`;';
const endIndex = appTsx.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
    let rawJs = appTsx.substring(startIndex + startMarker.length, endIndex + 5);
    
    // We can just evaluate it as a template literal to get the exact string
    const evaluatedJs = eval('\`' + rawJs + '\`');
    
    fs.writeFileSync('./bot_evaluated.js', evaluatedJs);
    console.log('Extracted evaluated bot.js');
} else {
    console.log('Could not extract bot.js');
}
