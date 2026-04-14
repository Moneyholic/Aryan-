const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const lines = code.split('\n');
console.log(lines[1270]);
