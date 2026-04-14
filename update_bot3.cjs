const fs = require('fs');
let botCode = fs.readFileSync('bot_extracted.js', 'utf8');

// 1. Fix historical data processing to merge correctly and not clear candles
const processHistoricalCandleOld = `    function processHistoricalCandle(candleData) {
        const cVal = parseFloat(candleData.close || candleData.c);
        if (isNaN(cVal)) return;

        const oVal = parseFloat(candleData.open || candleData.o || cVal);
        const hVal = parseFloat(candleData.high || candleData.h || cVal);
        const lVal = parseFloat(candleData.low || candleData.l || cVal);
        
        let tVal = candleData.time || candleData.t;
        if (tVal > 10000000000) tVal = Math.floor(tVal / 1000); 
        if (!tVal) tVal = Math.floor(Date.now()/1000) - (state.candles.length * 60);

        const currentMinute = Math.floor(tVal / 60) * 60;
        
        if (state.candles.length > 0) {
            const lastCandle = state.candles[state.candles.length - 1];
            if (lastCandle.time === currentMinute) {
                lastCandle.close = cVal;
                lastCandle.high = Math.max(lastCandle.high, hVal);
                lastCandle.low = Math.min(lastCandle.low, lVal);
                if (tvSeries) { try { tvSeries.update(lastCandle); } catch(e){} }
                updateIndicators();
                if (isIframe) { window.parent.postMessage({ type: 'KAREN_HISTORICAL', asset: state.activeAsset, candle: lastCandle }, '*'); }
                return;
            } else if (currentMinute < lastCandle.time) {
                return; 
            }
        }

        const c = { time: currentMinute, open: oVal, high: hVal, low: lVal, close: cVal };
        state.candles.push(c);
        if (state.candles.length > 150) state.candles.shift();
        
        if (tvSeries) { try { tvSeries.update(c); } catch(e){} }
        updateIndicators();
        if (isIframe) { window.parent.postMessage({ type: 'KAREN_HISTORICAL', asset: state.activeAsset, candle: c }, '*'); }
    }`;

const processHistoricalCandleNew = `    function processHistoricalCandle(candleData, isBatch) {
        const cVal = parseFloat(candleData.close || candleData.c);
        if (isNaN(cVal)) return;

        const oVal = parseFloat(candleData.open || candleData.o || cVal);
        const hVal = parseFloat(candleData.high || candleData.h || cVal);
        const lVal = parseFloat(candleData.low || candleData.l || cVal);
        
        let tVal = candleData.time || candleData.t;
        if (tVal > 10000000000) tVal = Math.floor(tVal / 1000); 
        if (!tVal) tVal = Math.floor(Date.now()/1000) - (state.candles.length * 60);

        const currentMinute = Math.floor(tVal / 60) * 60;
        
        const existingIdx = state.candles.findIndex(x => x.time === currentMinute);
        if (existingIdx !== -1) {
            state.candles[existingIdx].close = cVal;
            state.candles[existingIdx].high = Math.max(state.candles[existingIdx].high, hVal);
            state.candles[existingIdx].low = Math.min(state.candles[existingIdx].low, lVal);
            if (!isBatch && tvSeries) { try { tvSeries.update(state.candles[existingIdx]); } catch(e){} }
        } else {
            const c = { time: currentMinute, open: oVal, high: hVal, low: lVal, close: cVal };
            state.candles.push(c);
            if (!isBatch) {
                state.candles.sort((a, b) => a.time - b.time);
                if (state.candles.length > 150) state.candles = state.candles.slice(-150);
                if (tvSeries) { try { tvSeries.setData(state.candles); } catch(e){} }
            }
        }
        
        if (!isBatch) {
            updateIndicators();
            if (isIframe) { window.parent.postMessage({ type: 'KAREN_HISTORICAL', asset: state.activeAsset, candle: state.candles[state.candles.length-1] }, '*'); }
        }
    }`;

botCode = botCode.replace(processHistoricalCandleOld, processHistoricalCandleNew);

