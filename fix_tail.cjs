const fs = require('fs');
let content = fs.readFileSync('./new_bot_content.js', 'utf8');

// The file got completely messed up at the end. Let's find the first instance of 'function updateMultiChartStatus'
// and just truncate the file there, then append the correct ending.

const startIdx = content.indexOf('function updateMultiChartStatus(asset, signal, price, macd) {');

if (startIdx !== -1) {
    const cleanContent = content.substring(0, startIdx);
    const correctEnding = `function updateMultiChartStatus(asset, signal, price, macd) {
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

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initUI);
    } else {
        initUI();
    }
})();`;
    
    fs.writeFileSync('./new_bot_content.js', cleanContent + correctEnding);
    console.log('Done');
} else {
    console.log('Could not find function bounds');
}
