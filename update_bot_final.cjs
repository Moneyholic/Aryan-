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
            row.style.cssText = 'display: flex; flex-direction: column; padding: 6px; background: #F3F4F6; border-radius: 4px; font-size: 11px; margin-bottom: 8px;';
            
            const header = document.createElement('div');
            header.id = 'multi-header-' + asset;
            header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;';
            row.appendChild(header);

            const chartContainer = document.createElement('div');
            chartContainer.style.cssText = 'width: 100%; height: 120px; border-radius: 4px; overflow: hidden; background: #FFFFFF; border: 1px solid #E5E7EB;';
            row.appendChild(chartContainer);

            container.appendChild(row);
        }
        
        if (!window.multiCharts[asset] && window.LightweightCharts) {
            const chartContainer = row.querySelector('div:last-child');
            if (chartContainer) {
                const chart = window.LightweightCharts.createChart(chartContainer, {
                    width: chartContainer.clientWidth || container.clientWidth - 12,
                    height: 120,
                    layout: { background: { type: 'solid', color: isDarkMode ? '#111827' : '#FFFFFF' }, textColor: isDarkMode ? '#D1D5DB' : '#374151' },
                    grid: { vertLines: { visible: false }, horzLines: { visible: false } },
                    timeScale: { visible: false },
                    rightPriceScale: { visible: true, borderColor: isDarkMode ? '#374151' : '#E5E7EB' }
                });
                const series = chart.addCandlestickSeries({
                    upColor: '#10B981', downColor: '#EF4444', borderDownColor: '#EF4444', borderUpColor: '#10B981', wickDownColor: '#EF4444', wickUpColor: '#10B981'
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
            header.innerHTML = '<div style="font-weight: 600; color: ' + (isDarkMode ? '#F9FAFB' : '#111827') + '; width: 30%;">' + asset + '</div>' +
                '<div style="color: ' + signalColor + '; font-weight: 600; width: 40%; text-align: center;">' + signal + '</div>' +
                '<div style="color: #6B7280; width: 30%; text-align: right;">$' + (price ? price.toFixed(2) : '--') + '</div>';
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
