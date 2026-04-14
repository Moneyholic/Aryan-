const fs = require('fs');
let content = fs.readFileSync('./new_bot_content.js', 'utf8');

content = content.replace(
    "addLog(`[${e.data.asset}] ${e.data.msg}`, e.data.logType);",
    "addLog('[' + e.data.asset + '] ' + e.data.msg, e.data.logType);"
);

content = content.replace(
    "window.ring(`[${e.data.asset}] ${e.data.msg}`);",
    "window.ring('[' + e.data.asset + '] ' + e.data.msg);"
);

content = content.replace(
    "window.vibrate(`[${e.data.asset}] ${e.data.msg}`);",
    "window.vibrate('[' + e.data.asset + '] ' + e.data.msg);"
);

content = content.replace(
    "addLog(`[${e.data.asset}] ALARM TRIGGERED: ${e.data.msg}`, 'custom');",
    "addLog('[' + e.data.asset + '] ALARM TRIGGERED: ' + e.data.msg, 'custom');"
);

content = content.replace(
    "row.innerHTML = `",
    "row.innerHTML = '<div style=\"font-weight: 600; color: #111827; width: 30%;\">' + asset + '</div>' +\n'<div style=\"color: ' + signalColor + '; font-weight: 600; width: 40%; text-align: center;\">' + signal + '</div>' +\n'<div style=\"color: #6B7280; width: 30%; text-align: right;\">$' + (price ? price.toFixed(2) : '--') + '</div>';"
);

content = content.replace(
    "<div style=\"font-weight: 600; color: #111827; width: 30%;\">${asset}</div>",
    ""
);
content = content.replace(
    "<div style=\"color: ${signalColor}; font-weight: 600; width: 40%; text-align: center;\">${signal}</div>",
    ""
);
content = content.replace(
    "<div style=\"color: #6B7280; width: 30%; text-align: right;\">$${price ? price.toFixed(2) : '--'}</div>",
    ""
);
content = content.replace(
    "`;",
    ""
);

fs.writeFileSync('./new_bot_content.js', content);
console.log('Done');
