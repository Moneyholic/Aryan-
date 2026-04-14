const fs = require('fs');
let content = fs.readFileSync('./new_bot_content.js', 'utf8');

const targetStr = `            macdHistory: state.macdHistory,
            candles: state.candles,
            signal: (sig) => setSignal(sig),`;

const replacementStr = `            macdHistory: state.macdHistory,
            candles: state.candles,
            histState: state.histState,
            signal: (sig) => setSignal(sig),`;

content = content.replace(targetStr, replacementStr);

fs.writeFileSync('./new_bot_content.js', content);
console.log('Done');
