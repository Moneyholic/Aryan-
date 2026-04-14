const fs = require('fs');
let code = fs.readFileSync('bot_extracted.js', 'utf8');

const startIdx = code.indexOf('function updateMultiChartHistorical(asset, candle) {');
const endIdx = code.indexOf("window.addEventListener('message', (e) => {");

if (startIdx !== -1 && endIdx !== -1) {
    const oldCode = code.substring(startIdx, endIdx);
    const newCode = `function getMinionIndexForAsset(asset) {
        if (!window.minionCharts) return null;
        // First check if it's already assigned
        for(let i=1; i<=3; i++) {
            if (window.minionCharts[i] && window.minionCharts[i].asset === asset) return i;
        }
        // If not, assign to first available
        for(let i=1; i<=3; i++) {
            if (window.minionCharts[i] && !window.minionCharts[i].asset) {
                window.minionCharts[i].asset = asset;
                const nameEl = el('ui-asset-name-' + i);
                if (nameEl) nameEl.innerText = asset;
                return i;
            }
        }
        return null;
    }

    function updateMultiChartHistorical(asset, candle) {
        const idx = getMinionIndexForAsset(asset);
        if (!idx) return;
        const mc = window.minionCharts[idx];
        if (mc && mc.series) {
            mc.series.update(candle);
        }
    }

    function updateMultiChartStatus(asset, signal, price, macd, candle) {
        if (!asset) return;
        const idx = getMinionIndexForAsset(asset);
        if (!idx) return;
        
        const mc = window.minionCharts[idx];
        if (mc) {
            if (candle && mc.series) {
                mc.series.update(candle);
            }
            if (macd && mc.macdHist && mc.macdLine && mc.macdSignal) {
                const time = candle ? candle.time : Math.floor(Date.now() / 1000);
                mc.macdHist.update({ time: time, value: macd.histogram, color: macd.histogram > 0 ? '#10B981' : '#EF4444' });
                mc.macdLine.update({ time: time, value: macd.MACD });
                mc.macdSignal.update({ time: time, value: macd.signal });
            }
        }
    }

    `;
    code = code.substring(0, startIdx) + newCode + code.substring(endIdx);
    fs.writeFileSync('bot_extracted.js', code);
    console.log("Successfully replaced updateMultiChart functions.");
} else {
    console.log("Could not find updateMultiChart functions to replace.");
}
