const fs = require('fs');
let code = fs.readFileSync('bot_evaluated_mod.js', 'utf8');

// Remove the multi-chart update from WebSocket interceptor for ignored assets
code = code.replace(
    /if \(item\.p\) \{[\s\S]*?if \(item\.p !== state\.selectedAsset\) \{/,
    `if (item.p !== state.selectedAsset) {`
);

fs.writeFileSync('bot_evaluated_mod2.js', code);
console.log('Modifications applied.');
