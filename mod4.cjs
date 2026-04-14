const fs = require('fs');
let code = fs.readFileSync('bot_evaluated_mod3.js', 'utf8');

code = code.replace(
    /if \(!isIframe\) \{/,
    `if (isIframe) {
        state.isRunning = true;
        setSignal('WAIT');
    }
    
    if (!isIframe) {`
);

fs.writeFileSync('bot_evaluated_mod4.js', code);
console.log('Modifications applied.');
