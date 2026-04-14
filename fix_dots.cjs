const fs = require('fs');
let content = fs.readFileSync('./new_bot_content.js', 'utf8');

const target = `    function updateConnectionDot(connected) {
        const minDot = el('min-dot');
        const maxDot = el('max-dot');
        if (minDot) minDot.className = \`status-dot \${connected ? '' : 'disconnected'}\\
        if (maxDot) maxDot.className = \`status-dot \${connected ? '' : 'disconnected'}\`;
    }`;

// Since the backslash might be tricky to match exactly, let's use a regex or a simpler replace.
const regex = /function updateConnectionDot\(connected\) \{[\s\S]*?const minDot = el\('min-dot'\);[\s\S]*?const maxDot = el\('max-dot'\);[\s\S]*?if \(minDot\) minDot\.className = [^;]*;?\s*if \(maxDot\) maxDot\.className = [^;]*;?\s*\}/;

const replacement = `    function updateConnectionDot(connected) {
        const minDot = el('min-dot');
        const maxDot = el('max-dot');
        if (minDot) minDot.className = 'status-dot ' + (connected ? '' : 'disconnected');
        if (maxDot) maxDot.className = 'status-dot ' + (connected ? '' : 'disconnected');
    }`;

content = content.replace(regex, replacement);

fs.writeFileSync('./new_bot_content.js', content);
console.log('Done');
