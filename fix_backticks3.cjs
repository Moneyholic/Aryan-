const fs = require('fs');
let content = fs.readFileSync('./new_bot_content.js', 'utf8');

// The previous replace failed because of the backticks inside the string literal in the node script.
// Let's just do a clean regex replace for that specific block.

content = content.replace(
    /row\.innerHTML = `[\s\S]*?`;/,
    "row.innerHTML = '<div style=\"font-weight: 600; color: #111827; width: 30%;\">' + asset + '</div>' + '<div style=\"color: ' + signalColor + '; font-weight: 600; width: 40%; text-align: center;\">' + signal + '</div>' + '<div style=\"color: #6B7280; width: 30%; text-align: right;\">$' + (price ? price.toFixed(2) : '--') + '</div>';"
);

fs.writeFileSync('./new_bot_content.js', content);
console.log('Done');