// 2. Fix WebSocket message processing to pass isBatch and not clear candles
const wsProcessOld = `                            messages.forEach(msg => {
                                if (msg.d && Array.isArray(msg.d)) {
                                    if (msg.d.length > 10 && state.activeAsset) {
                                        state.candles = [];
                                        state.fullRecalc = true;
                                        if (tvSeries) tvSeries.setData([]);
                                    }
                                    msg.d.forEach(item => {
                                        if (item.p) {
                                            // Check if the tick is for our selected asset
                                            if (item.p !== state.selectedAsset) {
                                                if (!state.ignoredAssets) state.ignoredAssets = new Set();
                                                if (!state.ignoredAssets.has(item.p)) {
                                                    state.ignoredAssets.add(item.p);
                                                    addLog(\`Ignored asset: \${item.p}\`, 'info');
                                                    
                                                    // If the user switches to the other supported asset on the website, but not in the app
                                                    const otherSupported = state.selectedAsset === 'BTCUSD_OTC' ? 'DOGUSD_OTC' : 'BTCUSD_OTC';
                                                    if (item.p === otherSupported && state.isRunning) {
                                                        state.isRunning = false;
                                                        setSignal('PAUSED');
                                                        addLog(\`Website asset changed to \${item.p}! Bot PAUSED. Please switch asset in the app!\`, 'error');
                                                        const btn = el('btn-toggle');
                                                        if (btn) {
                                                            btn.innerText = '▶ START ALARM';
                                                            btn.style.background = '#111827';
                                                        }
                                                    }
                                                }
                                                return;
                                            }
                                            
                                            if (state.activeAsset !== item.p) {
                                                state.activeAsset = item.p;
                                                state.candles = []; 
                                                state.fullRecalc = true;
                                                if(tvSeries) {
                                                    tvSeries.setData([]);
                                                    tvSeries.applyOptions({
                                                        priceFormat: {
                                                            type: 'price',
                                                            precision: state.activeAsset === 'DOGUSD_OTC' ? 4 : 2,
                                                            minMove: state.activeAsset === 'DOGUSD_OTC' ? 0.0001 : 0.01,
                                                        }
                                                    });
                                                }
                                            }
                                        } else {
                                            // If there's no item.p, and we don't have an active asset, ignore it
                                            if (!state.activeAsset) return;
                                        }

                                        if (item.q !== undefined) {
                                            processTick(item.q);
                                        }
                                        else if (item.c !== undefined || item.close !== undefined) {
                                            processHistoricalCandle(item);
                                        }
                                    });
                                }
                            });`;

const wsProcessNew = `                            messages.forEach(msg => {
                                if (msg.d && Array.isArray(msg.d)) {
                                    let isBatch = msg.d.length > 10;
                                    let hasOurAsset = msg.d.some(item => item.p === state.selectedAsset || !item.p);
                                    
                                    if (isBatch && state.activeAsset && hasOurAsset) {
                                        state.fullRecalc = true;
                                    }
                                    
                                    msg.d.forEach(item => {
                                        if (item.p) {
                                            // Check if the tick is for our selected asset
                                            if (item.p !== state.selectedAsset) {
                                                if (!state.ignoredAssets) state.ignoredAssets = new Set();
                                                if (!state.ignoredAssets.has(item.p)) {
                                                    state.ignoredAssets.add(item.p);
                                                    addLog(\`Ignored asset: \${item.p}\`, 'info');
                                                    
                                                    // If the user switches to the other supported asset on the website, but not in the app
                                                    const otherSupported = state.selectedAsset === 'BTCUSD_OTC' ? 'DOGUSD_OTC' : 'BTCUSD_OTC';
                                                    if (item.p === otherSupported && state.isRunning) {
                                                        state.isRunning = false;
                                                        setSignal('PAUSED');
                                                        addLog(\`Website asset changed to \${item.p}! Bot PAUSED. Please switch asset in the app!\`, 'error');
                                                        const btn = el('btn-toggle');
                                                        if (btn) {
                                                            btn.innerText = '▶ START ALARM';
                                                            btn.style.background = '#111827';
                                                        }
                                                    }
                                                }
                                                return;
                                            }
                                            
                                            if (state.activeAsset !== item.p) {
                                                state.activeAsset = item.p;
                                                state.candles = []; 
                                                state.fullRecalc = true;
                                                if(tvSeries) {
                                                    tvSeries.setData([]);
                                                    tvSeries.applyOptions({
                                                        priceFormat: {
                                                            type: 'price',
                                                            precision: state.activeAsset === 'DOGUSD_OTC' ? 4 : 2,
                                                            minMove: state.activeAsset === 'DOGUSD_OTC' ? 0.0001 : 0.01,
                                                        }
                                                    });
                                                }
                                            }
                                        } else {
                                            // If there's no item.p, and we don't have an active asset, ignore it
                                            if (!state.activeAsset) return;
                                        }

                                        if (item.q !== undefined) {
                                            processTick(item.q);
                                        }
                                        else if (item.c !== undefined || item.close !== undefined) {
                                            processHistoricalCandle(item, isBatch);
                                        }
                                    });
                                    
                                    if (isBatch && state.activeAsset && hasOurAsset) {
                                        state.candles.sort((a, b) => a.time - b.time);
                                        state.candles = state.candles.filter((c, i, arr) => i === 0 || c.time > arr[i - 1].time);
                                        if (state.candles.length > 150) state.candles = state.candles.slice(-150);
                                        
                                        if (tvSeries) {
                                            try { tvSeries.setData(state.candles); } catch(e) {}
                                        }
                                        updateIndicators();
                                    }
                                }
                            });`;

botCode = botCode.replace(wsProcessOld, wsProcessNew);

// 3. Fix colors (No blue/red, only black, white, pale pink, pale blue)
const testBtnOld = `background: #3B82F6; border-color: #3B82F6;`;
const testBtnNew = `background: #DBEAFE; border-color: #DBEAFE; color: #000;`;
botCode = botCode.replace(testBtnOld, testBtnNew);

