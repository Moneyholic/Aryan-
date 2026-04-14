const fs = require('fs');
let appCode = fs.readFileSync('src/App.tsx', 'utf8');

const target = `    if (!isIframe) {
        
        // Listen for messages from Headless Iframes
        window.addEventListener('message', (e) => {
            if (!e.data || !e.data.type) return;
            
            if (e.data.type === 'KAREN_TOGGLE_BOT') {
                if (isIframe) {
                    state.isRunning = e.data.isRunning;
                    if (e.data.code) state.activeCode = e.data.code;
                    setSignal(state.isRunning ? 'WAIT' : 'PAUSED');
                    addLog(state.isRunning ? \`Started via Master\` : \`Stopped via Master\`, 'info');
                }
            }
            else if (e.data.type === 'KAREN_LOG') {
                addLog('[' + e.data.asset + '] ' + e.data.msg, e.data.logType);
            }
            else if (e.data.type === 'KAREN_ALARM') {
                window.ring('[' + e.data.asset + '] ' + e.data.msg);
                window.vibrate('[' + e.data.asset + '] ' + e.data.msg);
                addLog('[' + e.data.asset + '] ALARM TRIGGERED: ' + e.data.msg, 'custom');
            }
            else if (e.data.type === 'KAREN_HISTORICAL') { updateMultiChartHistorical(e.data.asset, e.data.candle); }
            else if (e.data.type === 'KAREN_STATUS') {
                updateMultiChartStatus(e.data.asset, e.data.signal, e.data.price, e.data.macd, e.data.candle);
            }
        });`;

const replacement = `    window.addEventListener('message', (e) => {
        if (!e.data || !e.data.type) return;
        
        if (e.data.type === 'KAREN_TOGGLE_BOT') {
            if (isIframe) {
                state.isRunning = e.data.isRunning;
                if (e.data.code) state.activeCode = e.data.code;
                setSignal(state.isRunning ? 'WAIT' : 'PAUSED');
                addLog(state.isRunning ? \`Started via Master\` : \`Stopped via Master\`, 'info');
            }
        }
    });

    if (!isIframe) {
        
        // Listen for messages from Headless Iframes
        window.addEventListener('message', (e) => {
            if (!e.data || !e.data.type) return;
            
            if (e.data.type === 'KAREN_LOG') {
                addLog('[' + e.data.asset + '] ' + e.data.msg, e.data.logType);
            }
            else if (e.data.type === 'KAREN_ALARM') {
                window.ring('[' + e.data.asset + '] ' + e.data.msg);
                window.vibrate('[' + e.data.asset + '] ' + e.data.msg);
                addLog('[' + e.data.asset + '] ALARM TRIGGERED: ' + e.data.msg, 'custom');
            }
            else if (e.data.type === 'KAREN_HISTORICAL') { updateMultiChartHistorical(e.data.asset, e.data.candle); }
            else if (e.data.type === 'KAREN_STATUS') {
                updateMultiChartStatus(e.data.asset, e.data.signal, e.data.price, e.data.macd, e.data.candle);
            }
        });`;

if (appCode.includes(target)) {
    appCode = appCode.replace(target, replacement);
    fs.writeFileSync('src/App.tsx', appCode);
    console.log("Successfully replaced target block.");
} else {
    console.log("Target block not found.");
}
