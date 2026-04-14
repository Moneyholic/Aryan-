const fs = require('fs');
let code = fs.readFileSync('bot_extracted.js', 'utf8');

// 1. Add Fullscreen button to header
const oldHeader = `<button class="collapse-btn" id="btn-collapse">−</button>`;
const newHeader = `<button class="collapse-btn" id="btn-fullscreen" style="margin-right: 4px;">⛶</button>
              <button class="collapse-btn" id="btn-collapse">−</button>`;
code = code.replace(oldHeader, newHeader);

// 2. Add Fullscreen styles
const oldStyles = `          :host(.dark) .log-entry { border-color: #1F2937; }`;
const newStyles = `          :host(.dark) .log-entry { border-color: #1F2937; }
          .charts-grid { display: flex; flex-direction: column; gap: 8px; }
          :host(.fullscreen) #maximized { width: 95vw; height: 95vh; max-height: 95vh; }
          :host(.fullscreen) .charts-grid { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 12px; height: 100%; }
          :host(.fullscreen) .content { max-height: calc(95vh - 50px); }
          :host(.fullscreen) .tv-container { height: calc(100% - 120px); min-height: 200px; }
          :host(.fullscreen) .tv-container-small { height: 80px; }
          .chart-wrapper { display: flex; flex-direction: column; height: 100%; }
          .chart-wrapper.hidden { display: none !important; }
          :host(.fullscreen) .chart-wrapper.hidden { display: flex !important; }`;
code = code.replace(oldStyles, newStyles);

// 3. Update Chart HTML structure
const oldChartHTML = `            <div class="card">
              <div class="card-title">TradingView Engine</div>
              <div id="tv-chart" class="tv-container"></div>
              <div class="card-title" style="margin-top: 8px;">MACD</div>
              <div id="tv-macd" class="tv-container-small"></div>
            </div>`;

const newChartHTML = `            <div class="charts-grid" id="charts-grid">
              <div class="card chart-wrapper" id="chart-wrapper-main">
                <div class="card-title">Main Chart (<span id="ui-asset-name-main">---</span>)</div>
                <div id="tv-chart" class="tv-container"></div>
                <div class="card-title" style="margin-top: 8px;">MACD</div>
                <div id="tv-macd" class="tv-container-small"></div>
              </div>
              <div class="card chart-wrapper hidden" id="chart-wrapper-1">
                <div class="card-title">Chart 2 (<span id="ui-asset-name-1">Setup Required</span>)</div>
                <div id="tv-chart-1" class="tv-container"></div>
                <div class="card-title" style="margin-top: 8px;">MACD</div>
                <div id="tv-macd-1" class="tv-container-small"></div>
              </div>
              <div class="card chart-wrapper hidden" id="chart-wrapper-2">
                <div class="card-title">Chart 3 (<span id="ui-asset-name-2">Setup Required</span>)</div>
                <div id="tv-chart-2" class="tv-container"></div>
                <div class="card-title" style="margin-top: 8px;">MACD</div>
                <div id="tv-macd-2" class="tv-container-small"></div>
              </div>
              <div class="card chart-wrapper hidden" id="chart-wrapper-3">
                <div class="card-title">Chart 4 (<span id="ui-asset-name-3">Setup Required</span>)</div>
                <div id="tv-chart-3" class="tv-container"></div>
                <div class="card-title" style="margin-top: 8px;">MACD</div>
                <div id="tv-macd-3" class="tv-container-small"></div>
              </div>
            </div>`;
code = code.replace(oldChartHTML, newChartHTML);

// 4. Update asset name logic for main chart
code = code.replace(`const assetNameEl = el('ui-asset-name');`, `const assetNameEl = el('ui-asset-name-main');`);

// 5. Add Fullscreen toggle logic
const oldCollapseLogic = `        el('btn-collapse').addEventListener('click', () => {
            el('maximized').style.display = 'none';
            el('minimized').style.display = 'flex';
        });`;

