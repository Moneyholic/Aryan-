const fs = require('fs');
let code = fs.readFileSync('bot_extracted.js', 'utf8');

// 1. Rewrite initTradingView to initialize all 4 charts and support dark mode
const oldInitTV = `        function initTradingView() {
            if (!window.LightweightCharts) {
                setTimeout(initTradingView, 500);
                return;
            }
            
            try {
                // LIGHT THEME CONFIG
                const chartContainer = el('tv-chart');
                tvChart = window.LightweightCharts.createChart(chartContainer, {
                    width: chartContainer.clientWidth,
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
                tvSeries = tvChart.addCandlestickSeries({
                    upColor: '#111827', downColor: '#9CA3AF', borderDownColor: '#9CA3AF', borderUpColor: '#111827', wickDownColor: '#9CA3AF', wickUpColor: '#111827',
                });

                const macdContainer = el('tv-macd');
                tvMacdChart = window.LightweightCharts.createChart(macdContainer, {
                    width: macdContainer.clientWidth,
                    height: 80,
                    layout: { background: { type: 'solid', color: '#FFFFFF' }, textColor: '#374151' },
                    grid: { vertLines: { color: '#F3F4F6' }, horzLines: { color: '#F3F4F6' } },
                    rightPriceScale: { borderColor: '#E5E7EB' },
                    localization: {
                        timeFormatter: (timestamp) => new Date(timestamp * 1000).toLocaleString()
                    },
                    timeScale: { visible: false },
                });
                tvMacdHist = tvMacdChart.addHistogramSeries({ color: '#111827' });
                tvMacdLine = tvMacdChart.addLineSeries({ color: '#111827', lineWidth: 2 });
                tvMacdSignal = tvMacdChart.addLineSeries({ color: '#9CA3AF', lineWidth: 2 });

                tvChart.timeScale().subscribeVisibleLogicalRangeChange(logicalRange => {
                    if (logicalRange) {
                        tvMacdChart.timeScale().setVisibleLogicalRange(logicalRange);
                    }
                });
            } catch (e) {
                console.log("TV Init Error:", e);
            }
        }`;

const newInitTV = `        function createTVChart(chartId, macdId) {
            const chartContainer = el(chartId);
            const macdContainer = el(macdId);
            if (!chartContainer || !macdContainer) return null;

            const isDark = document.getElementById('karen-host').classList.contains('dark');
            const bgColor = isDark ? '#111827' : '#FFFFFF';
            const textColor = isDark ? '#D1D5DB' : '#374151';
            const gridColor = isDark ? '#374151' : '#F3F4F6';
            const upColor = isDark ? '#10B981' : '#111827';
            const downColor = isDark ? '#EF4444' : '#9CA3AF';

            const chart = window.LightweightCharts.createChart(chartContainer, {
                width: chartContainer.clientWidth,
                height: chartContainer.clientHeight || 180,
                layout: { background: { type: 'solid', color: bgColor }, textColor: textColor },
                grid: { vertLines: { color: gridColor }, horzLines: { color: gridColor } },
                crosshair: { mode: window.LightweightCharts.CrosshairMode.Normal },
                rightPriceScale: { borderColor: gridColor },
                localization: {
                    timeFormatter: (timestamp) => new Date(timestamp * 1000).toLocaleString()
                },
                timeScale: { 
                    borderColor: gridColor, 
                    timeVisible: true, 
                    secondsVisible: false,
                    tickMarkFormatter: (time) => new Date(time * 1000).toLocaleTimeString()
                },
            });
            const series = chart.addCandlestickSeries({
                upColor: upColor, downColor: downColor, borderDownColor: downColor, borderUpColor: upColor, wickDownColor: downColor, wickUpColor: upColor,
            });

            const macdChart = window.LightweightCharts.createChart(macdContainer, {
                width: macdContainer.clientWidth,
                height: macdContainer.clientHeight || 80,
                layout: { background: { type: 'solid', color: bgColor }, textColor: textColor },
                grid: { vertLines: { color: gridColor }, horzLines: { color: gridColor } },
                crosshair: { mode: window.LightweightCharts.CrosshairMode.Normal },
                rightPriceScale: { borderColor: gridColor },
                timeScale: { borderColor: gridColor, timeVisible: true, secondsVisible: false },
            });
            const macdHist = macdChart.addHistogramSeries({ color: upColor });
            const macdLine = macdChart.addLineSeries({ color: textColor, lineWidth: 2 });
            const macdSignal = macdChart.addLineSeries({ color: downColor, lineWidth: 2 });

            chart.timeScale().subscribeVisibleLogicalRangeChange(logicalRange => {
                if (logicalRange) {
                    macdChart.timeScale().setVisibleLogicalRange(logicalRange);
                }
            });
            
            return { chart, series, macdChart, macdHist, macdLine, macdSignal };
        }

        function initTradingView() {
            if (!window.LightweightCharts) {
                setTimeout(initTradingView, 500);
                return;
            }
            
            try {
                const main = createTVChart('tv-chart', 'tv-macd');
                if (main) {
                    tvChart = main.chart;
                    tvSeries = main.series;
                    tvMacdChart = main.macdChart;
                    tvMacdHist = main.macdHist;
                    tvMacdLine = main.macdLine;
                    tvMacdSignal = main.macdSignal;
                }
                
                window.minionCharts = {};
                for(let i=1; i<=3; i++) {
                    const minion = createTVChart('tv-chart-'+i, 'tv-macd-'+i);
                    if (minion) {
                        window.minionCharts[i] = minion;
                        window.minionCharts[i].asset = null; // Will be assigned when setup
                    }
                }
            } catch (e) {
                console.log("TV Init Error:", e);
            }
        }`;

code = code.replace(oldInitTV, newInitTV);

// 2. Rewrite updateMultiChartStatus and updateMultiChartHistorical
const oldMultiStatus = `    function updateMultiChartHistorical(asset, candle) {
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

        const mc = window.multiCharts[asset];
        if (mc && candle) {
            if (candle.time > mc.lastTime) {
                mc.series.update(candle);
                mc.lastTime = candle.time;
            }
        }
        
        const header = el('multi-header-' + asset);
        if (header) {
            header.innerHTML = \`
                <span style="font-weight: bold; color: #111827;">\${asset}</span>
                <span style="color: \${signal === 'CALL' ? '#10B981' : signal === 'PUT' ? '#EF4444' : '#6B7280'}; font-weight: bold;">\${signal}</span>
                <span style="color: #6B7280;">\$\${price}</span>
            \`;
        }
    }`;

const newMultiStatus = `    function getMinionIndexForAsset(asset) {
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
    }`;

code = code.replace(oldMultiStatus, newMultiStatus);

fs.writeFileSync('bot_extracted.js', code);
console.log("Updated bot_extracted.js for v14.0");
