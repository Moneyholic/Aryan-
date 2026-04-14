const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
const lines = code.split('\n');

// Keep lines 0 to 1270 (which is line 1 to 1271)
const before = lines.slice(0, 1271);

// The original line 1271 was just the start of the string.
// Let's replace the last line of `before` with the merged line.
before[1270] = "                '<div style=\"color: #6B7280; width: 30%; text-align: right;\">$' + (price ? price.toFixed(2) : '--') + '</div>';";

// Keep lines from 1429 onwards (which is index 1429)
const after = lines.slice(1429);

const newCode = before.concat(after).join('\n');
fs.writeFileSync('src/App.tsx', newCode);
console.log("Fixed App.tsx successfully!");