const newCollapseLogic = `        el('btn-collapse').addEventListener('click', () => {
            el('maximized').style.display = 'none';
            el('minimized').style.display = 'flex';
        });
        
        let isFullScreen = false;
        el('btn-fullscreen').addEventListener('click', () => {
            isFullScreen = !isFullScreen;
            const host = document.getElementById('karen-host');
            if (isFullScreen) {
                host.classList.add('fullscreen');
                host.style.top = '2.5vh';
                host.style.left = '2.5vw';
                host.style.right = 'auto';
                host.style.bottom = 'auto';
                el('btn-fullscreen').innerText = '🗗';
                
                // Force show all charts in fullscreen
                el('chart-wrapper-1').classList.remove('hidden');
                el('chart-wrapper-2').classList.remove('hidden');
                el('chart-wrapper-3').classList.remove('hidden');
            } else {
                host.classList.remove('fullscreen');
                host.style.top = '20px';
                host.style.right = '20px';
                host.style.left = 'auto';
                host.style.bottom = 'auto';
                el('btn-fullscreen').innerText = '⛶';
                
                // Hide minion charts in normal mode
                el('chart-wrapper-1').classList.add('hidden');
                el('chart-wrapper-2').classList.add('hidden');
                el('chart-wrapper-3').classList.add('hidden');
            }
            
            // Trigger resize for all charts
            setTimeout(() => {
                if (tvChart) tvChart.resize(el('tv-chart').clientWidth, el('tv-chart').clientHeight);
                if (tvMacdChart) tvMacdChart.resize(el('tv-macd').clientWidth, el('tv-macd').clientHeight);
                for(let i=1; i<=3; i++) {
                    if (window.minionCharts && window.minionCharts[i]) {
                        window.minionCharts[i].chart.resize(el('tv-chart-'+i).clientWidth, el('tv-chart-'+i).clientHeight);
                        window.minionCharts[i].macdChart.resize(el('tv-macd-'+i).clientWidth, el('tv-macd-'+i).clientHeight);
                    }
                }
            }, 50);
        });`;
code = code.replace(oldCollapseLogic, newCollapseLogic);

// 6. Add Chart Initialization Logic for Minions
const oldInitChart = `    function initChart() {
        if (!window.LightweightCharts) return;
        if (tvChart) return;`;

const newInitChart = `    function createTVChart(chartId, macdId) {
        const chartContainer = el(chartId);
        const macdContainer = el(macdId);
        if (!chartContainer || !macdContainer) return null;

        const chart = LightweightCharts.createChart(chartContainer, {
            layout: { background: { type: 'solid', color: 'transparent' }, textColor: '#374151' },
            grid: { vertLines: { color: 'rgba(0,0,0,0.05)' }, horzLines: { color: 'rgba(0,0,0,0.05)' } },
            crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
            rightPriceScale: { borderColor: 'rgba(0,0,0,0.1)' },
            timeScale: { borderColor: 'rgba(0,0,0,0.1)', timeVisible: true, secondsVisible: false }
        });
        const series = chart.addCandlestickSeries({
            upColor: '#10B981', downColor: '#EF4444', borderUpColor: '#10B981', borderDownColor: '#EF4444', wickUpColor: '#10B981', wickDownColor: '#EF4444'
        });

        const macdChart = LightweightCharts.createChart(macdContainer, {
            layout: { background: { type: 'solid', color: 'transparent' }, textColor: '#374151' },
            grid: { vertLines: { color: 'rgba(0,0,0,0.05)' }, horzLines: { color: 'rgba(0,0,0,0.05)' } },
            crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
            rightPriceScale: { borderColor: 'rgba(0,0,0,0.1)' },
            timeScale: { borderColor: 'rgba(0,0,0,0.1)', timeVisible: true, secondsVisible: false }
        });
        const macdHistSeries = macdChart.addHistogramSeries({
            color: '#26a69a', priceFormat: { type: 'volume' }, priceScaleId: ''
        });
        const macdSeriesObj = macdChart.addLineSeries({ color: '#2962FF', lineWidth: 2 });
        const macdSignalSeries = macdChart.addLineSeries({ color: '#FF6D00', lineWidth: 2 });

        return { chart, series, macdChart, macdSeries: macdSeriesObj, macdHistSeries, macdSignalSeries };
    }

    function initChart() {
        if (!window.LightweightCharts) return;
        if (tvChart) return;
        
        // Initialize Minion Charts
        window.minionCharts = {};
        for(let i=1; i<=3; i++) {
            window.minionCharts[i] = createTVChart('tv-chart-'+i, 'tv-macd-'+i);
        }`;
