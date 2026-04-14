const fs = require('fs');
let code = fs.readFileSync('bot_evaluated_mod2.js', 'utf8');

// Read asset from URL parameter
code = code.replace(
    /selectedAsset: 'BTCUSD_OTC',/,
    `selectedAsset: new URLSearchParams(window.location.search).get('asset') || 'BTCUSD_OTC',`
);

fs.writeFileSync('bot_evaluated_mod3.js', code);
console.log('Modifications applied.');
