const fs = require('fs');
let content = fs.readFileSync('./new_bot_content.js', 'utf8');

const targetStr = `// KAREN & ARYAN Floating App - bot.js
(function() {
    if (document.getElementById('karen-host')) return;`;

const replacementStr = `// KAREN & ARYAN Floating App - bot.js
(function() {
    // Prevent bot from running inside hidden iframes
    if (window.self !== window.top) return;
    
    if (document.getElementById('karen-host')) return;`;

content = content.replace(targetStr, replacementStr);

fs.writeFileSync('./new_bot_content.js', content);
console.log('Done');