const resetBtnOld = `background: #EF4444; border-color: #EF4444;`;
const resetBtnNew = `background: #FCE7F3; border-color: #FCE7F3; color: #000;`;
botCode = botCode.replace(resetBtnOld, resetBtnNew);

// 4. Fix scrolling on mobile
const cssOld = `.content { padding: 12px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; }`;
const cssNew = `.content { padding: 12px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; overscroll-behavior: contain; -webkit-overflow-scrolling: touch; }`;
botCode = botCode.replace(cssOld, cssNew);

const maxOld = `#maximized { display: flex; width: 360px; max-height: 90vh; background: #FAFAFA; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.15); border: 1px solid #E5E7EB; flex-direction: column; overflow: hidden; }`;
const maxNew = `#maximized { display: flex; width: 100%; max-width: 360px; max-height: 90vh; background: #FFFFFF; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.15); border: 1px solid #E5E7EB; flex-direction: column; overflow: hidden; }`;
botCode = botCode.replace(maxOld, maxNew);

// 5. Fix Telegram message format
const tgMsgOld = `text: "🚨 " + (msg || "ALARM TRIGGERED!")`;
const tgMsgNew = `text: "🚨 [" + state.selectedAsset + "] " + (msg || "ALARM TRIGGERED!")`;
botCode = botCode.replace(tgMsgOld, tgMsgNew);

// 6. Fix Karen Script to match user request exactly
const karenScriptOld = `// KAREN's Alarm Strategy (MACD Only)
if (!ctx.candles || ctx.candles.length < 60) {
    ctx.signal("WAITING FOR DATA (" + (ctx.candles ? ctx.candles.length : 0) + "/60)");
    return;
}

window.karenState = window.karenState || { lastCross: null, lastHist: null };

// 1. MACD went down/high (Histogram crosses 0)
if (ctx.macd.hist > 0 && window.karenState.lastHist !== 'HIGH') {
    ctx.ring("MACD went high !!");
    window.karenState.lastHist = 'HIGH';
} else if (ctx.macd.hist < 0 && window.karenState.lastHist !== 'DOWN') {
    ctx.ring("MACD went down !!");
    window.karenState.lastHist = 'DOWN';
}

// 2. MACD crosses upward/downward (Line crosses Signal)
if (ctx.macd.line > ctx.macd.signal && window.karenState.lastCross !== 'UP') {
    ctx.signal("UP");
    if (window.karenState.lastHist === 'HIGH') {
        ctx.ring("MACD crosses upward !!");
    }
    window.karenState.lastCross = 'UP';
} else if (ctx.macd.line < ctx.macd.signal && window.karenState.lastCross !== 'DOWN') {
    ctx.signal("DOWN");
    if (window.karenState.lastHist === 'DOWN') {
        ctx.ring("MACD crosses downward !!");
    }
    window.karenState.lastCross = 'DOWN';
} else {
    ctx.signal(window.karenState.lastCross === 'UP' ? 'UP' : (window.karenState.lastCross === 'DOWN' ? 'DOWN' : 'WAITING'));
}`;

const karenScriptNew = `// KAREN's Alarm Strategy (MACD Only)
if (!ctx.candles || ctx.candles.length < 60) {
    ctx.signal("WAITING FOR DATA (" + (ctx.candles ? ctx.candles.length : 0) + "/60)");
    return;
}

window.karenState = window.karenState || { lastCross: null, lastHist: null };

// 1. MACD went down/high (Histogram crosses 0)
if (ctx.macd.hist > 0 && window.karenState.lastHist !== 'HIGH') {
    ctx.ring("MACD went high !!");
    window.karenState.lastHist = 'HIGH';
} else if (ctx.macd.hist < 0 && window.karenState.lastHist !== 'DOWN') {
    ctx.ring("MACD went down !!");
    window.karenState.lastHist = 'DOWN';
}

// 2. MACD crosses upward/downward (Line crosses Signal)
if (ctx.macd.line > ctx.macd.signal && window.karenState.lastCross !== 'UP') {
    ctx.signal("UP");
    if (window.karenState.lastHist === 'HIGH') {
        ctx.ring("MACD crosses upward !!");
    }
    window.karenState.lastCross = 'UP';
} else if (ctx.macd.line < ctx.macd.signal && window.karenState.lastCross !== 'DOWN') {
    ctx.signal("DOWN");
    if (window.karenState.lastHist === 'DOWN') {
        ctx.ring("MACD crosses downward !!");
    }
    window.karenState.lastCross = 'DOWN';
} else {
    ctx.signal(window.karenState.lastCross === 'UP' ? 'UP' : (window.karenState.lastCross === 'DOWN' ? 'DOWN' : 'WAITING'));
}`;
botCode = botCode.replace(karenScriptOld, karenScriptNew);

fs.writeFileSync('bot_extracted.js', botCode);
console.log("Updated bot_extracted.js");
