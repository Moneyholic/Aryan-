import React, { useState } from 'react';
import { Download, Bot, Zap, Shield, LayoutTemplate, Smartphone, SlidersHorizontal, BarChart2, MousePointerClick, Code2, Sparkles, Clock, Settings2, Film } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const EXTENSION_MANIFEST = `{
  "manifest_version": 3,
  "name": "KAREN & ARYAN Floating App",
  "version": "6.9",
  "description": "A cute, floating trading bot injected directly into Olymp Trade with Local Anti-Sleep Video.",
  "permissions": [],
  "host_permissions": ["*://*.olymptrade.com/*"],
  "web_accessible_resources": [
    {
      "resources": ["*.mp4"],
      "matches": ["*://*.olymptrade.com/*"]
    }
  ],
  "content_scripts": [
    {
      "matches": ["*://*.olymptrade.com/*"],
      "js": ["loader.js"],
      "run_at": "document_start"
    },
    {
      "matches": ["*://*.olymptrade.com/*"],
      "js": ["tv.js", "bot.js"],
      "run_at": "document_start",
      "world": "MAIN"
    }
  ]
}`;

const EXTENSION_LOADER_JS = `// loader.js - Passes extension URLs to the MAIN world
const videoUrl = chrome.runtime.getURL("video.mp4");
document.documentElement.setAttribute("data-extension-video-url", videoUrl);
`;

