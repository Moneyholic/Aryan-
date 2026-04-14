const fs = require('fs');
let content = fs.readFileSync('./new_bot_content.js', 'utf8');

// Find the start of the function
const startIdx = content.indexOf('function updateMultiChartStatus(asset, signal, price, macd) {');
// Find the end of the function (the closing brace before if (document.readyState === 'loading'))
const endIdx = content.indexOf("if (document.readyState === 'loading') {");

if (startIdx !== -1 && endIdx !== -1) {
    const newFunc = `function updateMultiChartStatus(asset, signal, price, macd) {
        const container = el('ui-multi-status');
        if (!container) return;
        
        let row = document.getElementById('multi-status-' + asset);
        if (!row) {
            row = document.createElement('div');
            row.id = 'multi-status-' + asset;
            row.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 6px; background: #F3F4F6; border-radius: 4px; font-size: 11px; margin-bottom: 4px;';
            container.appendChild(row);
        }
        
        let signalColor = '#6B7280';
        if (signal === 'UP' || signal === 'BUY ALARM') signalColor = '#10B981';
        if (signal === 'DOWN' || signal === 'SELL ALARM') signalColor = '#EF4444';
        if (signal === 'SIDEWAYS - WAITING') signalColor = '#F59E0B';
        
        row.innerHTML = '<div style="font-weight: 600; color: #111827; width: 30%;">' + asset + '</div>' +
            '<div style="color: ' + signalColor + '; font-weight: 600; width: 40%; text-align: center;">' + signal + '</div>' +
            '<div style="color: #6B7280; width: 30%; text-align: right;">$' + (price ? price.toFixed(2) : '--') + '</div>';
    }

    `;
    
    content = content.substring(0, startIdx) + newFunc + content.substring(endIdx);
    fs.writeFileSync('./new_bot_content.js', content);
    console.log('Done');
} else {
    console.log('Could not find function bounds');
}