code = code.replace(oldInitChart, newInitChart);

// 7. Update Minion Chart Data on Message
const oldMsgListener = `            } else if (e.data && e.data.type === 'KAREN_HISTORICAL') {
                const asset = e.data.asset;
                if (typeof updateMultiChartStatus === 'function') {
                    updateMultiChartStatus(asset, 'GATHERING DATA...', null, null, null);
                    if (window.multiCharts && window.multiCharts[asset] && window.multiCharts[asset].series) {
                        try {
                            const uniqueCandles = Array.from(new Map(e.data.candles.map(c => [c.time, c])).values());
                            uniqueCandles.sort((a, b) => a.time - b.time);
                            window.multiCharts[asset].series.setData(uniqueCandles);
                            window.multiCharts[asset].seeded = true;
                        } catch (err) { console.error(err); }
                    }
                }
            }`;

const newMsgListener = `            } else if (e.data && e.data.type === 'KAREN_HISTORICAL') {
                const asset = e.data.asset;
                const minionId = e.data.minionId;
                if (typeof updateMultiChartStatus === 'function') {
                    updateMultiChartStatus(asset, 'GATHERING DATA...', null, null, null);
                }
                if (minionId !== undefined && window.minionCharts && window.minionCharts[minionId + 1]) {
                    try {
                        const uniqueCandles = Array.from(new Map(e.data.candles.map(c => [c.time, c])).values());
                        uniqueCandles.sort((a, b) => a.time - b.time);
                        window.minionCharts[minionId + 1].series.setData(uniqueCandles);
                        el('ui-asset-name-' + (minionId + 1)).innerText = asset;
                    } catch (err) { console.error(err); }
                }
            }`;
code = code.replace(oldMsgListener, newMsgListener);

// 8. Update Minion Live Data on Message
const oldStatusListener = `            if (e.data && e.data.type === 'KAREN_STATUS') {
                if (typeof updateMultiChartStatus === 'function') {
                    updateMultiChartStatus(e.data.asset, e.data.signal, e.data.price, e.data.macd, e.data.candle);
                }
            }`;

const newStatusListener = `            if (e.data && e.data.type === 'KAREN_STATUS') {
                if (typeof updateMultiChartStatus === 'function') {
                    updateMultiChartStatus(e.data.asset, e.data.signal, e.data.price, e.data.macd, e.data.candle);
                }
                const minionId = e.data.minionId;
                if (minionId !== undefined && window.minionCharts && window.minionCharts[minionId + 1]) {
                    const mChart = window.minionCharts[minionId + 1];
                    if (e.data.candle) {
                        mChart.series.update(e.data.candle);
                    }
                    if (e.data.macdHistory && e.data.macdHistory.length > 0) {
                        const macdData = [];
                        const signalData = [];
                        const histData = [];
                        
                        // We need to reconstruct the time series for MACD
                        // The minion sends macdHistory which is an array of {line, signal, hist, time}
                        // Wait, the minion doesn't send time with MACD currently. We need to update the minion to send it.
                        // For now, we'll just update the latest value if we can't do full history.
                    }
                }
            }`;
code = code.replace(oldStatusListener, newStatusListener);