const EXTENSION_BOT_JS = `// KAREN & ARYAN Floating App - bot.js
if (!window.karenBotInjected) {
    window.karenBotInjected = true;
    console.log("KAREN & ARYAN Interceptor Loaded v6.9 (document_start)");

    // --- 1. Math & Indicators (Full Array Returns) ---
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

    function calculateRSIFull(prices, period = 14) {
        if (prices.length <= period) return prices.map(()=>50);
        let gains = 0, losses = 0;
        for (let i = 1; i <= period; i++) {
            const diff = prices[i] - prices[i - 1];
            if (diff >= 0) gains += diff; else losses -= diff;
        }
        let avgGain = gains / period;
        let avgLoss = losses / period;
        const rsis = Array(period).fill(50); 
        rsis.push(avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss)));
        
        for (let i = period + 1; i < prices.length; i++) {
            const diff = prices[i] - prices[i - 1];
            if (diff >= 0) {
                avgGain = (avgGain * (period - 1) + diff) / period;
                avgLoss = (avgLoss * (period - 1)) / period;
            } else {
                avgGain = (avgGain * (period - 1)) / period;
                avgLoss = (avgLoss * (period - 1) - diff) / period;
            }
            rsis.push(avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss)));
        }
        return rsis;
    }

    function calculateATRFull(candles, period = 14) {
        if (candles.length <= period) return candles.map(()=>0);
        let trs = [candles[0].high - candles[0].low];
        for (let i = 1; i < candles.length; i++) {
            const h = candles[i].high;
            const l = candles[i].low;
            const pc = candles[i - 1].close;
            trs.push(Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc)));
        }
        let atr = trs.slice(0, period).reduce((a, b) => a + b, 0) / period;
        const atrs = Array(period).fill(atr);
        for (let i = period; i < candles.length; i++) {
            atr = (atr * (period - 1) + trs[i]) / period;
            atrs.push(atr);
        }
        return atrs;
    }

    function calculateADXFull(candles, period = 14) {
        if (candles.length <= period * 2) return candles.map(()=>0);
        let trs = [0], pDMs = [0], nDMs = [0];
        for (let i = 1; i < candles.length; i++) {
            const h = candles[i].high;
            const l = candles[i].low;
            const ph = candles[i - 1].high;
            const pl = candles[i - 1].low;
            const pc = candles[i - 1].close;
            trs.push(Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc)));
            const upMove = h - ph;
            const downMove = pl - l;
            pDMs.push(upMove > downMove && upMove > 0 ? upMove : 0);
            nDMs.push(downMove > upMove && downMove > 0 ? downMove : 0);
        }
        
        const rma = (data, p) => {
            let res = Array(p).fill(0);
            let sum = data.slice(1, p + 1).reduce((a, b) => a + b, 0);
            let val = sum / p;
            res.push(val);
            for (let i = p + 1; i < data.length; i++) {
                val = (val * (p - 1) + data[i]) / p;
                res.push(val);
            }
            return res;
        };

        const smoothedTR = rma(trs, period);
        const smoothedPDM = rma(pDMs, period);
        const smoothedNDM = rma(nDMs, period);

        let dxs = Array(period).fill(0);
        for (let i = period; i < candles.length; i++) {
            const diPlus = smoothedTR[i] === 0 ? 0 : 100 * smoothedPDM[i] / smoothedTR[i];
            const diMinus = smoothedTR[i] === 0 ? 0 : 100 * smoothedNDM[i] / smoothedTR[i];
            const dx = (diPlus + diMinus === 0) ? 0 : 100 * Math.abs(diPlus - diMinus) / (diPlus + diMinus);
            dxs.push(dx);
        }

        const adxs = Array(period * 2 - 1).fill(0);
        let adxSum = dxs.slice(period, period * 2).reduce((a, b) => a + b, 0);
        let adx = adxSum / period;
        adxs.push(adx);
        for (let i = period * 2; i < candles.length; i++) {
            adx = (adx * (period - 1) + dxs[i]) / period;
            adxs.push(adx);
        }
        return adxs;
    }

    // --- 2. State ---
    let state = {
        candles: [], 
        currentCandle: null,
        livePrice: 0,
        macd: { line: 0, signal: 0, hist: 0 },
        rsi: { current: 50 },
        atr: { current: 0 },
        adx: { current: 0 },
        macdHistory: [],
        rsiHistory: [],
        atrHistory: [],
        adxHistory: [],
        macdParams: { fast: 12, slow: 26, sig: 9 },
        rsiPeriod: 14,
        atrPeriod: 14,
        adxPeriod: 14,
        lastCalcTime: 0,
        sleepUntil: 0,
        sessionSeconds: 0,
        isRunning: false,
        activeBot: 'KAREN',
        selectedAsset: 'BTCUSD_OTC',
        currentSignal: 'PAUSED',
        lastPriceTime: 0,
        logs: [],
        activeAsset: null,
        assetTicks: {},
        fullRecalc: true
    };

    let tvChart = null, tvSeries = null;
    let tvMacdChart = null, tvMacdLine = null, tvMacdSignal = null, tvMacdHist = null;
    let tvRsiChart = null, tvRsiLine = null;
    let tvAtrChart = null, tvAtrLine = null;
    let tvAdxChart = null, tvAdxLine = null;
    let btChart = null;
    let shadow = null;

    function el(id) {
        return shadow ? shadow.getElementById(id) : null;
    }

    function addLog(msg, type = 'info') {
        const time = new Date().toLocaleTimeString();
        state.logs.unshift({ time, msg, type });
        if (state.logs.length > 50) state.logs.pop();
        renderLogs();
    }

    function renderLogs() {
        const container = el('ui-logs');
        if (!container) return;
        container.innerHTML = state.logs.map(l => 
            \`<div class="log-entry">
                <span class="log-time">[\${l.time}]</span>
                <span class="log-\${l.type}">\${l.msg}</span>
            </div>\`
        ).join('');
    }

    function setSignal(sig) {
        state.currentSignal = sig;
        const display = el('ui-signal');
        if (display) {
            display.innerText = sig;
            const baseSig = sig.split(' ')[0]; // Extracts "SLEEP" from "SLEEP (4m 30s)"
            display.className = 'signal-display signal-' + baseSig;
        }
    }

    function updateConnectionDot(connected) {
        const minDot = el('min-dot');
        const maxDot = el('max-dot');
        if (minDot) minDot.className = \`status-dot \${connected ? '' : 'disconnected'}\`;
        if (maxDot) maxDot.className = \`status-dot \${connected ? '' : 'disconnected'}\`;
    }

    // --- 3. Enhanced WebSocket Interceptor (Runs IMMEDIATELY) ---
    const NativeWebSocket = window.WebSocket;
    window.WebSocket = function(url, protocols) {
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
                                    addLog(\`Ignored asset: \${item.p}\`, 'info');
                                    
                                    // If the user switches to the other supported asset on the website, but not in the app
                                    const otherSupported = state.selectedAsset === 'BTCUSD_OTC' ? 'DOGUSD_OTC' : 'BTCUSD_OTC';
                                    if (item.p === otherSupported && state.isRunning) {
                                        state.isRunning = false;
                                        setSignal('PAUSED');
                                        addLog(\`Website asset changed to \${item.p}! Bot PAUSED. Please switch asset in the app!\`, 'error');
                                        const btn = el('btn-toggle');
                                        if (btn) {
                                            btn.innerText = '▶ START BOT';
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
                                addLog(\`Asset locked: \${state.activeAsset}\`, 'info');
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
        } catch (e) {}
      });
      return wsInstance;
    };
    window.WebSocket.prototype = NativeWebSocket.prototype;

    setInterval(() => {
        if (Date.now() - state.lastPriceTime > 3000) {
            updateConnectionDot(false);
        }
    }, 1000);

    // Session Timer Logic
    setInterval(() => {
        if (state.isRunning) {
            state.sessionSeconds++;
            const sessEl = el('ui-session');
            if (sessEl) {
                const m = Math.floor(state.sessionSeconds / 60).toString().padStart(2, '0');
                const s = (state.sessionSeconds % 60).toString().padStart(2, '0');
                sessEl.innerText = \`⏱️ \${m}:\${s}\`;
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
        
        if (allCandles.length > Math.max(state.macdParams.slow, state.rsiPeriod)) {
            const now = Date.now();
            
            const closes = allCandles.map(c => c.close);
            
            const { lines, signals, hists } = calculateMACDFull(closes, state.macdParams.fast, state.macdParams.slow, state.macdParams.sig);
            const rsis = calculateRSIFull(closes, state.rsiPeriod);
            const atrs = calculateATRFull(allCandles, state.atrPeriod);
            const adxs = calculateADXFull(allCandles, state.adxPeriod);
            
            const curMacd = { line: lines[lines.length-1], signal: signals[signals.length-1], hist: hists[hists.length-1] };
            const curRsi = { current: rsis[rsis.length-1] };
            const curAtr = { current: atrs[atrs.length-1] };
            const curAdx = { current: adxs[adxs.length-1] };
            
            state.macd = curMacd;
            state.rsi = curRsi;
            state.atr = curAtr;
            state.adx = curAdx;
            
            // 30 SECOND THROTTLE FOR BOT LOGIC HISTORY
            if (now - state.lastCalcTime >= 30000) {
                state.lastCalcTime = now;
                
                // Keep last 10 values
                state.macdHistory.unshift(curMacd);
                if (state.macdHistory.length > 10) state.macdHistory.pop();
                
                state.rsiHistory.unshift(curRsi);
                if (state.rsiHistory.length > 10) state.rsiHistory.pop();
                
                state.atrHistory.unshift(curAtr);
                if (state.atrHistory.length > 5) state.atrHistory.pop();
                
                state.adxHistory.unshift(curAdx);
                if (state.adxHistory.length > 5) state.adxHistory.pop();
            }
            
            const macdEl = el('ui-macd-val');
            const rsiEl = el('ui-rsi-val');
            const atrEl = el('ui-atr-val');
            const adxEl = el('ui-adx-val');

            if (macdEl) {
                macdEl.innerText = \`\${state.macd.line.toFixed(2)} / \${state.macd.signal.toFixed(2)}\`;
                macdEl.style.color = state.macd.line > state.macd.signal ? '#0ECB81' : '#F6465D';
            }
            if (rsiEl) {
                rsiEl.innerText = state.rsi.current.toFixed(2);
                rsiEl.style.color = state.rsi.current > 70 ? '#F6465D' : (state.rsi.current < 30 ? '#0ECB81' : '#8B5CF6');
            }
            if (atrEl) {
                atrEl.innerText = state.atr.current.toFixed(4);
            }
            if (adxEl) {
                adxEl.innerText = state.adx.current.toFixed(2);
                adxEl.style.color = state.adx.current > 25 ? '#0ECB81' : '#8B5CF6';
            }
            
            if (tvMacdLine) {
                if (state.fullRecalc) {
                    tvMacdLine.setData(lines.map((v, i) => ({ time: allCandles[i].time, value: v })));
                    tvMacdSignal.setData(signals.map((v, i) => ({ time: allCandles[i].time, value: v })));
                    tvMacdHist.setData(hists.map((v, i) => ({ time: allCandles[i].time, value: v, color: v >= 0 ? '#0ECB81' : '#F6465D' })));
                    tvRsiLine.setData(rsis.map((v, i) => ({ time: allCandles[i].time, value: v })));
                    tvAtrLine.setData(atrs.map((v, i) => ({ time: allCandles[i].time, value: v })));
                    tvAdxLine.setData(adxs.map((v, i) => ({ time: allCandles[i].time, value: v })));
                    state.fullRecalc = false;
                } else {
                    const lastTime = allCandles[allCandles.length - 1].time;
                    tvMacdLine.update({ time: lastTime, value: curMacd.line });
                    tvMacdSignal.update({ time: lastTime, value: curMacd.signal });
                    tvMacdHist.update({ time: lastTime, value: curMacd.hist, color: curMacd.hist >= 0 ? '#0ECB81' : '#F6465D' });
                    tvRsiLine.update({ time: lastTime, value: curRsi.current });
                    tvAtrLine.update({ time: lastTime, value: curAtr.current });
                    tvAdxLine.update({ time: lastTime, value: curAdx.current });
                }
            }

            evaluateLogic();
        }
    }

    function evaluateLogic() {
        if (!state.isRunning) return;
        
        // Sleep Timer Logic
        if (Date.now() < state.sleepUntil) {
            const remainingSecs = Math.ceil((state.sleepUntil - Date.now()) / 1000);
            const m = Math.floor(remainingSecs / 60);
            const s = (remainingSecs % 60).toString().padStart(2, '0');
            setSignal(\`SLEEP (\${m}m \${s}s)\`);
            return;
        }

        const ctx = {
            price: state.livePrice,
            macd: state.macd,
            rsi: state.rsi,
            macdHistory: state.macdHistory,
            rsiHistory: state.rsiHistory,
            candles: state.candles,
            signal: (sig) => setSignal(sig),
            buy: (botName) => executeClick('BUY', botName || state.activeBot),
            sell: (botName) => executeClick('SELL', botName || state.activeBot),
            log: (msg, botName) => addLog(msg, botName || state.activeBot)
        };

        try {
            const codeEl = state.activeBot === 'KAREN' ? el('karen-code') : el('aryan-code');
            if (codeEl) {
                const fn = new Function('ctx', codeEl.value);
                fn(ctx);
            }
        } catch (e) {
            addLog(\`Syntax Error: \${e.message}\`, 'error');
            setSignal('ERROR');
        }
    }

    // --- 5. Ghost Mouse & Ultimate Click Simulator ---
    function executeClick(action, botName) {
      const targetId = action === 'BUY' ? 'sniper-buy' : 'sniper-sell';
      const targetEl = document.getElementById(targetId);
      
      if (!targetEl) {
          addLog(\`Failed: Deploy Sniper first!\`, 'info');
          return;
      }

      // SET SLEEP TIMER IMMEDIATELY TO PREVENT MULTIPLE CLICKS
      if (action === 'BUY' || action === 'SELL') {
          const sleepInput = el('inp-sleep');
          const sleepMins = sleepInput ? parseFloat(sleepInput.value) || 0 : 0;
          if (sleepMins > 0) {
              state.sleepUntil = Date.now() + sleepMins * 60000;
              addLog(\`Sleeping for \${sleepMins}m\`, 'info');
          }
      }

      const rect = targetEl.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      let ghost = document.getElementById('karen-ghost-mouse');
      if (!ghost) {
          ghost = document.createElement('div');
          ghost.id = 'karen-ghost-mouse';
          ghost.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.5 3.21V20.8C5.5 21.46 6.26 21.83 6.78 21.42L11.64 17.54C11.84 17.38 12.09 17.3 12.35 17.3H18.5C19.16 17.3 19.53 16.54 19.12 16.02L6.78 2.68C6.37 2.26 5.5 2.55 5.5 3.21Z" fill="white" stroke="black" stroke-width="1.5"/></svg>';
          ghost.style.cssText = 'position: fixed; z-index: 99999999; pointer-events: none; transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1); top: 50%; left: 50%; transform: translate(-20%, -20%); opacity: 0;';
          document.body.appendChild(ghost);
      }

      ghost.style.opacity = '1';
      ghost.style.left = x + 'px';
      ghost.style.top = y + 'px';

      setTimeout(() => {
          targetEl.style.display = 'none';
          const elementUnder = document.elementFromPoint(x, y);
          targetEl.style.display = 'flex';
          
          if (elementUnder) {
            const ripple = document.createElement('div');
            ripple.style.cssText = \`position: fixed; top: \${y-15}px; left: \${x-15}px; width: 30px; height: 30px; border-radius: 50%; background: \${action === 'BUY' ? '#0ECB81' : '#F6465D'}; opacity: 0.8; z-index: 9999999; pointer-events: none; transition: all 0.5s ease-out; transform: scale(0);\`;
            document.body.appendChild(ripple);
            requestAnimationFrame(() => {
                ripple.style.transform = 'scale(2)';
                ripple.style.opacity = '0';
                setTimeout(() => ripple.remove(), 500);
            });

            let clickableEl = elementUnder;
            while (clickableEl && clickableEl !== document.body) {
                if (clickableEl.tagName === 'BUTTON' || clickableEl.tagName === 'A' || clickableEl.getAttribute('role') === 'button') {
                    break;
                }
                clickableEl = clickableEl.parentElement;
            }
            if (!clickableEl || clickableEl === document.body) clickableEl = elementUnder;

            const eventConfig = { view: window, bubbles: true, cancelable: true, composed: true, clientX: x, clientY: y, pointerId: 1, pointerType: 'mouse', isPrimary: true, buttons: 1 };
            
            clickableEl.dispatchEvent(new PointerEvent('pointerover', eventConfig));
            clickableEl.dispatchEvent(new PointerEvent('pointerenter', eventConfig));
            clickableEl.dispatchEvent(new PointerEvent('pointerdown', eventConfig));
            clickableEl.dispatchEvent(new MouseEvent('mousedown', eventConfig));
            clickableEl.dispatchEvent(new PointerEvent('pointerup', eventConfig));
            clickableEl.dispatchEvent(new MouseEvent('mouseup', eventConfig));
            clickableEl.dispatchEvent(new MouseEvent('click', eventConfig));
            
            if (typeof clickableEl.click === 'function') {
                clickableEl.click();
            }

            let current = clickableEl;
            let reactTriggered = false;
            while (current && current !== document.body) {
                const reactKey = Object.keys(current).find(k => k.startsWith('__reactProps$') || k.startsWith('__reactEventHandlers$'));
                if (reactKey && current[reactKey]) {
                    const props = current[reactKey];
                    if (props.onClick) {
                        props.onClick({ preventDefault: () => {}, stopPropagation: () => {}, target: current, currentTarget: current });
                        reactTriggered = true;
                    }
                    if (props.onPointerDown) props.onPointerDown({ preventDefault: () => {}, stopPropagation: () => {} });
                    if (props.onPointerUp) props.onPointerUp({ preventDefault: () => {}, stopPropagation: () => {} });
                    if (props.onMouseDown) props.onMouseDown({ preventDefault: () => {}, stopPropagation: () => {} });
                    if (props.onMouseUp) props.onMouseUp({ preventDefault: () => {}, stopPropagation: () => {} });
                    
                    if (reactTriggered) break;
                }
                current = current.parentElement;
            }
            
            addLog(\`[\${botName}] Executed \${action} Click\`, 'exec');
          } else {
            addLog(\`Failed: Element not found under Sniper\`, 'info');
          }

          setTimeout(() => { ghost.style.opacity = '0'; }, 500);
      }, 300);
    }

    // --- 6. Mobile-Friendly Sniper Crosshairs ---
    function injectCrosshairs() {
      const btnDeploy = el('btn-deploy');
      const existingBuy = document.getElementById('sniper-buy');
      const existingSell = document.getElementById('sniper-sell');

      if (existingBuy || existingSell) {
          if (existingBuy) existingBuy.remove();
          if (existingSell) existingSell.remove();
          addLog('Sniper Crosshairs Retracted', 'info');
          if (btnDeploy) {
              btnDeploy.innerText = 'Deploy Sniper';
              btnDeploy.style.background = '#10B981';
          }
          return;
      }

      addLog('Sniper Crosshairs Deployed', 'info');
      if (btnDeploy) {
          btnDeploy.innerText = 'Retract sniper';
          btnDeploy.style.background = '#EF4444';
      }

      const createCrosshair = (id, color, text, top, left) => {
        const crossEl = document.createElement('div');
        crossEl.id = id;
        crossEl.style.cssText = \`position: fixed; top: \${top}px; left: \${left}px; width: 75px; height: 26px; background: \${color}; border: 1px solid white; border-radius: 4px; color: white; font-weight: bold; display: flex; align-items: center; justify-content: center; z-index: 999999; cursor: move; opacity: 0.85; font-size: 11px; text-align: center; box-shadow: 0 0 10px \${color}; touch-action: none;\`;
        crossEl.innerText = text;
        document.body.appendChild(crossEl);

        let isDraggingCross = false, startXCross, startYCross, initialXCross, initialYCross;
        
        const onDragStartCross = (e) => {
          isDraggingCross = true; 
          const clientX = e.touches ? e.touches[0].clientX : e.clientX;
          const clientY = e.touches ? e.touches[0].clientY : e.clientY;
          startXCross = clientX; startYCross = clientY;
          initialXCross = crossEl.offsetLeft; initialYCross = crossEl.offsetTop;
        };
        
        const onDragMoveCross = (e) => {
          if (!isDraggingCross) return;
          const clientX = e.touches ? e.touches[0].clientX : e.clientX;
          const clientY = e.touches ? e.touches[0].clientY : e.clientY;
          crossEl.style.left = (initialXCross + clientX - startXCross) + 'px';
          crossEl.style.top = (initialYCross + clientY - startYCross) + 'px';
          if (e.cancelable) e.preventDefault();
        };
        
        const onDragEndCross = () => isDraggingCross = false;

        crossEl.addEventListener('mousedown', onDragStartCross);
        document.addEventListener('mousemove', onDragMoveCross);
        document.addEventListener('mouseup', onDragEndCross);
        
        crossEl.addEventListener('touchstart', onDragStartCross, { passive: false });
        document.addEventListener('touchmove', onDragMoveCross, { passive: false });
        document.addEventListener('touchend', onDragEndCross);
      };

      createCrosshair('sniper-buy', 'rgba(14, 203, 129, 0.8)', 'BUY', window.innerHeight / 2 - 13, window.innerWidth / 2 - 80);
      createCrosshair('sniper-sell', 'rgba(246, 70, 93, 0.8)', 'SELL', window.innerHeight / 2 - 13, window.innerWidth / 2 + 5);
    }

    // --- 7. UI INJECTION (Waits for DOM) ---
    function initUI() {
        if (document.getElementById('karen-host')) return;

        const host = document.createElement('div');
        host.id = 'karen-host';
        host.style.cssText = 'position: fixed; z-index: 9999999; top: 20px; right: 20px;';
        document.body.appendChild(host);
        shadow = host.attachShadow({ mode: 'open' });

        shadow.innerHTML = \`
        <style>
          * { box-sizing: border-box; }
          :host { font-family: system-ui, -apple-system, sans-serif; }
          
          #minimized { display: none; align-items: center; gap: 8px; background: white; padding: 8px 16px; border-radius: 999px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: 1px solid #E5E7EB; cursor: move; user-select: none; touch-action: none; }
          .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #0ECB81; box-shadow: 0 0 8px #0ECB81; }
          .status-dot.disconnected { background: #F6465D; box-shadow: 0 0 8px #F6465D; }
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
          .btn-green { background: #ECFDF5; color: #059669; border: 1px solid #A7F3D0; }
          .btn-red { background: #FEF2F2; color: #DC2626; border: 1px solid #FECACA; }
          .btn-black { background: #111827; color: white; display: flex; justify-content: center; align-items: center; gap: 6px; }
          
          .cute-input { width: 100%; padding: 6px; border-radius: 6px; border: 1px solid #E5E7EB; font-size: 11px; text-align: center; outline: none; background: #F9FAFB; color: #374151; font-weight: bold; transition: all 0.2s; }
          .cute-input:focus { border-color: #3B82F6; background: #FFFFFF; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1); }

          /* LIGHT THEME CHARTS */
          .tv-container { width: 100%; height: 180px; border-radius: 8px; overflow: hidden; background: #FFFFFF; border: 1px solid #E5E7EB; }
          .tv-container-small { width: 100%; height: 80px; border-radius: 8px; overflow: hidden; background: #FFFFFF; border: 1px solid #E5E7EB; }
          
          .bot-selector { display: flex; gap: 4px; margin-bottom: 8px; }
          .bot-selector button { flex: 1; padding: 8px; border: 1px solid #E5E7EB; background: white; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer; color: #9CA3AF; transition: all 0.2s; }
          .bot-selector button.active { background: #F3F4F6; color: #111827; border-color: #D1D5DB; }
          
          .signal-display { text-align: center; font-size: 16px; font-weight: 900; padding: 8px; border-radius: 8px; background: #F3F4F6; color: #6B7280; letter-spacing: 2px; transition: all 0.3s; }
          .signal-BUY { background: #ECFDF5; color: #059669; box-shadow: 0 0 10px rgba(14, 203, 129, 0.2); }
          .signal-SELL { background: #FEF2F2; color: #DC2626; box-shadow: 0 0 10px rgba(246, 70, 93, 0.2); }
          .signal-WAIT { background: #FFFBEB; color: #D97706; }
          .signal-PAUSED { background: #F3F4F6; color: #6B7280; }
          .signal-ERROR { background: #FEF2F2; color: #DC2626; }
          .signal-SLEEP { background: #E0E7FF; color: #4F46E5; box-shadow: 0 0 10px rgba(79, 70, 229, 0.2); }

          .code-editor { width: 100%; height: 120px; background: #1E1E1E; color: #D4D4D4; font-family: 'Courier New', Courier, monospace; font-size: 11px; padding: 8px; border-radius: 8px; border: 1px solid #333; outline: none; resize: vertical; }
          
          .logs { height: 100px; overflow-y: auto; font-family: monospace; font-size: 10px; background: #F9FAFB; border-radius: 8px; padding: 8px; border: 1px solid #E5E7EB; }
          .log-entry { margin-bottom: 4px; border-bottom: 1px solid #F3F4F6; padding-bottom: 4px; display: flex; gap: 6px; }
          .log-time { color: #9CA3AF; white-space: nowrap; }
          .log-KAREN { color: #EC4899; font-weight: bold; }
          .log-ARYAN { color: #3B82F6; font-weight: bold; }
          .log-info { color: #4B5563; }
          .log-exec { color: #059669; font-weight: bold; }
          .log-error { color: #DC2626; font-weight: bold; }
          
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
          :host(.dark) #backtest-maximized { background: #111827 !important; }
          :host(.dark) #bt-file-upload { background: #374151 !important; border-color: #4B5563 !important; color: #F9FAFB !important; }
          :host(.dark) #backtest-minimized { background: #4338CA !important; }
          :host(.dark) #btn-close-backtest { background: #7F1D1D !important; color: #FECACA !important; }
        </style>

        <div id="minimized">
          <div class="status-dot disconnected" id="min-dot"></div>
          <span style="font-weight: 600; font-size: 13px; color: #111827;">KAREN & ARYAN</span>
          <button class="expand-btn" id="btn-expand">↗</button>
        </div>

        <div id="backtest-maximized" style="display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: #F9FAFB; z-index: 100000; flex-direction: column; overflow: hidden;">
          <div class="header" style="border-radius: 0; padding: 16px;">
            <div class="header-title" style="font-size: 18px;">
              Accuracy Tester
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <button class="collapse-btn" id="btn-minimize-backtest" style="width: 30px; height: 30px;">−</button>
              <button class="collapse-btn" id="btn-close-backtest" style="width: 30px; height: 30px; background: #FEF2F2; color: #DC2626;">×</button>
            </div>
          </div>
          <div class="content" style="flex: 1; overflow-y: auto; padding: 24px; max-width: 800px; margin: 0 auto; width: 100%;">
            <div class="card" style="margin-bottom: 16px;">
              <div class="card-title" style="font-size: 14px;">1. Upload Tick Data (CSV)</div>
              <input type="file" id="bt-file-upload" accept=".csv" style="margin-top: 12px; width: 100%; padding: 8px; border: 1px dashed #D1D5DB; border-radius: 8px; background: #FFFFFF;" />
              <div style="font-size: 11px; color: #6B7280; margin-top: 8px;">Format: timestamp, price (e.g. 1672531200000, 16500.50)</div>
            </div>
            
            <div class="card" style="margin-bottom: 16px;">
              <div class="card-title" style="font-size: 14px;">2. Select Bot Logic</div>
              <div class="bot-selector" style="margin-top: 12px;">
                <button id="bt-select-karen" class="active" style="padding: 12px;">KAREN</button>
                <button id="bt-select-aryan" style="padding: 12px;">ARYAN</button>
              </div>
            </div>

            <div class="card" style="margin-bottom: 16px;">
              <div class="card-title" style="font-size: 14px;">3. Test Parameters</div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 12px;">
                <div>
                  <div style="font-size: 11px; color: #6B7280; font-weight: 600; margin-bottom: 4px;">RSI Period</div>
                  <input type="number" id="bt-rsi" value="14" class="cute-input" />
                </div>
                <div>
                  <div style="font-size: 11px; color: #6B7280; font-weight: 600; margin-bottom: 4px;">ADX Period</div>
                  <input type="number" id="bt-adx" value="14" class="cute-input" />
                </div>
              </div>
            </div>

            <div class="card" style="margin-bottom: 16px;">
              <button class="btn btn-black" id="btn-run-backtest" style="width: 100%; padding: 12px; font-size: 14px; background: #374151; color: #D1D5DB;">Run Accuracy Tester</button>
            </div>

            <div class="card" style="margin-bottom: 16px;">
              <div class="card-title" style="font-size: 14px;">4. Test Chart</div>
              <div id="bt-chart-container" style="width: 100%; height: 300px; margin-top: 12px; background: #111827; border-radius: 8px;"></div>
            </div>

            <div class="card">
              <div class="card-title" style="font-size: 14px;">Results</div>
              <div id="bt-results" style="font-family: monospace; font-size: 12px; background: #111827; color: #10B981; padding: 16px; border-radius: 8px; min-height: 200px; white-space: pre-wrap; overflow-y: auto; margin-top: 12px;">Waiting for data...</div>
            </div>
          </div>
        </div>

        <div id="backtest-minimized" style="display: none; position: fixed; bottom: 20px; right: 20px; background: #6366F1; color: white; padding: 12px 24px; border-radius: 30px; font-weight: bold; cursor: pointer; box-shadow: 0 10px 25px rgba(99, 102, 241, 0.4); z-index: 100000;">
          Test Running... (Click to expand)
        </div>

        <div id="maximized">
          <div class="header" id="drag-header">
            <div class="header-title">
              <div class="status-dot disconnected" id="max-dot"></div>
              KAREN & ARYAN <span style="font-weight: normal; color: #9CA3AF; font-size: 12px;">v6.9</span>
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <button id="btn-theme" style="background: transparent; border: none; cursor: pointer; font-size: 14px; opacity: 0.5; padding: 0;">Theme</button>
              <button id="btn-music" style="background: transparent; border: none; cursor: pointer; font-size: 14px; opacity: 0.5; padding: 0;">Music</button>
              <button class="collapse-btn" id="btn-collapse">−</button>
            </div>
          </div>
          
          <div class="content">
            <div class="card">
              <div class="card-title">Live Data <span id="ui-asset-name">---</span></div>
              <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                <div class="price-val" id="ui-price">---.--</div>
                <div style="font-size: 10px; color: #6B7280; text-align: right;">
                  MACD: <span id="ui-macd-val">--</span><br>
                  RSI: <span id="ui-rsi-val">--</span><br>
                  ATR: <span id="ui-atr-val">--</span><br>
                  ADX: <span id="ui-adx-val">--</span>
                </div>
              </div>
            </div>
            
            <div class="card">
              <div class="card-title">TradingView Engine</div>
              <div id="tv-chart" class="tv-container"></div>
              <div class="card-title" style="margin-top: 8px;">MACD</div>
              <div id="tv-macd" class="tv-container-small"></div>
              <div class="card-title" style="margin-top: 8px;">RSI</div>
              <div id="tv-rsi" class="tv-container-small"></div>
              <div class="card-title" style="margin-top: 8px;">ATR</div>
              <div id="tv-atr" class="tv-container-small"></div>
              <div class="card-title" style="margin-top: 8px;">ADX</div>
              <div id="tv-adx" class="tv-container-small"></div>
            </div>

            <div class="card">
              <div class="card-title" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center;" id="toggle-params">
                <span>Parameters & Sleep</span> <span id="params-arrow">▼</span>
              </div>
              <div id="params-container" style="display: none; margin-top: 8px;">
                <div style="display: grid; grid-template-columns: 3fr 2fr; gap: 8px; margin-bottom: 8px;">
                  <div style="font-size: 10px; color: #6B7280; font-weight: 600;">MACD (F, S, Sig)
                    <div style="display: flex; gap: 4px; margin-top: 4px;">
                      <input type="number" id="inp-macd-f" value="12" class="cute-input" />
                      <input type="number" id="inp-macd-s" value="26" class="cute-input" />
                      <input type="number" id="inp-macd-sig" value="9" class="cute-input" />
                    </div>
                  </div>
                  <div style="font-size: 10px; color: #6B7280; font-weight: 600;">RSI Period
                    <div style="margin-top: 4px;">
                      <input type="number" id="inp-rsi-p" value="14" class="cute-input" />
                    </div>
                  </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
                  <div style="font-size: 10px; color: #6B7280; font-weight: 600;">ATR Period
                    <div style="margin-top: 4px;">
                      <input type="number" id="inp-atr-p" value="14" class="cute-input" />
                    </div>
                  </div>
                  <div style="font-size: 10px; color: #6B7280; font-weight: 600;">ADX Period
                    <div style="margin-top: 4px;">
                      <input type="number" id="inp-adx-p" value="14" class="cute-input" />
                    </div>
                  </div>
                </div>
                <div style="font-size: 10px; color: #6B7280; font-weight: 600;">Sleep after trade (minutes)
                  <input type="number" id="inp-sleep" value="5" class="cute-input" style="margin-top: 4px;" />
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card-title">Session Info</div>
              <div class="grid-2" style="margin-bottom: 8px;">
                <div class="btn btn-gray" id="ui-session" style="cursor: default; display: flex; align-items: center; justify-content: center; font-family: monospace; font-size: 13px;">⏱️ 00:00</div>
              </div>
              <div class="signal-display signal-PAUSED" id="ui-signal" style="margin-top: 8px;">PAUSED</div>
            </div>
            
            <div class="card">
              <div class="card-title" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center;" id="toggle-asset-bot">
                <span>Asset & Bot Control</span> <span id="asset-bot-arrow">▼</span>
              </div>
              <div id="asset-bot-container" style="display: none; margin-top: 8px;">
                <div style="margin-bottom: 12px;">
                  <button class="btn btn-gray" id="btn-deploy" style="width: 100%; font-weight: bold; background: #10B981; color: white;">Deploy Sniper</button>
                </div>
                <div class="bot-selector" style="margin-bottom: 8px;">
                  <button id="select-btc" class="active">BTC OTC</button>
                  <button id="select-doge">DOGE OTC</button>
                </div>
                <div class="bot-selector" style="margin-bottom: 8px;">
                  <button id="select-karen" class="active">KAREN</button>
                  <button id="select-aryan">ARYAN</button>
                </div>
                <div class="grid-2" style="margin-bottom: 8px;">
                  <button class="btn btn-green" id="btn-buy">Test BUY</button>
                  <button class="btn btn-red" id="btn-sell">Test SELL</button>
                </div>
                <button class="btn btn-black" id="btn-toggle" style="width: 100%; padding: 10px; margin-bottom: 8px;">▶ START BOT</button>
                <button class="btn btn-gray" id="btn-open-backtest" style="width: 100%; padding: 10px; background: #E0F2FE; color: #0284C7;">Accuracy Tester</button>
              </div>
            </div>

            <div class="card">
              <div class="card-title" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center;" id="toggle-scripts">
                <span>Modify Scripts</span> <span id="scripts-arrow">▼</span>
              </div>
              <div id="scripts-container" style="display: none; margin-top: 8px;">
                <div id="karen-code-container">
                  <div class="card-title"><span style="color: #EC4899;">KAREN's Logic</span></div>
                  <textarea id="karen-code" class="code-editor" spellcheck="false">
// KAREN's Safe Strategy
if (ctx.macd.line > ctx.macd.signal && ctx.rsi.current < 40) {
    ctx.signal("BUY");
    ctx.log("Conditions met! Buying.", "KAREN");
    ctx.buy("KAREN");
} else if (ctx.macd.line < ctx.macd.signal && ctx.rsi.current > 60) {
    ctx.signal("SELL");
    ctx.log("Conditions met! Selling.", "KAREN");
    ctx.sell("KAREN");
} else {
    ctx.signal("WAIT");
}
                  </textarea>
                </div>
                
                <div id="aryan-code-container" style="display: none;">
                  <div class="card-title"><span style="color: #3B82F6;">ARYAN's Logic</span></div>
                  <textarea id="aryan-code" class="code-editor" spellcheck="false">
// --- ARYAN CUSTOM LOGIC SCRIPT (WITH MOMENTUM FILTERS) ---

// 1. Initialize custom memory state
window.myBotState = window.myBotState || {
    waitingForBuyCross: false,
    buyExpiryCounter: 0,
    waitingForSellCross: false,
    sellExpiryCounter: 0,
    lastMacdRef: null
};

// 2. Detect if a new 30-second calculation cycle just happened
let isNewCycle = false;
if (ctx.macdHistory && ctx.macdHistory.length > 0) {
    if (window.myBotState.lastMacdRef !== ctx.macdHistory[0]) {
        isNewCycle = true;
        window.myBotState.lastMacdRef = ctx.macdHistory[0];
    }
}

// 3. Check RSI Conditions & Manage Expiry

// --- BUY Trigger (RSI <= 21) ---
if (ctx.rsi.current <= 21) {
    if (!window.myBotState.waitingForBuyCross) {
        ctx.log("RSI touched 21! Armed for BUY. Waiting for MACD crossover...");
    }
    window.myBotState.waitingForBuyCross = true;
    window.myBotState.buyExpiryCounter = 20; 
    
    window.myBotState.waitingForSellCross = false; 
    window.myBotState.sellExpiryCounter = 0;
} else if (window.myBotState.waitingForBuyCross && isNewCycle) {
    window.myBotState.buyExpiryCounter--;
    if (window.myBotState.buyExpiryCounter <= 0) {
        ctx.log("BUY scan result expired (10 mins passed). Resetting...");
        window.myBotState.waitingForBuyCross = false;
    }
}

// --- SELL Trigger (RSI >= 79) ---
if (ctx.rsi.current >= 79) {
    if (!window.myBotState.waitingForSellCross) {
        ctx.log("RSI touched 79! Armed for SELL. Waiting for MACD crossunder...");
    }
    window.myBotState.waitingForSellCross = true;
    window.myBotState.sellExpiryCounter = 20; 
    
    window.myBotState.waitingForBuyCross = false;
    window.myBotState.buyExpiryCounter = 0;
} else if (window.myBotState.waitingForSellCross && isNewCycle) {
    window.myBotState.sellExpiryCounter--;
    if (window.myBotState.sellExpiryCounter <= 0) {
        ctx.log("SELL scan result expired (10 mins passed). Resetting...");
        window.myBotState.waitingForSellCross = false;
    }
}

// 4. Check MACD Crossover/Crossunder & MOMENTUM & ADX
if (ctx.macdHistory && ctx.macdHistory.length >= 2) {
    let currentMacd = ctx.macdHistory[0];
    let previousMacd = ctx.macdHistory[1];
    
    // --- FILTERS ---
    let isAdxValid = ctx.adx.current >= 28 && ctx.adx.current <= 40;
    
    // --- BUY CONDITIONS ---
    let isCrossover = previousMacd.hist <= 0 && currentMacd.hist > 0 && currentMacd.line < 0;
    let isHistMovingUp = currentMacd.hist > previousMacd.hist; // Histogram growing
    let isMacdLineMovingUp = currentMacd.line > previousMacd.line; // MACD line pointing up

    // --- SELL CONDITIONS ---
    let isCrossunder = previousMacd.hist >= 0 && currentMacd.hist < 0 && currentMacd.line > 0;
    let isHistMovingDown = currentMacd.hist < previousMacd.hist; // Histogram shrinking
    let isMacdLineMovingDown = currentMacd.line < previousMacd.line; // MACD line pointing down

    // BUY Execution
    if (window.myBotState.waitingForBuyCross && isCrossover && isHistMovingUp && isMacdLineMovingUp) {
        if (isAdxValid) {
            ctx.log("Strong MACD Crossover + ADX Valid! Executing BUY!");
            ctx.buy();
            window.myBotState.waitingForBuyCross = false; 
            window.myBotState.buyExpiryCounter = 0;
        } else {
            ctx.log("MACD Crossover ignored due to ADX filters.");
        }
    }
    
    // SELL Execution
    if (window.myBotState.waitingForSellCross && isCrossunder && isHistMovingDown && isMacdLineMovingDown) {
        if (isAdxValid) {
            ctx.log("Strong MACD Crossunder + ADX Valid! Executing SELL!");
            ctx.sell();
            window.myBotState.waitingForSellCross = false; 
            window.myBotState.sellExpiryCounter = 0;
        } else {
            ctx.log("MACD Crossunder ignored due to ADX filters.");
        }
    }
}

// 5. Update UI Signal Text
if (window.myBotState.waitingForBuyCross) {
    ctx.signal("ARMED BUY (" + window.myBotState.buyExpiryCounter + " left)");
} else if (window.myBotState.waitingForSellCross) {
    ctx.signal("ARMED SELL (" + window.myBotState.sellExpiryCounter + " left)");
} else {
    ctx.signal("SCANNING RSI");
}
                  </textarea>
                </div>
                <button class="btn btn-gray" id="btn-save-scripts" style="width: 100%; margin-top: 8px;">Save Scripts</button>
              </div>
            </div>
            
            <div class="card" id="video-card" style="display: none;">
              <div class="card-title">Anti-Sleep Video</div>
              <!-- Note: Video is loaded locally from the extension folder! -->
              <video id="bg-video" loop playsinline style="width: 100%; border-radius: 8px; border: 1px solid #E5E7EB; margin-top: 8px;">
                <source id="bg-video-source" src="" type="video/mp4">
              </video>
            </div>

            <div class="card">
              <div class="card-title">Execution Logs</div>
              <div class="logs" id="ui-logs"></div>
            </div>
          </div>
        </div>

        <!-- Scanner Box Removed -->
        \`;

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
        let isDarkMode = false;
        el('btn-theme').addEventListener('click', () => {
            isDarkMode = !isDarkMode;
            if (isDarkMode) {
                shadow.host.classList.add('dark');
                if (tvChart) tvChart.applyOptions({ layout: { background: { type: 'solid', color: '#111827' }, textColor: '#D1D5DB' } });
                if (tvRsiChart) tvRsiChart.applyOptions({ layout: { background: { type: 'solid', color: '#111827' }, textColor: '#D1D5DB' } });
                if (tvMacdChart) tvMacdChart.applyOptions({ layout: { background: { type: 'solid', color: '#111827' }, textColor: '#D1D5DB' } });
                if (tvAdxChart) tvAdxChart.applyOptions({ layout: { background: { type: 'solid', color: '#111827' }, textColor: '#D1D5DB' } });
                if (tvAtrChart) tvAtrChart.applyOptions({ layout: { background: { type: 'solid', color: '#111827' }, textColor: '#D1D5DB' } });
                if (btChart) btChart.applyOptions({ layout: { background: { type: 'solid', color: '#111827' }, textColor: '#D1D5DB' } });
            } else {
                shadow.host.classList.remove('dark');
                if (tvChart) tvChart.applyOptions({ layout: { background: { type: 'solid', color: '#FFFFFF' }, textColor: '#374151' } });
                if (tvRsiChart) tvRsiChart.applyOptions({ layout: { background: { type: 'solid', color: '#FFFFFF' }, textColor: '#374151' } });
                if (tvMacdChart) tvMacdChart.applyOptions({ layout: { background: { type: 'solid', color: '#FFFFFF' }, textColor: '#374151' } });
                if (tvAdxChart) tvAdxChart.applyOptions({ layout: { background: { type: 'solid', color: '#FFFFFF' }, textColor: '#374151' } });
                if (tvAtrChart) tvAtrChart.applyOptions({ layout: { background: { type: 'solid', color: '#FFFFFF' }, textColor: '#374151' } });
                if (btChart) btChart.applyOptions({ layout: { background: { type: 'solid', color: '#FFFFFF' }, textColor: '#374151' } });
            }
        });
        el('btn-collapse').addEventListener('click', () => { el('maximized').style.display = 'none'; el('minimized').style.display = 'flex'; });
        el('btn-expand').addEventListener('click', () => { el('minimized').style.display = 'none'; el('maximized').style.display = 'flex'; });

        // Backtest UI
        el('btn-open-backtest').addEventListener('click', () => {
            el('maximized').style.display = 'none';
            el('minimized').style.display = 'none';
            el('backtest-maximized').style.display = 'flex';
        });
        el('btn-close-backtest').addEventListener('click', () => {
            el('backtest-maximized').style.display = 'none';
            el('backtest-minimized').style.display = 'none';
            el('maximized').style.display = 'flex';
        });
        el('btn-minimize-backtest').addEventListener('click', () => {
            el('backtest-maximized').style.display = 'none';
            el('backtest-minimized').style.display = 'block';
        });
        el('backtest-minimized').addEventListener('click', () => {
            el('backtest-minimized').style.display = 'none';
            el('backtest-maximized').style.display = 'flex';
        });

        let btActiveBot = 'KAREN';
        el('bt-select-karen').addEventListener('click', () => {
            btActiveBot = 'KAREN';
            el('bt-select-karen').classList.add('active');
            el('bt-select-aryan').classList.remove('active');
        });
        el('bt-select-aryan').addEventListener('click', () => {
            btActiveBot = 'ARYAN';
            el('bt-select-aryan').classList.add('active');
            el('bt-select-karen').classList.remove('active');
        });

        let btData = [];
        el('bt-file-upload').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target.result;
                const lines = text.split('\\n');
                btData = [];
                for (let i = 0; i < lines.length; i++) {
                    if (!lines[i].trim()) continue;
                    const parts = lines[i].split(',');
                    if (parts.length >= 2) {
                        let rawTime = parts[0].trim();
                        if (i === 0 && isNaN(parseFloat(parts[1].trim()))) continue;
                        
                        let ts = Number(rawTime);
                        if (isNaN(ts)) {
                            const match = rawTime.match(/^(\d{4})(\d{2})(\d{2})\s+(\d{2})(\d{2})(\d{2})(\d{3})?/);
                            if (match) {
                                ts = new Date(Date.UTC(match[1], match[2] - 1, match[3], match[4], match[5], match[6], match[7] || 0)).getTime();
                            } else {
                                ts = new Date(rawTime).getTime();
                            }
                        } else if (ts < 100000000000) {
                            ts *= 1000;
                        }
                        
                        let price = parseFloat(parts[parts.length > 4 ? 4 : 1].trim()); 
                        
                        if (!isNaN(ts) && !isNaN(price)) {
                            btData.push({ time: ts, price: price });
                        }
                    }
                }
                btData.sort((a, b) => a.time - b.time);
                el('bt-results').innerText = \`Loaded \${btData.length} tick records.\\nReady to optimize.\`;
            };
            reader.readAsText(file);
        });

        el('btn-run-backtest').addEventListener('click', async () => {
            if (btData.length === 0) {
                el('bt-results').innerText = 'Please upload CSV data first!';
                return;
            }
            el('bt-results').innerText = 'Building candles from tick data...';
            
            // Build 30s candles
            const candles = [];
            let currentCandle = null;
            for (let i = 0; i < btData.length; i++) {
                const t = btData[i];
                const period = Math.floor(t.time / 30000) * 30000;
                if (!currentCandle || currentCandle.time !== period) {
                    if (currentCandle) candles.push(currentCandle);
                    currentCandle = { time: period, open: t.price, high: t.price, low: t.price, close: t.price };
                } else {
                    currentCandle.high = Math.max(currentCandle.high, t.price);
                    currentCandle.low = Math.min(currentCandle.low, t.price);
                    currentCandle.close = t.price;
                }
            }
            if (currentCandle) candles.push(currentCandle);

            let candlestickSeries = null;
            try {
                const chartContainer = el('bt-chart-container');
                chartContainer.innerHTML = '';
                btChart = window.LightweightCharts.createChart(chartContainer, {
                    layout: { 
                        textColor: isDarkMode ? '#d1d5db' : '#374151', 
                        background: { type: 'solid', color: isDarkMode ? '#111827' : '#FFFFFF' } 
                    },
                    grid: { 
                        vertLines: { color: isDarkMode ? '#374151' : '#F3F4F6' }, 
                        horzLines: { color: isDarkMode ? '#374151' : '#F3F4F6' } 
                    },
                    localization: {
                        timeFormatter: (timestamp) => new Date(timestamp * 1000).toLocaleString()
                    },
                    timeScale: { 
                        timeVisible: true, 
                        secondsVisible: true,
                        tickMarkFormatter: (time) => new Date(time * 1000).toLocaleTimeString()
                    }
                });
                candlestickSeries = btChart.addCandlestickSeries({
                    upColor: '#10b981', downColor: '#ef4444', borderVisible: false, wickUpColor: '#10b981', wickDownColor: '#ef4444'
                });
                
                // Ensure unique times and sorted
                const uniqueCandles = [];
                let lastTime = 0;
                for (const c of candles) {
                    const t = Math.floor(c.time / 1000);
                    if (t > lastTime) {
                        uniqueCandles.push({ time: t, open: c.open, high: c.high, low: c.low, close: c.close });
                        lastTime = t;
                    }
                }
                
                candlestickSeries.setData(uniqueCandles);
                btChart.timeScale().fitContent();
            } catch (e) {
                console.error("Chart rendering error:", e);
            }

            const rsiP = parseInt(el('bt-rsi').value) || 14;
            const adxP = parseInt(el('bt-adx').value) || 14;

            const botCode = btActiveBot === 'KAREN' ? el('karen-code').value : el('aryan-code').value;

            el('bt-results').innerText = \`Running Test on \${candles.length} candles... Please wait.\`;

            // Yield to UI thread
            await new Promise(r => setTimeout(r, 50));

            const closes = candles.map(c => c.close);
            const macdData = calculateMACDFull(closes, 12, 26, 9);

            let result = runBacktest(candles, rsiP, adxP, botCode, macdData);

            let bestResult = { ...result, rsi: rsiP, adx: adxP };

            el('bt-results').innerText = 
                \`Test Complete!\\n\\n\` +
                \`Parameters Used:\\n\` +
                \`- RSI Period: \${bestResult.rsi}\\n\` +
                \`- ADX Period: \${bestResult.adx}\\n\\n\` +
                \`Performance:\\n\` +
                \`- Total Trades: \${bestResult.totalTrades} (\${bestResult.wins} W / \${bestResult.losses} L)\\n\` +
                \`- Overall Accuracy: \${bestResult.winRate.toFixed(2)}%\\n\` +
                \`- Buy Accuracy: \${bestResult.buyAcc}%\\n\` +
                \`- Sell Accuracy: \${bestResult.sellAcc}%\\n\` +
                \`- Est. Profit: $\${bestResult.profit.toFixed(2)}\\n\` +
                \`- Avg Trades/Day: \${bestResult.avgTradesPerDay} (Min: \${bestResult.minTradesDay}, Max: \${bestResult.maxTradesDay})\\n\`;

            if (candlestickSeries && bestResult.tradesList) {
                const markers = [];
                for (const t of bestResult.tradesList) {
                    markers.push({
                        time: Math.floor(t.time / 1000),
                        position: t.type === 'BUY' ? 'belowBar' : 'aboveBar',
                        color: t.isWin ? '#10b981' : '#ef4444',
                        shape: t.type === 'BUY' ? 'arrowUp' : 'arrowDown',
                        text: t.type + (t.isWin ? ' (W)' : ' (L)')
                    });
                }
                // Sort markers by time
                markers.sort((a, b) => a.time - b.time);
                
                // Ensure unique times for markers (lightweight-charts requires unique times per series)
                // If multiple trades happen at the same second, just keep the first one
                const uniqueMarkers = [];
                let lastMarkerTime = 0;
                for (const m of markers) {
                    if (m.time > lastMarkerTime) {
                        uniqueMarkers.push(m);
                        lastMarkerTime = m.time;
                    }
                }
                
                try {
                    candlestickSeries.setMarkers(uniqueMarkers);
                } catch (e) {
                    console.error("Failed to set markers:", e);
                }
            }
        });

        function runBacktest(candles, rsiP, adxP, botCode, macdData) {
            let profit = 0;
            let wins = 0;
            let losses = 0;
            let buyWins = 0;
            let buyLosses = 0;
            let sellWins = 0;
            let sellLosses = 0;
            let tradesByDay = {};
            let tradesList = [];
            let activeTrade = null; // { type: 'BUY'|'SELL', entryPrice: number, entryTime: number }

            const closes = candles.map(c => c.close);
            const rsis = calculateRSIFull(closes, rsiP);
            const adxs = calculateADXFull(candles, adxP);
            const { lines, signals, hists } = macdData;

            const botFunc = new Function('ctx', 'window', botCode);
            const fakeWindow = {};

            for (let i = Math.max(26, rsiP, adxP); i < candles.length; i++) {
                const c = candles[i];
                
                if (activeTrade) {
                    if (c.time - activeTrade.entryTime >= 600000) {
                        const dayStr = new Date(c.time).toISOString().split('T')[0];
                        tradesByDay[dayStr] = (tradesByDay[dayStr] || 0) + 1;
                        let isWin = false;

                        if (activeTrade.type === 'BUY') {
                            if (c.close > activeTrade.entryPrice) { wins++; buyWins++; profit += 0.85 * 10; isWin = true; }
                            else { losses++; buyLosses++; profit -= 10; }
                        } else {
                            if (c.close < activeTrade.entryPrice) { wins++; sellWins++; profit += 0.85 * 10; isWin = true; }
                            else { losses++; sellLosses++; profit -= 10; }
                        }
                        
                        tradesList.push({
                            time: activeTrade.entryTime,
                            type: activeTrade.type,
                            entryPrice: activeTrade.entryPrice,
                            exitPrice: c.close,
                            isWin: isWin
                        });
                        
                        activeTrade = null;
                    }
                }

                if (!activeTrade) {
                    let tradeExecuted = null;
                    const ctx = {
                        rsi: { current: rsis[i] },
                        macd: { line: lines[i], signal: signals[i], hist: hists[i] },
                        macdHistory: [
                            { line: lines[i], signal: signals[i], hist: hists[i] },
                            { line: lines[i-1], signal: signals[i-1], hist: hists[i-1] }
                        ],
                        adx: { current: adxs[i] },
                        signal: (s) => {},
                        log: () => {},
                        buy: () => { tradeExecuted = 'BUY'; },
                        sell: () => { tradeExecuted = 'SELL'; }
                    };

                    try {
                        botFunc(ctx, fakeWindow);
                    } catch (e) {}

                    if (tradeExecuted === 'BUY') {
                        activeTrade = { type: 'BUY', entryPrice: c.close, entryTime: c.time };
                    } else if (tradeExecuted === 'SELL') {
                        activeTrade = { type: 'SELL', entryPrice: c.close, entryTime: c.time };
                    }
                }
            }

            const totalTrades = wins + losses;
            const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
            
            const totalBuy = buyWins + buyLosses;
            const totalSell = sellWins + sellLosses;
            const buyAcc = totalBuy > 0 ? (buyWins / totalBuy * 100).toFixed(2) : 0;
            const sellAcc = totalSell > 0 ? (sellWins / totalSell * 100).toFixed(2) : 0;
            
            const days = Object.values(tradesByDay);
            const avgTradesPerDay = days.length > 0 ? (days.reduce((a,b)=>a+b,0) / days.length).toFixed(1) : 0;
            const maxTradesDay = days.length > 0 ? Math.max(...days) : 0;
            const minTradesDay = days.length > 0 ? Math.min(...days) : 0;

            return { 
                profit, winRate, totalTrades, wins, losses, 
                buyAcc, sellAcc, avgTradesPerDay, maxTradesDay, minTradesDay, tradesList
            };
        }

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
            el('btn-toggle').innerHTML = state.isRunning ? '■ STOP BOT' : '▶ START BOT';
            el('btn-toggle').style.background = state.isRunning ? '#EF4444' : '#111827';
            setSignal(state.isRunning ? 'WAIT' : 'PAUSED');
            addLog(state.isRunning ? \`\${state.activeBot} Started\` : \`\${state.activeBot} Stopped\`, 'info');
        });

        el('btn-deploy').addEventListener('click', injectCrosshairs);
        el('btn-buy').addEventListener('click', () => executeClick('BUY', 'TEST'));
        el('btn-sell').addEventListener('click', () => executeClick('SELL', 'TEST'));

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
            btn.style.background = '#10B981';
            btn.style.color = 'white';
            setTimeout(() => { 
                btn.innerText = 'Save Scripts'; 
                btn.style.background = '#F3F4F6';
                btn.style.color = '#374151';
            }, 2000);
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
            videoSource.src = localVideoUrl;
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
        const savedRsiP = localStorage.getItem('rsiP');
        if (savedRsiP) { el('inp-rsi-p').value = savedRsiP; state.rsiPeriod = parseInt(savedRsiP); }
        const savedAtrP = localStorage.getItem('atrP');
        if (savedAtrP) { el('inp-atr-p').value = savedAtrP; state.atrPeriod = parseInt(savedAtrP); }
        const savedAdxP = localStorage.getItem('adxP');
        if (savedAdxP) { el('inp-adx-p').value = savedAdxP; state.adxPeriod = parseInt(savedAdxP); }
        const savedSleep = localStorage.getItem('sleepMins');
        if (savedSleep) { el('inp-sleep').value = savedSleep; }

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
        el('inp-rsi-p').addEventListener('change', (e) => { 
            const val = parseInt(e.target.value) || 14;
            state.rsiPeriod = val; 
            localStorage.setItem('rsiP', val);
            forceRecalc(); 
        });
        el('inp-atr-p').addEventListener('change', (e) => { 
            const val = parseInt(e.target.value) || 14;
            state.atrPeriod = val; 
            localStorage.setItem('atrP', val);
            forceRecalc(); 
        });
        el('inp-adx-p').addEventListener('change', (e) => { 
            const val = parseInt(e.target.value) || 14;
            state.adxPeriod = val; 
            localStorage.setItem('adxP', val);
            forceRecalc(); 
        });
        el('inp-sleep').addEventListener('change', (e) => {
            const val = parseFloat(e.target.value) || 5;
            localStorage.setItem('sleepMins', val);
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
                    upColor: '#0ECB81', downColor: '#F6465D', borderDownColor: '#F6465D', borderUpColor: '#0ECB81', wickDownColor: '#F6465D', wickUpColor: '#0ECB81',
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
                tvMacdHist = tvMacdChart.addHistogramSeries({ color: '#0ECB81' });
                tvMacdLine = tvMacdChart.addLineSeries({ color: '#3B82F6', lineWidth: 2 });
                tvMacdSignal = tvMacdChart.addLineSeries({ color: '#F59E0B', lineWidth: 2 });

                const rsiContainer = el('tv-rsi');
                tvRsiChart = window.LightweightCharts.createChart(rsiContainer, {
                    width: rsiContainer.clientWidth,
                    height: 80,
                    layout: { background: { type: 'solid', color: '#FFFFFF' }, textColor: '#374151' },
                    grid: { vertLines: { color: '#F3F4F6' }, horzLines: { color: '#F3F4F6' } },
                    rightPriceScale: { borderColor: '#E5E7EB' },
                    localization: {
                        timeFormatter: (timestamp) => new Date(timestamp * 1000).toLocaleString()
                    },
                    timeScale: { visible: false },
                });
                tvRsiLine = tvRsiChart.addLineSeries({ color: '#8B5CF6', lineWidth: 2 });
                tvRsiLine.createPriceLine({ price: 70, color: '#F6465D', lineWidth: 1, lineStyle: 2 });
                tvRsiLine.createPriceLine({ price: 30, color: '#0ECB81', lineWidth: 1, lineStyle: 2 });

                const atrContainer = el('tv-atr');
                tvAtrChart = window.LightweightCharts.createChart(atrContainer, {
                    width: atrContainer.clientWidth,
                    height: 80,
                    layout: { background: { type: 'solid', color: '#FFFFFF' }, textColor: '#374151' },
                    grid: { vertLines: { color: '#F3F4F6' }, horzLines: { color: '#F3F4F6' } },
                    rightPriceScale: { borderColor: '#E5E7EB' },
                    localization: {
                        timeFormatter: (timestamp) => new Date(timestamp * 1000).toLocaleString()
                    },
                    timeScale: { visible: false },
                });
                tvAtrLine = tvAtrChart.addLineSeries({ 
                    color: '#10B981', 
                    lineWidth: 2,
                    priceFormat: { type: 'price', precision: 4, minMove: 0.0001 }
                });

                const adxContainer = el('tv-adx');
                tvAdxChart = window.LightweightCharts.createChart(adxContainer, {
                    width: adxContainer.clientWidth,
                    height: 80,
                    layout: { background: { type: 'solid', color: '#FFFFFF' }, textColor: '#374151' },
                    grid: { vertLines: { color: '#F3F4F6' }, horzLines: { color: '#F3F4F6' } },
                    rightPriceScale: { borderColor: '#E5E7EB' },
                    localization: {
                        timeFormatter: (timestamp) => new Date(timestamp * 1000).toLocaleString()
                    },
                    timeScale: { visible: false },
                });
                tvAdxLine = tvAdxChart.addLineSeries({ color: '#F43F5E', lineWidth: 2 });
                tvAdxLine.createPriceLine({ price: 25, color: '#3B82F6', lineWidth: 1, lineStyle: 2 });

                tvChart.timeScale().subscribeVisibleLogicalRangeChange(logicalRange => {
                    if (logicalRange) {
                        tvMacdChart.timeScale().setVisibleLogicalRange(logicalRange);
                        tvRsiChart.timeScale().setVisibleLogicalRange(logicalRange);
                        tvAtrChart.timeScale().setVisibleLogicalRange(logicalRange);
                        tvAdxChart.timeScale().setVisibleLogicalRange(logicalRange);
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
        addLog('UI Injected Successfully', 'info');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initUI);
    } else {
        initUI();
    }
}
`;

