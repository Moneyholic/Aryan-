const fs = require('fs');
let code = fs.readFileSync('bot_extracted.js', 'utf8');

const newUpdateMultiChartStatus = `
    function updateMultiChartHistorical(asset, candle) {
        updateMultiChartStatus(asset, 'WAIT', candle.close, null, candle);
    }

    function updateMultiChartStatus(asset, signal, price, macd, candle) {
        if (!asset) return;
        const container = el('ui-multi-status');
        if (!container) return;
        
        window.multiCharts = window.multiCharts || {};
        
        let row = el('multi-status-' + asset);
        if (!row) {
            row = document.createElement('div');
            row.id = 'multi-status-' + asset;
            row.style.cssText = 'display: flex; flex-direction: column; padding: 12px; background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 8px; margin-bottom: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);';
            
            const header = document.createElement('div');
            header.id = 'multi-header-' + asset;
            header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 14px;';
            row.appendChild(header);

            const chartContainer = document.createElement('div');
            chartContainer.style.cssText = 'width: 100%; height: 180px; border-radius: 4px; overflow: hidden; background: #FFFFFF; border: 1px solid #E5E7EB;';
            row.appendChild(chartContainer);

            container.appendChild(row);
        }
        
        if (!window.multiCharts[asset] && window.LightweightCharts) {
            const chartContainer = row.querySelector('div:last-child');
            if (chartContainer) {
                const chart = window.LightweightCharts.createChart(chartContainer, {
                    width: chartContainer.clientWidth || container.clientWidth - 24,
                    height: 180,
                    layout: { background: { type: 'solid', color: '#FFFFFF' }, textColor: '#374151' },
                    grid: { vertLines: { color: '#F3F4F6' }, horzLines: { color: '#F3F4F6' } },
                    crosshair: { mode: window.LightweightCharts.CrosshairMode.Normal },
                    rightPriceScale: { borderColor: '#E5E7EB' },
                    localization: {
                        timeFormatter: (timestamp) => new Date(timestamp * 1000).toLocaleString()
                    },
                    timeScale: { 
                        borderColor: '#E5E7EB', 
                        timeVisible: true, 
                        secondsVisible: false,
                        tickMarkFormatter: (time) => new Date(time * 1000).toLocaleTimeString()
                    },
                });
                const series = chart.addCandlestickSeries({
                    upColor: '#111827', downColor: '#9CA3AF', borderDownColor: '#9CA3AF', borderUpColor: '#111827', wickDownColor: '#9CA3AF', wickUpColor: '#111827',
                });
                window.multiCharts[asset] = { chart, series, lastTime: 0 };
            }
        }
        
        let signalColor = '#6B7280';
        if (signal === 'UP' || signal === 'BUY ALARM') signalColor = '#10B981';
        if (signal === 'DOWN' || signal === 'SELL ALARM') signalColor = '#EF4444';
        if (signal === 'SIDEWAYS - WAITING') signalColor = '#F59E0B';
        
        const header = el('multi-header-' + asset);
        if (header) {
            header.innerHTML = '<div style="font-weight: 700; color: #111827; width: 30%;">' + asset + '</div>' +
                '<div style="color: ' + signalColor + '; font-weight: 700; width: 40%; text-align: center;">' + signal + '</div>' +
                '<div style="color: #6B7280; width: 30%; text-align: right; font-weight: 600;">$' + (price ? price.toFixed(2) : '--') + '</div>';
        }

        if (candle && window.multiCharts[asset] && window.multiCharts[asset].series) {
            try {
                window.multiCharts[asset].series.update(candle);
            } catch (e) {
                console.error("Chart update error:", e);
                addLog("Chart error: " + e.message, "error");
            }
        }
    }
`;

const startIndex = code.indexOf('function updateMultiChartHistorical(');
if (startIndex !== -1) {
    const before = code.substring(0, startIndex);
    const afterInit = `
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initUI);
    } else {
        initUI();
    }
}
})();`;
    code = before + newUpdateMultiChartStatus + afterInit;
}

fs.writeFileSync('bot_extracted.js', code);
