const fs = require('fs');
let code = fs.readFileSync('bot_extracted.js', 'utf8');

code = code.replace(
    /if \(!row\) \{([\s\S]*?)if \(window\.LightweightCharts\) \{([\s\S]*?)\}\s*\}/,
    `if (!row) {
            $1
        }
        
        if (!window.multiCharts[asset] && window.LightweightCharts) {
            const chartContainer = row.querySelector('div:last-child');
            if (chartContainer) {
                $2
            }
        }`
);

fs.writeFileSync('bot_extracted.js', code);
