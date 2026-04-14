const fs = require('fs');
let content = fs.readFileSync('./new_bot_content.js', 'utf8');

const target = `        row.innerHTML = '<div style="font-weight: 600; color: #111827; width: 30%;">' + asset + '</div>' +
'<div style="color: ' + signalColor + '; font-weight: 600; width: 40%; text-align: center;">' + signal + '</div>' +
'<div style="color: #6B7280; width: 30%; text-align: right;">
            
            
            <div style="color: #6B7280; width: 30%; text-align: right;">\${price ? price.toFixed(2) : '--'}</div>
        \`;`;

const replacement = `        row.innerHTML = '<div style="font-weight: 600; color: #111827; width: 30%;">' + asset + '</div>' +
'<div style="color: ' + signalColor + '; font-weight: 600; width: 40%; text-align: center;">' + signal + '</div>' +
'<div style="color: #6B7280; width: 30%; text-align: right;">$' + (price ? price.toFixed(2) : '--') + '</div>';`;

content = content.replace(target, replacement);

fs.writeFileSync('./new_bot_content.js', content);
console.log('Done');
