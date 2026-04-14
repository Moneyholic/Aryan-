// KAREN & ARYAN Floating App - bot.js
(function() {
if (!window.karenBotInjected) {
    window.karenBotInjected = true;
    console.log("KAREN & ARYAN Alarm Loaded v7.0 (document_start)");
    
        // Support Headless Mode (iframes) safely
    let isIframe = false;
    try {
        isIframe = window.self !== window.top;
    } catch (e) {
        isIframe = true;
    }
    
    if (isIframe && window.karenHeadlessRunning) return;
    if (isIframe) window.karenHeadlessRunning = true;
    if (!isIframe && document.getElementById('karen-host')) return;

    // New functionality: Ring and Vibrate
    window.ring = function(msg) {
        if (isIframe) {
            window.parent.postMessage({ type: 'KAREN_ALARM', asset: state.activeAsset, msg: msg }, '*');
            return;
        }
        console.log('KAREN: Ringing...');
        const audio = new Audio('https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg');
        audio.play().catch(e => console.log('Audio play blocked', e));
        showAlarmOverlay(msg || "ALARM TRIGGERED!");
    };

    window.vibrate = function(msg) {
        if (isIframe) {
            window.parent.postMessage({ type: 'KAREN_ALARM', asset: state.activeAsset, msg: msg }, '*');
            return;
        }
        console.log('KAREN: Vibrating...');
        if (navigator.vibrate) {
            navigator.vibrate([1000, 500, 1000, 500, 1000, 500, 1000]);
        }
        showAlarmOverlay(msg || "VIBRATION TRIGGERED!");
    };

    function showAlarmOverlay(msg) {
        let overlay = document.getElementById('karen-alarm-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'karen-alarm-overlay';
            overlay.style.cssText = 'display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 999999999; justify-content: center; align-items: center; flex-direction: column; color: white; font-family: sans-serif;';
            
            const icon = document.createElement('div');
            icon.innerText = '🚨';
            icon.style.cssText = 'font-size: 100px; animation: pulse-alarm 1s infinite;';
            
            const text = document.createElement('div');
            text.id = 'karen-alarm-text';
            text.style.cssText = 'font-size: 36px; font-weight: 900; margin-top: 20px; text-align: center; letter-spacing: 2px;';
            
            const btn = document.createElement('button');
            btn.innerText = 'DISMISS ALARM';
            btn.style.cssText = 'margin-top: 40px; padding: 15px 40px; font-size: 20px; background: white; color: black; border: none; border-radius: 12px; cursor: pointer; font-weight: 900; letter-spacing: 1px; transition: transform 0.2s;';
            btn.onmouseover = () => btn.style.transform = 'scale(1.05)';
            btn.onmouseout = () => btn.style.transform = 'scale(1)';
            btn.onclick = () => { overlay.style.display = 'none'; };
            
            const style = document.createElement('style');
            style.innerHTML = '@keyframes pulse-alarm { 0% { transform: scale(1); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }';
            
            overlay.appendChild(style);
            overlay.appendChild(icon);
            overlay.appendChild(text);
            overlay.appendChild(btn);
            document.body.appendChild(overlay);
        }
        document.getElementById('karen-alarm-text').innerText = msg;
        overlay.style.display = 'flex';
    }

    // --- 1. Math & Indicators (MACD Only) ---
    function calculateMACDFull(prices, fast = 12, slow = 26, signal = 9) {
        const calcEMA = (data, period) => {
            const k = 2 / (period + 1);
            let ema = data[0];
            const result = [ema];
            for (let i = 1; i < data.length; i++) {
                ema = data[i] * k + ema * (1 - k);
                result.push(ema);
            }
            return result;
        };
        if (prices.length < slow) {
            return { lines: prices.map(()=>0), signals: prices.map(()=>0), hists: prices.map(()=>0) };
        }
        const emaFast = calcEMA(prices, fast);
        const emaSlow = calcEMA(prices, slow);
        const macdLine = emaFast.map((f, i) => f - emaSlow[i]);
        const signalLine = calcEMA(macdLine, signal);
        const hist = macdLine.map((m, i) => m - signalLine[i]);
        return { lines: macdLine, signals: signalLine, hists: hist };
    }

    // --- 2. State ---
    let state = {
        candles: [], 
        currentCandle: null,
        livePrice: 0,
        macd: { line: 0, signal: 0, hist: 0 },
        macdHistory: [],
        macdParams: { fast: 12, slow: 26, sig: 9 },
        lastCalcTime: 0,
        sessionSeconds: 0,
        isRunning: false,
        activeBot: 'KAREN',
        selectedAsset: new URLSearchParams(window.location.search).get('asset') || 'BTCUSD_OTC',
        currentSignal: 'PAUSED',
        lastPriceTime: 0,
        logs: [],
        activeAsset: null,
        assetTicks: {},
        fullRecalc: true
    };

    let tvChart = null, tvSeries = null;
    let tvMacdChart = null, tvMacdLine = null, tvMacdSignal = null, tvMacdHist = null;
    let isDarkMode = false;
    let shadow = null;

    function el(id) {
        return shadow ? shadow.getElementById(id) : null;
    }

    function addLog(msg, type = 'info') {
        const time = new Date().toLocaleTimeString();
        state.logs.unshift({ time, msg, type });
        if (state.logs.length > 50) state.logs.pop();
        renderLogs();
        if (isIframe) {
            window.parent.postMessage({ type: 'KAREN_LOG', asset: state.activeAsset, msg: msg, logType: type }, '*');
        }
    }

    function renderLogs() {
        const container = el('ui-logs');
        if (!container) return;
        container.innerHTML = state.logs.map(l => 
            `<div class="log-entry">
                <span class="log-time">[${l.time}]</span>
                <span class="log-${l.type}">${l.msg}</span>
            </div>`
        ).join('');
    }

    function setSignal(sig) {
        state.currentSignal = sig;
        const textEl = el('ui-signal-text');
        const spinnerEl = el('ui-signal-spinner');
        
        if (textEl) {
            textEl.innerText = sig;
        }
        
        if (spinnerEl) {
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
        }
    }

        function updateConnectionDot(connected) {
        const minDot = el('min-dot');
        const maxDot = el('max-dot');
        if (minDot) minDot.className = 'status-dot ' + (connected ? '' : 'disconnected');
        if (maxDot) maxDot.className = 'status-dot ' + (connected ? '' : 'disconnected');
    }

    // --- 3. Enhanced WebSocket Interceptor (Runs IMMEDIATELY) ---
    try {
        const NativeWebSocket = window.WebSocket;
        Object.defineProperty(window, 'WebSocket', {
            value: function(url, protocols) {
                const wsInstance = new NativeWebSocket(url, protocols);
                wsInstance.addEventListener('message', function(event) {
                    try {
                        let dataStr = event.data;
                        
                        if (typeof dataStr === 'string' && dataStr.startsWith('42')) {
                            dataStr = dataStr.substring(2);
                        }

                        if (typeof dataStr === 'string') {
                            const parsed = JSON.parse(dataStr);
                            
                            let messages = Array.isArray(parsed) ? parsed : [parsed];
                            
                            messages.forEach(msg => {
                                if (msg.d && Array.isArray(msg.d)) {
                                    msg.d.forEach(item => {
                                        if (item.p) {
                                            // Check if the tick is for our selected asset
                                            if (item.p !== state.selectedAsset) {
                                                if (!state.ignoredAssets) state.ignoredAssets = new Set();
                                                if (!state.ignoredAssets.has(item.p)) {
                                                    state.ignoredAssets.add(item.p);
                                                    addLog(`Ignored asset: ${item.p}`, 'info');
                                                    
                                                    // If the user switches to the other supported asset on the website, but not in the app
                                                    const otherSupported = state.selectedAsset === 'BTCUSD_OTC' ? 'DOGUSD_OTC' : 'BTCUSD_OTC';
                                                    if (item.p === otherSupported && state.isRunning) {
                                                        state.isRunning = false;
                                                        setSignal('PAUSED');
                                                        addLog(`Website asset changed to ${item.p}! Bot PAUSED. Please switch asset in the app!`, 'error');
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
                                                const assetNameEl = el('ui-asset-name');
                                                if (assetNameEl) assetNameEl.innerText = state.activeAsset;
                                                addLog(`Asset locked: ${state.activeAsset}`, 'info');
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
                            });
                        }
                    } catch (e) {
                        console.error("KAREN & ARYAN: Error parsing WebSocket message:", e);
                    }
                });
                return wsInstance;
            },
            configurable: true,
            enumerable: true
        });
        console.log("KAREN & ARYAN: WebSocket intercepted successfully.");
    } catch (e) {
        console.error("KAREN & ARYAN: Failed to override WebSocket:", e);
    }

    setInterval(() => {
        if (Date.now() - state.lastPriceTime > 3000) {
            updateConnectionDot(false);
        }
    }, 1000);

    // Session Timer Logic
    setInterval(() => {
        if (state.isRunning) {
            state.sessionSeconds++;
            const sessEl = el('ui-session-time');
            if (sessEl) {
                const m = Math.floor(state.sessionSeconds / 60).toString().padStart(2, '0');
                const s = (state.sessionSeconds % 60).toString().padStart(2, '0');
                sessEl.innerText = `⏱️ ${m}:${s}`;
            }
        }
    }, 1000);

    // --- 4. Core Logic & Custom Code Execution ---
    function processTick(price) {
        state.livePrice = Number(price);
        state.lastPriceTime = Date.now();
        
        const priceEl = el('ui-price');
        if (priceEl) {
            if (state.activeAsset === 'DOGUSD_OTC') {
                priceEl.innerText = "$" + state.livePrice.toFixed(4);
            } else {
                priceEl.innerText = "$" + state.livePrice.toFixed(2);
            }
        }
        updateConnectionDot(true);
        if (isIframe) {
            window.parent.postMessage({
                type: 'KAREN_STATUS',
                asset: state.activeAsset,
                signal: state.currentSignal,
                price: state.livePrice,
                macd: state.macdParams
            }, '*');
        }
        
        const currentMinute = Math.floor(Date.now() / 60000) * 60; 
        
        if (!state.currentCandle || state.currentCandle.time !== currentMinute) {
            if (state.currentCandle) {
                state.candles.push(state.currentCandle);
                if (state.candles.length > 150) state.candles.shift();
            }
            state.currentCandle = { time: currentMinute, open: state.livePrice, high: state.livePrice, low: state.livePrice, close: state.livePrice };
        } else {
            state.currentCandle.close = state.livePrice;
            state.currentCandle.high = Math.max(state.currentCandle.high, state.livePrice);
            state.currentCandle.low = Math.min(state.currentCandle.low, state.livePrice);
        }
        
        if (tvSeries) tvSeries.update(state.currentCandle);
        updateIndicators();
    }

    function processHistoricalCandle(candleData) {
        const cVal = parseFloat(candleData.close || candleData.c);
        if (isNaN(cVal)) return;

        const oVal = parseFloat(candleData.open || candleData.o || cVal);
        const hVal = parseFloat(candleData.high || candleData.h || cVal);
        const lVal = parseFloat(candleData.low || candleData.l || cVal);
        
        let tVal = candleData.time || candleData.t;
        if (tVal > 10000000000) tVal = Math.floor(tVal / 1000); 
        if (!tVal) tVal = Math.floor(Date.now()/1000) - (state.candles.length * 60);

        const c = { time: tVal, open: oVal, high: hVal, low: lVal, close: cVal };
        
        if (state.candles.length > 0 && c.time <= state.candles[state.candles.length - 1].time) return; 

        state.candles.push(c);
        if (state.candles.length > 150) state.candles.shift();
        
        if (tvSeries) tvSeries.update(c);
        updateIndicators();
    }

    function updateIndicators() {
        const allCandles = [...state.candles];
        if (state.currentCandle) allCandles.push(state.currentCandle);
        
        if (allCandles.length > state.macdParams.slow) {
            const now = Date.now();
            
            const closes = allCandles.map(c => c.close);
            
            const { lines, signals, hists } = calculateMACDFull(closes, state.macdParams.fast, state.macdParams.slow, state.macdParams.sig);
            
            const curMacd = { line: lines[lines.length-1], signal: signals[signals.length-1], hist: hists[hists.length-1] };
            
            state.macd = curMacd;
            
            // 30 SECOND THROTTLE FOR BOT LOGIC HISTORY
            if (now - state.lastCalcTime >= 30000) {
                state.lastCalcTime = now;
                
                // Keep last 10 values
                state.macdHistory.unshift(curMacd);
                if (state.macdHistory.length > 400) state.macdHistory.pop();
            }
            
            const macdEl = el('ui-macd-val');
            if (macdEl) {
                macdEl.innerText = `${state.macd.line.toFixed(2)} / ${state.macd.signal.toFixed(2)}`;
                macdEl.style.color = state.macd.line > state.macd.signal ? '#000000' : '#000000';
            }
            
            if (tvMacdLine) {
                if (state.fullRecalc) {
                    tvMacdLine.setData(lines.map((v, i) => ({ time: allCandles[i].time, value: v })));
                    tvMacdSignal.setData(signals.map((v, i) => ({ time: allCandles[i].time, value: v })));
                    tvMacdHist.setData(hists.map((v, i) => ({ time: allCandles[i].time, value: v, color: v >= 0 ? '#111827' : '#9CA3AF' })));
                    
                    state.fullRecalc = false;
                } else {
                    const lastTime = allCandles[allCandles.length - 1].time;
                    tvMacdLine.update({ time: lastTime, value: curMacd.line });
                    tvMacdSignal.update({ time: lastTime, value: curMacd.signal });
                    tvMacdHist.update({ time: lastTime, value: curMacd.hist, color: curMacd.hist >= 0 ? '#111827' : '#9CA3AF' });
                }
            }

            evaluateLogic();
        }
    }

    function evaluateLogic() {
        if (!state.isRunning) return;

        const ctx = {
            price: state.livePrice,
            macd: state.macd,
            macdHistory: state.macdHistory,
            candles: state.candles,
            histState: state.histState,
            signal: (sig) => setSignal(sig),
            log: (msg, type) => addLog(msg, type),
            ring: (msg) => window.ring(msg),
            vibrate: (msg) => window.vibrate(msg)
        };

        try {
            let code = '';
            if (isIframe) {
                code = localStorage.getItem('aryanScript') || '';
                if (!code) return;
            } else {
                const codeEl = state.activeBot === 'KAREN' ? el('karen-code') : el('aryan-code');
                if (codeEl) code = codeEl.value;
            }
            if (code) {
                const fn = new Function('ctx', code);
                fn(ctx);
            }
        } catch (e) {
            addLog(`Syntax Error: ${e.message}`, 'error');
            setSignal('ERROR');
        }
    }

    // --- 7. UI INJECTION (Waits for DOM) ---
    function initUI() {
        if (document.getElementById('karen-host')) return;

        const host = document.createElement('div');
        host.id = 'karen-host';
        host.style.cssText = 'position: fixed; z-index: 9999999; top: 20px; right: 20px;';
        document.body.appendChild(host);
        shadow = host.attachShadow({ mode: 'open' });
        shadow.innerHTML = `
        <style>
          * { box-sizing: border-box; }
          :host { font-family: system-ui, -apple-system, sans-serif; }
          
          #minimized { display: none; align-items: center; gap: 8px; background: white; padding: 8px 16px; border-radius: 999px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: 1px solid #E5E7EB; cursor: move; user-select: none; touch-action: none; }
          .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #000000; box-shadow: 0 0 8px #000000; }
          .status-dot.disconnected { background: #9CA3AF; box-shadow: 0 0 8px #9CA3AF; }
          .expand-btn { background: #F3F4F6; border: none; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; cursor: pointer; margin-left: 8px; color: #4B5563; font-weight: bold; }
          
          #maximized { display: flex; width: 360px; max-height: 90vh; background: #FAFAFA; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.15); border: 1px solid #E5E7EB; flex-direction: column; overflow: hidden; }
          .header { background: white; padding: 12px 16px; border-bottom: 1px solid #E5E7EB; display: flex; justify-content: space-between; align-items: center; cursor: move; user-select: none; touch-action: none; }
          .header-title { font-weight: bold; font-size: 16px; display: flex; align-items: center; gap: 8px; color: #111827; }
          .collapse-btn { background: transparent; border: none; font-size: 20px; cursor: pointer; color: #6B7280; line-height: 1; }
          
          .content { padding: 12px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; }
          
          .card { background: white; border-radius: 12px; border: 1px solid #E5E7EB; padding: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
          .card-title { font-size: 10px; font-weight: 600; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; display: flex; justify-content: space-between; }
          
          .price-val { font-size: 28px; font-weight: bold; color: #111827; }
          
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
          .btn { padding: 8px; border-radius: 8px; border: none; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; text-align: center; }
          .btn-gray { background: #F3F4F6; color: #374151; }
          .btn-black { background: #111827; color: white; display: flex; justify-content: center; align-items: center; gap: 6px; }
          
          .cute-input { width: 100%; padding: 6px; border-radius: 6px; border: 1px solid #E5E7EB; font-size: 11px; text-align: center; outline: none; background: #F9FAFB; color: #374151; font-weight: bold; transition: all 0.2s; }
          .cute-input:focus { border-color: #111827; background: #FFFFFF; box-shadow: 0 0 0 2px rgba(17, 24, 39, 0.1); }

          /* LIGHT THEME CHARTS */
          .tv-container { width: 100%; height: 180px; border-radius: 8px; overflow: hidden; background: #FFFFFF; border: 1px solid #E5E7EB; }
          .tv-container-small { width: 100%; height: 80px; border-radius: 8px; overflow: hidden; background: #FFFFFF; border: 1px solid #E5E7EB; }
          
          .bot-selector { display: flex; gap: 4px; margin-bottom: 8px; }
          .bot-selector button { flex: 1; padding: 8px; border: 1px solid #E5E7EB; background: white; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer; color: #9CA3AF; transition: all 0.2s; }
          .bot-selector button.active { background: #F3F4F6; color: #111827; border-color: #D1D5DB; }
          
          /* CIRCLE SIGNAL */
          .signal-circle-wrapper {
              position: relative; width: 120px; height: 120px; margin: 16px auto;
              display: flex; justify-content: center; align-items: center;
          }
          .signal-circle-spinner {
              position: absolute; top: 0; left: 0; width: 100%; height: 100%;
              border-radius: 50%; border: 6px solid #E5E7EB; border-top-color: #111827;
          }
          .signal-circle-spinner.spinning {
              animation: spin 1.5s linear infinite;
          }
          .signal-circle-spinner.paused {
              animation-play-state: paused;
          }
          .signal-circle-text {
              font-size: 18px; font-weight: 900; color: #111827; z-index: 10; text-align: center; line-height: 1.2;
          }
          @keyframes spin { 100% { transform: rotate(360deg); } }

          .code-editor { width: 100%; height: 120px; background: #1E1E1E; color: #D4D4D4; font-family: 'Courier New', Courier, monospace; font-size: 11px; padding: 8px; border-radius: 8px; border: 1px solid #333; outline: none; resize: vertical; }
          
          .logs { height: 100px; overflow-y: auto; font-family: monospace; font-size: 10px; background: #F9FAFB; border-radius: 8px; padding: 8px; border: 1px solid #E5E7EB; }
          .log-entry { margin-bottom: 4px; border-bottom: 1px solid #F3F4F6; padding-bottom: 4px; display: flex; gap: 6px; }
          .log-time { color: #9CA3AF; white-space: nowrap; }
          .log-KAREN { color: #111827; font-weight: bold; }
          .log-ARYAN { color: #111827; font-weight: bold; }
          .log-info { color: #4B5563; }
          .log-exec { color: #111827; font-weight: bold; }
          .log-error { color: #111827; font-weight: bold; }
          
          ::-webkit-scrollbar { width: 4px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 4px; }
          
          :host(.dark) #minimized { background: #1F2937; color: #F9FAFB; border-color: #374151; }
          :host(.dark) #maximized { background: #111827; border-color: #374151; }
          :host(.dark) .header { background: #1F2937; border-color: #374151; }
          :host(.dark) .header-title { color: #F9FAFB; }
          :host(.dark) .card { background: #1F2937; border-color: #374151; }
          :host(.dark) .price-val { color: #F9FAFB; }
          :host(.dark) .btn-gray { background: #374151; color: #F9FAFB; }
          :host(.dark) .cute-input { background: #374151; color: #F9FAFB; border-color: #4B5563; }
          :host(.dark) .tv-container, :host(.dark) .tv-container-small { background: #111827; border-color: #374151; }
          :host(.dark) .bot-selector button { background: #1F2937; border-color: #374151; color: #9CA3AF; }
          :host(.dark) .bot-selector button.active { background: #374151; color: #F9FAFB; border-color: #4B5563; }
          :host(.dark) .logs { background: #111827; border-color: #374151; color: #D1D5DB; }
          :host(.dark) .log-entry { border-color: #1F2937; }
          :host(.dark) .card-title { color: #D1D5DB; }
          :host(.dark) .signal-circle-spinner { border-color: #374151; border-top-color: #F9FAFB; }
          :host(.dark) .signal-circle-text { color: #F9FAFB; }
        </style>

        <div id="minimized">
          <div class="status-dot disconnected" id="min-dot"></div>
          <span style="font-weight: 600; font-size: 13px; color: #111827;">KAREN & ARYAN</span>
          <button class="expand-btn" id="btn-expand">↗</button>
        </div>

        <div id="maximized">
          <div class="header" id="drag-header">
            <div class="header-title">
              <div class="status-dot disconnected" id="max-dot"></div>
              KAREN & ARYAN <span style="font-weight: normal; color: #9CA3AF; font-size: 12px;">v7.0</span>
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <button id="btn-theme" style="background: transparent; border: none; cursor: pointer; padding: 0; color: #6B7280;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
              </button>
              <button id="btn-music" style="background: transparent; border: none; cursor: pointer; padding: 0; color: #6B7280;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
              </button>
              <button class="collapse-btn" id="btn-collapse">−</button>
            </div>
          </div>
          
          <div class="content">
            <div class="card">
              <div class="card-title" style="display: flex; justify-content: space-between;">
                <span>Live Data <span id="ui-asset-name">---</span></span>
                <span style="color: #10B981; font-weight: bold;" id="ui-session-time">00:00</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                <div class="price-val" id="ui-price">---.--</div>
                <div style="font-size: 10px; color: #6B7280; text-align: right; display: flex; flex-direction: column; gap: 2px;">
                  <span>MACD: <span id="ui-macd-val" style="font-weight:bold; color:#111827;">--</span></span>
                  <span>HIST: <span id="ui-hist-state" style="font-weight:bold; color:#111827;">--</span></span>
                </div>
              </div>
            </div>
            
            <div class="card">
              <div class="card-title">TradingView Engine</div>
              <div id="tv-chart" class="tv-container"></div>
              <div class="card-title" style="margin-top: 8px;">MACD</div>
              <div id="tv-macd" class="tv-container-small"></div>
            </div>

            <div class="card" style="margin-top: 8px;">
              <div class="card-title" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center;" id="toggle-params">
                <span>Parameters</span> <span id="params-arrow">▼</span>
              </div>
              <div id="params-container" style="display: none; margin-top: 8px;">
                <div style="display: grid; grid-template-columns: 1fr; gap: 8px; margin-bottom: 8px;">
                  <div style="font-size: 10px; color: #6B7280; font-weight: 600;">MACD (Fast, Slow, Signal)
                    <div style="display: flex; gap: 4px; margin-top: 4px;">
                      <input type="number" id="inp-macd-f" value="12" class="cute-input" />
                      <input type="number" id="inp-macd-s" value="26" class="cute-input" />
                      <input type="number" id="inp-macd-sig" value="9" class="cute-input" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="card" style="display: flex; flex-direction: column; justify-content: center; align-items: center;">
              <div class="card-title" style="width: 100%;">Alarm Status</div>
              <div class="signal-circle-wrapper">
                  <div class="signal-circle-spinner paused" id="ui-signal-spinner"></div>
                  <div class="signal-circle-text" id="ui-signal-text">PAUSED</div>
              </div>
            </div>
            
            <div class="card">
              <div class="card-title" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center;" id="toggle-asset-bot">
                <span>Asset & Alarm Control</span> <span id="asset-bot-arrow">▼</span>
              </div>
              <div id="asset-bot-container" style="display: none; margin-top: 8px;">
                <div class="bot-selector" style="margin-bottom: 8px;">
                  <button id="select-btc" class="active">BTC OTC</button>
                  <button id="select-doge">DOGE OTC</button>
                </div>
                <div class="bot-selector" style="margin-bottom: 8px;">
                  <button id="select-karen" class="active">KAREN</button>
                  <button id="select-aryan">ARYAN</button>
                </div>
                <button class="btn btn-black" id="btn-toggle" style="width: 100%; padding: 10px; margin-bottom: 8px;">▶ START ALARM</button>
              </div>
            </div>

            <div class="card">
              <div class="card-title" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center;" id="toggle-scripts">
                <span>Modify Alarm Logic</span> <span id="scripts-arrow">▼</span>
              </div>
              <div id="scripts-container" style="display: none; margin-top: 8px;">
                <div id="karen-code-container">
                  <div class="card-title"><span style="color: #111827;">KAREN's Logic</span></div>
                  <textarea id="karen-code" class="code-editor" spellcheck="false">
// KAREN's Alarm Strategy (MACD Only)
if (!ctx.candles || ctx.candles.length < 60) {
    ctx.signal("WAITING FOR DATA (" + (ctx.candles ? ctx.candles.length : 0) + "/60)");
    return;
}

window.karenState = window.karenState || { last: null };
const now = Date.now();

if (ctx.macd.line > ctx.macd.signal) {
    ctx.signal("BUY ALARM");
    if (window.karenState.last !== 'BUY' || (now - window.karenState.time > 10000)) {
        ctx.log("MACD Crossover! Ringing.", "KAREN");
        ctx.ring("MACD WENT EXTREME LOW/BUY ZONE!");
        window.karenState = { last: 'BUY', time: now };
    }
} else if (ctx.macd.line < ctx.macd.signal) {
    ctx.signal("SELL ALARM");
    if (window.karenState.last !== 'SELL' || (now - window.karenState.time > 10000)) {
        ctx.log("MACD Crossunder! Vibrating.", "KAREN");
        ctx.vibrate("MACD WENT EXTREME HIGH/SELL ZONE!");
        window.karenState = { last: 'SELL', time: now };
    }
} else {
    ctx.signal("WAIT");
    window.karenState.last = null;
}
                  </textarea>
                </div>
                <div id="aryan-code-container" style="display: none;">
                  <div class="card-title"><span style="color: #111827;">ARYAN's Logic</span></div>
                  <textarea id="aryan-code" class="code-editor" spellcheck="false">
// === CONFIGURATION VARIABLES ===
const LOOKBACK = 300;

// Initialize custom memory state
window.myBotState = window.myBotState || {
    lastAlarmType: null,
    signalClearTimeout: null
};

// === STRATEGY LOGIC ===
const currentMacd = ctx.macd;

// Wait until we have at least 60 candles
if (!ctx.candles || ctx.candles.length < 60) {
    ctx.signal("WAITING FOR DATA (" + (ctx.candles ? ctx.candles.length : 0) + "/60)");
    return;
}

// Extract MACD line history
const macdLineHistory = ctx.macdHistory.map(m => m.line);

// === STEP 1: FIND EXTREME ZONE (Adaptive) ===
let maxDistance = 0;
const historyLength = Math.min(macdLineHistory.length, LOOKBACK);

for (let i = 0; i < historyLength; i++) {
    let distance = Math.abs(macdLineHistory[i]);
    if (distance > maxDistance) {
        maxDistance = distance;
    }
}

// Define extreme threshold (90% of max)
let threshold = maxDistance * 0.9;

// Helper to clear signal after 1 second
const showSignalForOneSecond = (signalText) => {
    ctx.signal(signalText);
    if (window.myBotState.signalClearTimeout) {
        clearTimeout(window.myBotState.signalClearTimeout);
    }
    window.myBotState.signalClearTimeout = setTimeout(() => {
        const host = document.getElementById('karen-host');
        if (host && host.shadowRoot) {
            const textEl = host.shadowRoot.getElementById('ui-signal-text');
            if (textEl && textEl.innerText === signalText) {
                textEl.innerText = "WAITING...";
            }
        }
    }, 1000);
};

// === STEP 2: CHECK SIDEWAYS MARKET ===
if (ctx.histState === "SIDEWAYS") {
    ctx.signal("SIDEWAYS - WAITING");
    window.myBotState.lastAlarmType = null;
    return;
}

// === ALARM TRIGGERS ===
if (currentMacd.line < -threshold) {
    if (window.myBotState.lastAlarmType !== "UP") {
        window.myBotState.lastAlarmType = "UP";
        ctx.log("MACD entered extreme LOW zone! (UP ALARM)", "CUSTOM");
        showSignalForOneSecond("UP");
        ctx.ring("MACD WENT EXTREME LOW/BUY ZONE!");
        ctx.vibrate("MACD WENT EXTREME LOW/BUY ZONE!");
    }
} else if (currentMacd.line > threshold) {
    if (window.myBotState.lastAlarmType !== "DOWN") {
        window.myBotState.lastAlarmType = "DOWN";
        ctx.log("MACD entered extreme HIGH zone! (DOWN ALARM)", "CUSTOM");
        showSignalForOneSecond("DOWN");
        ctx.ring("MACD WENT EXTREME HIGH/SELL ZONE!");
        ctx.vibrate("MACD WENT EXTREME HIGH/SELL ZONE!");
    }
} else {
    window.myBotState.lastAlarmType = null;
    const host = document.getElementById('karen-host');
    if (host && host.shadowRoot) {
        const textEl = host.shadowRoot.getElementById('ui-signal-text');
        if (textEl && textEl.innerText !== "UP" && textEl.innerText !== "DOWN") {
            ctx.signal("WAITING...");
        }
    }
}
                  </textarea>
                </div>
                <button class="btn btn-gray" id="btn-save-scripts" style="width: 100%; margin-top: 8px;">Save Scripts</button>
              </div>
            </div>
            
            <div class="card" id="video-card" style="display: none;">
              <div class="card-title">Anti-Sleep Video</div>
              <video id="bg-video" loop playsinline style="width: 100%; border-radius: 8px; border: 1px solid #E5E7EB; margin-top: 8px;">
                <source id="bg-video-source" src="" type="video/mp4">
              </video>
            </div>

            <div class="card" id="multi-chart-card" style="margin-top: 8px;">
              <div class="card-title">Multi-Chart Dashboard</div>
              <div style="font-size: 11px; color: #6B7280; margin-bottom: 8px;">
                Ignored Assets Found: <span id="ui-ignored-count" style="font-weight: 600; color: #111827;">0</span>
              </div>
              <button class="btn btn-primary" id="btn-test-multi" style="width: 100%; margin-bottom: 8px;">Launch Hidden Charts</button>
              <div id="ui-multi-status" style="display: flex; flex-direction: column;">
                <!-- Status rows injected here -->
              </div>
            </div>

            <div class="card">
              <div class="card-title">Execution Logs</div>
              <div class="logs" id="ui-logs"></div>
            </div>
          </div>
        </div>
        `;

        // Mobile Dragging Logic
        let isDragging = false, startX, startY, initialX, initialY;
        const onDragStart = (e) => {
            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
            isDragging = true;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            startX = clientX; startY = clientY;
            initialX = host.offsetLeft; initialY = host.offsetTop;
        };
        const onDragMove = (e) => {
            if (!isDragging) return;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            host.style.left = (initialX + clientX - startX) + 'px';
            host.style.top = (initialY + clientY - startY) + 'px';
            host.style.right = 'auto';
            if (e.cancelable) e.preventDefault();
        };
        const onDragEnd = () => isDragging = false;

        el('minimized').addEventListener('mousedown', onDragStart);
        el('drag-header').addEventListener('mousedown', onDragStart);
        document.addEventListener('mousemove', onDragMove);
        document.addEventListener('mouseup', onDragEnd);
        el('minimized').addEventListener('touchstart', onDragStart, { passive: false });
        el('drag-header').addEventListener('touchstart', onDragStart, { passive: false });
        document.addEventListener('touchmove', onDragMove, { passive: false });
        document.addEventListener('touchend', onDragEnd);

        // Buttons
        el('btn-theme').addEventListener('click', () => {
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
        });
        el('btn-collapse').addEventListener('click', () => { el('maximized').style.display = 'none'; el('minimized').style.display = 'flex'; });
        el('btn-expand').addEventListener('click', () => { el('minimized').style.display = 'none'; el('maximized').style.display = 'flex'; });

        el('select-btc').addEventListener('click', () => {
            if (state.isRunning) {
                addLog('Cannot switch asset while bot is running!', 'error');
                return;
            }
            state.selectedAsset = 'BTCUSD_OTC';
            el('select-btc').classList.add('active');
            el('select-doge').classList.remove('active');
            addLog('Asset switched to BTC OTC', 'info');
        });
        el('select-doge').addEventListener('click', () => {
            if (state.isRunning) {
                addLog('Cannot switch asset while bot is running!', 'error');
                return;
            }
            state.selectedAsset = 'DOGUSD_OTC';
            el('select-doge').classList.add('active');
            el('select-btc').classList.remove('active');
            addLog('Asset switched to DOGE OTC', 'info');
        });

        el('select-karen').addEventListener('click', () => {
            if (state.isRunning) {
                addLog('Cannot switch bot while running!', 'error');
                return;
            }
            state.activeBot = 'KAREN';
            el('select-karen').classList.add('active');
            el('select-aryan').classList.remove('active');
            el('karen-code-container').style.display = 'block';
            el('aryan-code-container').style.display = 'none';
            if (!state.isRunning) setSignal('PAUSED');
        });
        el('select-aryan').addEventListener('click', () => {
            if (state.isRunning) {
                addLog('Cannot switch bot while running!', 'error');
                return;
            }
            state.activeBot = 'ARYAN';
            el('select-aryan').classList.add('active');
            el('select-karen').classList.remove('active');
            el('karen-code-container').style.display = 'none';
            el('aryan-code-container').style.display = 'block';
            if (!state.isRunning) setSignal('PAUSED');
        });

        el('toggle-asset-bot').addEventListener('click', () => {
            const container = el('asset-bot-container');
            const arrow = el('asset-bot-arrow');
            if (container.style.display === 'none') {
                container.style.display = 'block';
                arrow.innerText = '▲';
            } else {
                container.style.display = 'none';
                arrow.innerText = '▼';
            }
        });

        el('toggle-scripts').addEventListener('click', () => {
            const container = el('scripts-container');
            const arrow = el('scripts-arrow');
            if (container.style.display === 'none') {
                container.style.display = 'block';
                arrow.innerText = '▲';
            } else {
                container.style.display = 'none';
                arrow.innerText = '▼';
            }
        });

        el('toggle-params').addEventListener('click', () => {
            const container = el('params-container');
            const arrow = el('params-arrow');
            if (container.style.display === 'none') {
                container.style.display = 'block';
                arrow.innerText = '▲';
            } else {
                container.style.display = 'none';
                arrow.innerText = '▼';
            }
        });

        el('btn-toggle').addEventListener('click', () => {
            state.isRunning = !state.isRunning;
            el('btn-toggle').innerHTML = state.isRunning ? '■ STOP ALARM' : '▶ START ALARM';
            el('btn-toggle').style.background = state.isRunning ? '#111827' : '#111827';
            setSignal(state.isRunning ? 'WAIT' : 'PAUSED');
            addLog(state.isRunning ? `${state.activeBot} Started` : `${state.activeBot} Stopped`, 'info');
        });

        // Scripts Logic
        const karenCode = el('karen-code');
        const aryanCode = el('aryan-code');

        const savedKaren = localStorage.getItem('karenScript');
        if (savedKaren) karenCode.value = savedKaren;
        
        const savedAryan = localStorage.getItem('aryanScript');
        if (savedAryan) aryanCode.value = savedAryan;
        
        el('btn-save-scripts').addEventListener('click', () => {
            localStorage.setItem('karenScript', karenCode.value);
            localStorage.setItem('aryanScript', aryanCode.value);
            addLog('Scripts saved permanently!', 'info');
            const btn = el('btn-save-scripts');
            btn.innerText = 'Saved!';
            btn.style.background = '#111827';
            btn.style.color = 'white';
            setTimeout(() => { 
                btn.innerText = 'Save Scripts'; 
                btn.style.background = '#F3F4F6';
                btn.style.color = '#374151';
            }, 2000);
        });

        // Multi-Chart Test Logic
        setInterval(() => {
            const countEl = el('ui-ignored-count');
            if (countEl && state.ignoredAssets) {
                countEl.innerText = state.ignoredAssets.size;
            }
        }, 1000);

        el('btn-test-multi').addEventListener('click', () => {
            if (!state.ignoredAssets || state.ignoredAssets.size === 0) {
                alert("No ignored assets found yet! Wait for the broker to send background data.");
                return;
            }
            
            // Save current script to localStorage so iframes can read it
            const aryanCodeEl = el('aryan-code');
            if (aryanCodeEl) {
                localStorage.setItem('aryanScript', aryanCodeEl.value);
            }
            
            const assetsToOpen = Array.from(state.ignoredAssets).slice(0, 3);
            assetsToOpen.forEach((asset, index) => {
                const iframe = document.createElement('iframe');
                // Use hash routing or query params to force asset load
                iframe.src = window.location.origin + window.location.pathname + '?asset=' + asset + '#' + asset;
                iframe.style.width = '10px';
                iframe.style.height = '10px';
                iframe.style.position = 'absolute';
                iframe.style.top = '0';
                iframe.style.left = '0';
                iframe.style.opacity = '0.01';
                iframe.style.pointerEvents = 'none';
                iframe.style.zIndex = '-1';
                document.body.appendChild(iframe);
                addLog('Injected hidden chart for ' + asset, 'info');
            });
            const btn = el('btn-test-multi');
            btn.innerText = "Injected 3 Charts!";
            btn.disabled = true;
            btn.style.background = '#10B981';
        });

        // Anti-Sleep Video Logic
        const video = el('bg-video');
        const videoSource = el('bg-video-source');
        const videoCard = el('video-card');
        const btnMusic = el('btn-music');
        let isVideoPlaying = false;

        // Load local video URL from loader.js
        const localVideoUrl = document.documentElement.getAttribute('data-extension-video-url');
        if (localVideoUrl) {
            video.src = localVideoUrl;
            video.load();
        }

        btnMusic.addEventListener('click', () => {
            if (!isVideoPlaying) {
                video.volume = 0.5; // Set video volume
                videoCard.style.display = 'block';
                video.play().then(() => {
                    isVideoPlaying = true;
                    btnMusic.style.opacity = '1';
                }).catch(e => {
                    addLog('Video play blocked: ' + e.message, 'error');
                    console.log('Video play blocked', e);
                });
            } else {
                video.pause();
                videoCard.style.display = 'none';
                isVideoPlaying = false;
                btnMusic.style.opacity = '0.5';
            }
        });

        // Parameter Inputs Logic
        const forceRecalc = () => { state.lastCalcTime = 0; state.fullRecalc = true; updateIndicators(); };
        
        // Load saved parameters
        const savedMacdF = localStorage.getItem('macdF');
        if (savedMacdF) { el('inp-macd-f').value = savedMacdF; state.macdParams.fast = parseInt(savedMacdF); }
        const savedMacdS = localStorage.getItem('macdS');
        if (savedMacdS) { el('inp-macd-s').value = savedMacdS; state.macdParams.slow = parseInt(savedMacdS); }
        const savedMacdSig = localStorage.getItem('macdSig');
        if (savedMacdSig) { el('inp-macd-sig').value = savedMacdSig; state.macdParams.sig = parseInt(savedMacdSig); }

        el('inp-macd-f').addEventListener('change', (e) => { 
            const val = parseInt(e.target.value) || 12;
            state.macdParams.fast = val; 
            localStorage.setItem('macdF', val);
            forceRecalc(); 
        });
        el('inp-macd-s').addEventListener('change', (e) => { 
            const val = parseInt(e.target.value) || 26;
            state.macdParams.slow = val; 
            localStorage.setItem('macdS', val);
            forceRecalc(); 
        });
        el('inp-macd-sig').addEventListener('change', (e) => { 
            const val = parseInt(e.target.value) || 9;
            state.macdParams.sig = val; 
            localStorage.setItem('macdSig', val);
            forceRecalc(); 
        });

        // Init TV
        function initTradingView() {
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

                if (state.candles.length > 0) {
                    tvSeries.setData(state.candles);
                    updateIndicators();
                }
            } catch (e) {
                addLog('Chart Init Error: ' + e.message, 'error');
            }
        }
        initTradingView();
        renderLogs();
    }

    if (isIframe) {
        state.isRunning = true;
        setSignal('WAIT');
    }
    
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
            else if (e.data.type === 'KAREN_STATUS') {
                updateMultiChartStatus(e.data.asset, e.data.signal, e.data.price, e.data.macd);
            }
        });
    } else {
        console.log("KAREN BOT: Running in Headless Mode for iframe");
        addLog("Headless Bot Started", "info");
    }
    
    // Helper to update Multi-Chart UI
    function updateMultiChartStatus(asset, signal, price, macd) {
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
                '<div style="color: #6B7280; width: 30%; text-align: right;">$' + (price ? price.toFixed(2) : '--') + '</div>';
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
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initUI);
    } else {
        initUI();
    }
}
})();