export default function App() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const downloadExtension = async () => {
    if (!videoFile) {
      alert("Please select your video.mp4 file first!");
      return;
    }
    setIsDownloading(true);
    try {
      const zip = new JSZip();
      zip.file("manifest.json", EXTENSION_MANIFEST);
      zip.file("loader.js", EXTENSION_LOADER_JS);
      zip.file("bot.js", EXTENSION_BOT_JS);
      zip.file("video.mp4", videoFile);
      zip.file("README.txt", "Your custom video has been automatically packaged as video.mp4!");
      
      const tvRes = await fetch('https://unpkg.com/lightweight-charts@4.1.1/dist/lightweight-charts.standalone.production.js');
      const tvCode = await tvRes.text();
      zip.file("tv.js", tvCode);
      
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "KAREN_ARYAN_FloatingApp_v6.9.zip");
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to package extension. Please check your internet connection.");
    }
    setIsDownloading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans flex flex-col items-center justify-center p-6">
      
      <div className="max-w-2xl w-full flex flex-col items-center text-center gap-8">
        <div className="w-24 h-24 bg-white border border-zinc-200 rounded-3xl flex items-center justify-center shadow-xl relative">
          <Sparkles className="w-6 h-6 text-pink-500 absolute -top-2 -right-2 animate-pulse" />
          <LayoutTemplate className="w-12 h-12 text-black" />
        </div>
        
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            KAREN & ARYAN <span className="text-zinc-400 font-normal">v6.9</span>
          </h1>
          <p className="text-lg text-zinc-500 max-w-lg mx-auto leading-relaxed">
            The ultimate trading duo! Now featuring Auto-Packaged Local Video and Permanent Script Saving!
          </p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-8 w-full text-left flex flex-col gap-6 shadow-sm">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Major Upgrades in v6.9</h3>
          
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
              <Film className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h4 className="font-bold text-zinc-900 text-lg">Auto-Package Video</h4>
              <p className="text-sm text-zinc-500 mt-1">Just select your video file below, and the app will automatically package it inside the ZIP for you! No need to manually extract, rename, or copy anything. Just download and load it into Kiwi Browser!</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
              <LayoutTemplate className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h4 className="font-bold text-zinc-900 text-lg">Permanent Script Saving</h4>
              <p className="text-sm text-zinc-500 mt-1">Added a "Save Scripts" button under the code editors! Now when you edit Karen or Aryan's logic and click save, the app will permanently remember your custom script even if you close and reopen it!</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-100 rounded-3xl p-6 w-full text-left shadow-sm mb-2">
          <h4 className="font-bold text-purple-900 mb-2 flex items-center gap-2">
            <Film className="w-5 h-5" />
            Step 1: Attach Your Video
          </h4>
          <p className="text-sm text-purple-700 mb-4">
            Select your John Wick video here. We will automatically package it inside the ZIP file so you don't have to extract anything!
          </p>
          <input
            type="file"
            accept="video/mp4"
            onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-purple-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-purple-600 file:text-white hover:file:bg-purple-700 cursor-pointer"
          />
        </div>

        <button 
          onClick={downloadExtension}
          disabled={isDownloading}
          className="flex items-center gap-3 px-8 py-4 bg-black hover:bg-zinc-800 disabled:bg-zinc-400 text-white rounded-2xl font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
        >
          {isDownloading ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Download className="w-6 h-6" />
          )}
          {isDownloading ? 'Packaging v6.9...' : 'Step 2: Download KAREN & ARYAN v6.9'}
        </button>

        <p className="text-sm text-zinc-500 mt-4 font-medium">
          Install in Kiwi Browser → Open Olymp Trade → Enjoy the Magic!
        </p>
      </div>

    </div>
  );
}
