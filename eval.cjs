const fs = require('fs');
const str = fs.readFileSync('bot_extracted.js', 'utf8');
try {
    const evaluated = eval('`' + str + '`');
    fs.writeFileSync('bot_evaluated.js', evaluated);
    console.log('Evaluated successfully.');
} catch (e) {
    console.error('Eval error:', e);
}
