const fs = require('fs');
let content = fs.readFileSync('./new_bot_content.js', 'utf8');

content = content.replace(
    "const sessEl = el('ui-session');",
    "const sessEl = el('ui-session-time');"
);

content = content.replace(
    "sessEl.innerText = `⏱️ ${m}:${s}`;",
    "sessEl.innerText = `${m}:${s}`;"
);

fs.writeFileSync('./new_bot_content.js', content);
console.log('Done');
