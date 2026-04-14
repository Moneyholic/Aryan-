const fs = require('fs');
let content = fs.readFileSync('./new_bot_content.js', 'utf8');

content = content.replace(
    "addLog(`Injected hidden chart for ${asset}`, 'info');",
    "addLog('Injected hidden chart for ' + asset, 'info');"
);

fs.writeFileSync('./new_bot_content.js', content);
console.log('Done');