// 9. Update Minion to send minionId and MACD history with time
const oldMinionTick = `        if (isIframe) {
            clearTimeout(window.histTimeout);
            window.histTimeout = setTimeout(() => {
                window.parent.postMessage({ 
                    type: 'KAREN_HISTORICAL', 
                    asset: state.activeAsset, 
                    candles: state.candles 
                }, '*');
            }, 500);
        }`;

const newMinionTick = `        if (isIframe) {
            clearTimeout(window.histTimeout);
            window.histTimeout = setTimeout(() => {
                const urlParams = new URLSearchParams(window.location.search);
                const minionId = parseInt(urlParams.get('minion'));
                window.parent.postMessage({ 
                    type: 'KAREN_HISTORICAL', 
                    asset: state.activeAsset, 
                    candles: state.candles,
                    minionId: minionId
                }, '*');
            }, 500);
        }`;
code = code.replace(oldMinionTick, newMinionTick);

const oldMinionStatus = `            if (isIframe) {
                window.parent.postMessage({
                    type: 'KAREN_STATUS',
                    asset: state.activeAsset,
                    signal: state.currentSignal,
                    price: state.livePrice,
                    macd: state.macd,
                    candle: state.currentCandle
                }, '*');
            }`;

const newMinionStatus = `            if (isIframe) {
                const urlParams = new URLSearchParams(window.location.search);
                const minionId = parseInt(urlParams.get('minion'));
                
                // Build MACD arrays for the chart
                const macdLineData = [];
                const macdSignalData = [];
                const macdHistData = [];
                
                if (state.candles.length > state.macdParams.slow) {
                    const closes = state.candles.map(c => c.close);
                    const { lines, signals, hists } = calculateMACDFull(closes, state.macdParams.fast, state.macdParams.slow, state.macdParams.sig);
                    
                    for(let i=0; i<state.candles.length; i++) {
                        const t = state.candles[i].time;
                        if (lines[i] !== undefined) {
                            macdLineData.push({ time: t, value: lines[i] });
                            macdSignalData.push({ time: t, value: signals[i] });
                            macdHistData.push({ time: t, value: hists[i], color: hists[i] >= 0 ? '#26a69a' : '#EF5350' });
                        }
                    }
                }

                window.parent.postMessage({
                    type: 'KAREN_STATUS',
                    asset: state.activeAsset,
                    signal: state.currentSignal,
                    price: state.livePrice,
                    macd: state.macd,
                    candle: state.currentCandle,
                    minionId: minionId,
                    macdLineData: macdLineData,
                    macdSignalData: macdSignalData,
                    macdHistData: macdHistData
                }, '*');
            }`;
code = code.replace(oldMinionStatus, newMinionStatus);

// 10. Update Master to render Minion MACD
const oldMasterStatus = `                    if (e.data.candle) {
                        mChart.series.update(e.data.candle);
                    }
                    if (e.data.macdHistory && e.data.macdHistory.length > 0) {
                        const macdData = [];
                        const signalData = [];
                        const histData = [];
                        
                        // We need to reconstruct the time series for MACD
                        // The minion sends macdHistory which is an array of {line, signal, hist, time}
                        // Wait, the minion doesn't send time with MACD currently. We need to update the minion to send it.
                        // For now, we'll just update the latest value if we can't do full history.
                    }`;

const newMasterStatus = `                    if (e.data.candle) {
                        mChart.series.update(e.data.candle);
                    }
                    if (e.data.macdLineData && e.data.macdLineData.length > 0) {
                        mChart.macdSeries.setData(e.data.macdLineData);
                        mChart.macdSignalSeries.setData(e.data.macdSignalData);
                        mChart.macdHistSeries.setData(e.data.macdHistData);
                    }`;
code = code.replace(oldMasterStatus, newMasterStatus);

fs.writeFileSync('bot_extracted.js', code);
console.log("Updated bot_extracted.js for v10.0");
