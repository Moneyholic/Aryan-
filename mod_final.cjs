const fs = require('fs');
let code = fs.readFileSync('bot_evaluated.js', 'utf8');

// 1. Modify addLog
code = code.replace(
    /function addLog\(msg, type = 'info'\) \{[\s\S]*?renderLogs\(\);\n    \}/,
    `function addLog(msg, type = 'info') {
        const time = new Date().toLocaleTimeString();
        state.logs.unshift({ time, msg, type });
        if (state.logs.length > 50) state.logs.pop();
        renderLogs();
        if (isIframe) {
            window.parent.postMessage({ type: 'KAREN_LOG', asset: state.activeAsset, msg: msg, logType: type }, '*');
        }
    }`
);

// 2. Modify setSignal
code = code.replace(
    /if \(spinnerEl\) \{[\s\S]*?spinnerEl\.className = 'signal-circle-spinner spinning';\n            \}\n        \}/,
    `if (spinnerEl) {
            if (sig === 'WAIT' || sig === 'PAUSED' || sig === 'ERROR') {
                spinnerEl.className = 'signal-circle-spinner paused';
            } else {
                spinnerEl.className = 'signal-circle-spinner spinning';
            }
        }
        if (isIframe) {
            window.parent.postMessage({
                type: 'KAREN_STATUS',
                asset: state.activeAsset,
                signal: sig,
                price: state.livePrice,
                macd: state.macdParams
            }, '*');
        }`
);

// 3. Modify processTick
code = code.replace(
    /updateConnectionDot\(true\);/,
    `updateConnectionDot(true);
        if (isIframe) {
            window.parent.postMessage({
                type: 'KAREN_STATUS',
                asset: state.activeAsset,
                signal: state.currentSignal,
                price: state.livePrice,
                macd: state.macdParams
            }, '*');
        }`
);

// 4. Modify window.ring and window.vibrate
code = code.replace(
    /window\.ring = function\(msg\) \{[\s\S]*?showAlarmOverlay\(msg \|\| "ALARM TRIGGERED!"\);\n    \};/,
    `window.ring = function(msg) {
        if (isIframe) {
            window.parent.postMessage({ type: 'KAREN_ALARM', asset: state.activeAsset, msg: msg }, '*');
            return;
        }
        console.log('KAREN: Ringing...');
        const audio = new Audio('https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg');
        audio.play().catch(e => console.log('Audio play blocked', e));
        showAlarmOverlay(msg || "ALARM TRIGGERED!");
    };`
);

code = code.replace(
    /window\.vibrate = function\(msg\) \{[\s\S]*?showAlarmOverlay\(msg \|\| "VIBRATION TRIGGERED!"\);\n    \};/,
    `window.vibrate = function(msg) {
        if (isIframe) {
            window.parent.postMessage({ type: 'KAREN_ALARM', asset: state.activeAsset, msg: msg }, '*');
            return;
        }
        console.log('KAREN: Vibrating...');
        if (navigator.vibrate) {
            navigator.vibrate([1000, 500, 1000, 500, 1000, 500, 1000]);
        }
        showAlarmOverlay(msg || "VIBRATION TRIGGERED!");
    };`
);

// 5. Modify updateMultiChartStatus
code = code.replace(
    /function updateMultiChartStatus\(asset, signal, price, macd\) \{[\s\S]*?row\.innerHTML = '<div style="font-weight: 600; color: #111827; width: 30%;">'.*?;\n    \}/s,
    `function updateMultiChartStatus(asset, signal, price, macd) {
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
            chartContainer.style.cssText = 'width: 100%; height: 100px; border-radius: 4px; overflow: hidden; background: #FFFFFF; border: 1px solid #E5E7EB;';
            row.appendChild(chartContainer);

            container.appendChild(row);

            if (window.LightweightCharts) {
                const chart = window.LightweightCharts.createChart(chartContainer, {
                    width: chartContainer.clientWidth,
                    height: 100,
                    layout: { background: { type: 'solid', color: isDarkMode ? '#111827' : '#FFFFFF' }, textColor: isDarkMode ? '#D1D5DB' : '#374151' },
                    grid: { vertLines: { visible: false }, horzLines: { visible: false } },
                    timeScale: { visible: false },
                    rightPriceScale: { visible: true, borderColor: isDarkMode ? '#374151' : '#E5E7EB' }
                });
                const series = chart.addLineSeries({ color: '#3B82F6', lineWidth: 2 });
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
                '<div style="color: #6B7280; width: 30%; text-align: right;">$$' + (price ? price.toFixed(2) : '--') + '</div>';
        }

        if (price && window.multiCharts[asset]) {
            const time = Math.floor(Date.now() / 1000);
            const series = window.multiCharts[asset].series;
            const lastTime = window.multiCharts[asset].lastTime;
            try {
                if (time > lastTime) {
                    series.update({ time, value: price });
                    window.multiCharts[asset].lastTime = time;
                } else if (time === lastTime) {
                    series.update({ time: lastTime, value: price });
                }
            } catch (e) {
                console.error("Chart update error:", e);
            }
        }
    }`
);

// 6. Modify btn-theme
code = code.replace(
    /el\('btn-theme'\)\.addEventListener\('click', \(\) => \{[\s\S]*?if \(tvMacdChart\) tvMacdChart\.applyOptions\(\{ layout: \{ background: \{ type: 'solid', color: '#FFFFFF' \}, textColor: '#374151' \} \}\);\n            \}\n        \}\);/,
    `el('btn-theme').addEventListener('click', () => {
            isDarkMode = !isDarkMode;
            if (isDarkMode) {
                shadow.host.classList.add('dark');
                if (tvChart) tvChart.applyOptions({ layout: { background: { type: 'solid', color: '#111827' }, textColor: '#D1D5DB' } });
                if (tvMacdChart) tvMacdChart.applyOptions({ layout: { background: { type: 'solid', color: '#111827' }, textColor: '#D1D5DB' } });
                if (window.multiCharts) {
                    Object.values(window.multiCharts).forEach(mc => {
                        mc.chart.applyOptions({ layout: { background: { type: 'solid', color: '#111827' }, textColor: '#D1D5DB' }, rightPriceScale: { borderColor: '#374151' } });
                    });
                }
            } else {
                shadow.host.classList.remove('dark');
                if (tvChart) tvChart.applyOptions({ layout: { background: { type: 'solid', color: '#FFFFFF' }, textColor: '#374151' } });
                if (tvMacdChart) tvMacdChart.applyOptions({ layout: { background: { type: 'solid', color: '#FFFFFF' }, textColor: '#374151' } });
                if (window.multiCharts) {
                    Object.values(window.multiCharts).forEach(mc => {
                        mc.chart.applyOptions({ layout: { background: { type: 'solid', color: '#FFFFFF' }, textColor: '#374151' }, rightPriceScale: { borderColor: '#E5E7EB' } });
                    });
                }
            }
        });`
);

// 7. Read asset from URL parameter
code = code.replace(
    /selectedAsset: 'BTCUSD_OTC',/,
    `selectedAsset: new URLSearchParams(window.location.search).get('asset') || 'BTCUSD_OTC',`
);

// 8. Make iframe start automatically
code = code.replace(
    /if \(!isIframe\) \{/,
    `if (isIframe) {
        state.isRunning = true;
        setSignal('WAIT');
    }
    
    if (!isIframe) {`
);

fs.writeFileSync('bot_evaluated_mod4.js', code);
console.log('Modifications applied.');
