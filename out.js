import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Download, LayoutTemplate, Sparkles, Film } from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
const EXTENSION_MANIFEST = JSON.stringify({
  "manifest_version": 3,
  "name": "KAREN & ARYAN Alarm v17.0",
  "version": "8.0",
  "description": "Trading Alarm with Hidden Charts (Iframe Jailbreak)",
  "permissions": ["storage", "declarativeNetRequest"],
  "host_permissions": ["*://*.olymptrade.com/*", "*://olymptrade.com/*"],
  "declarative_net_request": {
    "rule_resources": [{
      "id": "ruleset_1",
      "enabled": true,
      "path": "rules.json"
    }]
  },
  "content_scripts": [{
    "matches": ["*://*.olymptrade.com/*", "*://olymptrade.com/*"],
    "js": ["loader.js"],
    "run_at": "document_start",
    "all_frames": true
  }],
  "web_accessible_resources": [{
    "resources": ["bot.js", "tv.js", "video.mp4"],
    "matches": ["<all_urls>"]
  }]
}, null, 2);
const EXTENSION_LOADER_JS = "const s = document.createElement('script');\ns.src = chrome.runtime.getURL('bot.js');\ns.onload = function() { this.remove(); };\n(document.head || document.documentElement).appendChild(s);\n\n// Inject TV\nconst tv = document.createElement('script');\ntv.src = chrome.runtime.getURL('tv.js');\ntv.onload = function() { this.remove(); };\n(document.head || document.documentElement).appendChild(tv);\n\n// Pass extension URL to page\nconst meta = document.createElement('meta');\nmeta.name = 'karen-ext-url';\nmeta.content = chrome.runtime.getURL('');\n(document.head || document.documentElement).appendChild(meta);\n";
const EXTENSION_BOT_JS = `

// KAREN & ARYAN Floating App - bot.js
(function() {
if (!window.karenBotInjected) {
    window.karenBotInjected = true;
    console.log("KAREN & ARYAN Alarm Loaded v9.0 (document_start)");
    
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

    if (isIframe) {
        let autoAssetTarget = new URLSearchParams(window.location.search).get('autoAsset');
        let autoAssetStep = 0;

        function clickElementWithText(text) {
            if (!text) return false;
            const normalize = (str) => str.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            let targetNorm = normalize(text);
            
            if (targetNorm === 'btcusdotc') targetNorm = 'bitcoin';
            if (targetNorm === 'dogusdotc') targetNorm = 'dogecoin';
            
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
            let node;
            while (node = walker.nextNode()) {
                const val = node.nodeValue.trim();
                if (val) {
                    let valNorm = normalize(val);
                    if (valNorm === 'bitcoinotc') valNorm = 'bitcoin';
                    if (valNorm === 'dogecoinotc') valNorm = 'dogecoin';
                    
                    if (valNorm === targetNorm) {
                        let el = node.parentElement;
                        while (el && el !== document.body) {
                            el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
                            return true;
                        }
                    }
                }
            }
            return false;
        }

        if (autoAssetTarget) {
            setInterval(() => {
                if (autoAssetStep === 0) {
                    if (state.activeAsset === autoAssetTarget) {
                        autoAssetStep = 3; // Done
                        return;
                    }
                    
                    let clicked = false;
                    if (state.ignoredAssets && state.ignoredAssets.size > 0) {
                        let arr = Array.from(state.ignoredAssets);
                        let currentAsset = arr[arr.length - 1];
                        clicked = clickElementWithText(currentAsset);
                    }
                    
                    if (clicked) {
                        autoAssetStep = 1;
                    }
                } else if (autoAssetStep === 1) {
                    let clicked = clickElementWithText(autoAssetTarget);
                    if (clicked) {
                        autoAssetStep = 2;
                    } else {
                        autoAssetStep = 0; // Reset and try again
                    }
                } else if (autoAssetStep === 2) {
                    if (state.activeAsset === autoAssetTarget) {
                        autoAssetStep = 3; // Try clicking 1m timeframe
                    } else {
                        autoAssetStep = 1; // Try clicking target again
                    }
                } else if (autoAssetStep === 3) {
                    clickElementWithText('1m') || clickElementWithText('1min') || clickElementWithText('1 min');
                    autoAssetStep = 4; // Done
                }
            }, 1500);
        }
    }

    // New functionality: Ring and Vibrate
    window.ring = function(msg) {
        if (isIframe) {
            window.parent.postMessage({ type: 'KAREN_ALARM', asset: state.activeAsset, msg: msg }, '*');
            return;
        }
        console.log('KAREN: Ringing...');
        
        let finalMsg = msg || "ALARM TRIGGERED!";
        if (!finalMsg.startsWith('[')) {
            finalMsg = "[" + state.selectedAsset + "] " + finalMsg;
        }

        const audio = new Audio('https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg');
        audio.play().catch(e => console.log('Audio play blocked', e));
        showAlarmOverlay(finalMsg);
        
        // Send Telegram
        const globalToken = localStorage.getItem('tgGlobalToken');
        const globalChat = localStorage.getItem('tgGlobalChat');
        const localToken = localStorage.getItem('tgLocalToken');
        const localChat = localStorage.getItem('tgLocalChat');

        const sendTg = (token, chat) => {
            if (!token || !chat) return;
            fetch(\`https://api.telegram.org/bot\${token}/sendMessage\`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: chat, text: "\u{1F6A8} " + finalMsg })
            }).catch(e => console.error("Telegram Error:", e));
        };

        sendTg(globalToken, globalChat);
        sendTg(localToken, localChat);
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

    let alarmTimeout = null;
    function showAlarmOverlay(msg) {
        let overlay = document.getElementById('karen-alarm-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'karen-alarm-overlay';
            overlay.style.cssText = 'display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 999999999; justify-content: center; align-items: center; flex-direction: column; color: white; font-family: sans-serif;';
            
            const icon = document.createElement('div');
            icon.innerText = '\u{1F6A8}';
            icon.style.cssText = 'font-size: 100px; animation: pulse-alarm 1s infinite;';
            
            const text = document.createElement('div');
            text.id = 'karen-alarm-text';
            text.style.cssText = 'font-size: 36px; font-weight: 900; margin-top: 20px; text-align: center; letter-spacing: 2px;';
            
            const btn = document.createElement('button');
            btn.innerText = 'DISMISS ALARM';
            btn.style.cssText = 'margin-top: 40px; padding: 15px 40px; font-size: 20px; background: white; color: black; border: none; border-radius: 12px; cursor: pointer; font-weight: 900; letter-spacing: 1px; transition: transform 0.2s;';
            btn.onmouseover = () => btn.style.transform = 'scale(1.05)';
            btn.onmouseout = () => btn.style.transform = 'scale(1)';
            btn.onclick = () => { overlay.style.display = 'none'; if (alarmTimeout) clearTimeout(alarmTimeout); };
            
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
        
        if (alarmTimeout) clearTimeout(alarmTimeout);
        alarmTimeout = setTimeout(() => {
            if (overlay) overlay.style.display = 'none';
        }, 10000);
    }

    // --- 1. Math & Indicators (MACD Only) ---
    function calculateStochasticFull(candles, periodK = 14, smoothK = 3, periodD = 3) {
        if (candles.length < periodK) {
            return { k: candles.map(()=>50), d: candles.map(()=>50) };
        }
        let fastK = [];
        for (let i = 0; i < candles.length; i++) {
            if (i < periodK - 1) {
                fastK.push(50);
                continue;
            }
            let window = candles.slice(i - periodK + 1, i + 1);
            let highest = Math.max(...window.map(c => c.high));
            let lowest = Math.min(...window.map(c => c.low));
            let k = highest === lowest ? 50 : ((candles[i].close - lowest) / (highest - lowest)) * 100;
            fastK.push(k);
        }
        const sma = (arr, period) => {
            let res = [];
            for(let i=0; i<arr.length; i++) {
                if (i < period - 1) { res.push(arr[i]); continue; }
                let sum = 0;
                for(let j=0; j<period; j++) sum += arr[i-j];
                res.push(sum/period);
            }
            return res;
        };
        let slowK = sma(fastK, smoothK);
        let slowD = sma(slowK, periodD);
        return { k: slowK, d: slowD };
    }
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
        stoch: { k: 0, d: 0 },
        stochHistory: [],
        stochParams: { k: 14, sk: 3, d: 3 },
        lastCalcTime: 0,
        lastIndicatorCalcTime: 0,
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
    let tvStochChart = null, tvStochK = null, tvStochD = null;
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
            \`<div class="log-entry">
                <span class="log-time">[\${l.time}]</span>
                <span class="log-\${l.type}">\${l.msg}</span>
            </div>\`
        ).join('');
    }

    function setSignal(sig) {
        state.currentSignal = sig;
        const textEl = el('ui-signal-text-0');
        const spinnerEl = el('ui-signal-spinner-0');
        
        if (textEl) {
            textEl.innerText = sig;
        }
        
        if (spinnerEl) {
            if (!state.isRunning || sig.includes('WAIT') || sig === 'PAUSED' || sig === 'ERROR') {
                spinnerEl.className = 'signal-circle-spinner paused';
                spinnerEl.style.borderColor = '#E5E7EB';
                spinnerEl.style.borderTopColor = '#111827';
            } else if (sig.includes('DEFENCE')) {
                spinnerEl.className = 'signal-circle-spinner defence';
                spinnerEl.style.borderColor = '#FEF3C7';
                spinnerEl.style.borderTopColor = '#F59E0B';
            } else if (sig === 'NORMAL') {
                spinnerEl.className = 'signal-circle-spinner spinning';
                spinnerEl.style.borderColor = '#E5E7EB';
                spinnerEl.style.borderTopColor = '#111827';
            } else {
                spinnerEl.className = 'signal-circle-spinner spinning';
                if (sig === 'UP' || sig.includes('UPWARD')) {
                    spinnerEl.style.borderColor = '#DBEAFE'; // Pale Blue
                    spinnerEl.style.borderTopColor = '#3B82F6'; // Blue
                } else if (sig === 'DOWN' || sig.includes('DOWNWARD')) {
                    spinnerEl.style.borderColor = '#FCE7F3'; // Pale Pink
                    spinnerEl.style.borderTopColor = '#EC4899'; // Pink
                }
            }
        }
        if (isIframe) {
            window.parent.postMessage({
                type: 'KAREN_STATUS',
                asset: state.activeAsset,
                signal: sig,
                price: state.livePrice,
                macd: state.macd,
                stoch: state.stoch,
                candleCount: state.candles.length
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
                                                            btn.innerText = '\u25B6 START ALARM';
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
                                                const assetNameEl = el('ui-asset-name-main');
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
                                            processHistoricalCandle(item, isBatch);
                                        }
                                    });
                                    
                                    if (isBatch && state.activeAsset && hasOurAsset) {
                                        state.candles.sort((a, b) => a.time - b.time);
                                        state.candles = state.candles.filter((c, i, arr) => i === 0 || c.time > arr[i - 1].time);
                                        if (state.candles.length > 400) state.candles = state.candles.slice(-400);
                                        
                                        if (tvSeries) {
                                            try { tvSeries.setData(state.candles); } catch(e) {}
                                        }
                                        updateIndicators();
                                    }
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
                sessEl.innerText = \`\${m}:\${s}\`;
            }
        }
    }, 1000);

    // Signal Strength Logic
    setInterval(() => {
        updateIndicators();
    }, 5000);

    setInterval(() => {
        let bars = 5;
        if (!navigator.onLine) {
            bars = 0;
        } else if (navigator.connection) {
            const rtt = navigator.connection.rtt || 0;
            const downlink = navigator.connection.downlink || 10;
            if (rtt > 500 || downlink < 1) bars = 1;
            else if (rtt > 250 || downlink < 2) bars = 2;
            else if (rtt > 150 || downlink < 5) bars = 3;
            else if (rtt > 50 || downlink < 8) bars = 4;
            else bars = 5;
        } else {
            bars = Math.random() > 0.8 ? 4 : 5;
        }
        
        const container = el('ui-signal-bars');
        if (container) {
            const children = container.children;
            for (let i = 0; i < 5; i++) {
                if (i < bars) {
                    children[i].style.background = '#111827';
                } else {
                    children[i].style.background = '#D1D5DB';
                }
            }
        }
    }, 5000);

    // CPU/GPU/Temp Logic
    setInterval(() => {
        const cpuEl = el('ui-cpu-val');
        const gpuEl = el('ui-gpu-val');
        const tempEl = el('ui-temp-val');
        if (cpuEl) cpuEl.innerText = (30 + Math.random() * 20).toFixed(0) + '%';
        if (gpuEl) gpuEl.innerText = (20 + Math.random() * 30).toFixed(0) + '%';
        if (tempEl) tempEl.innerText = (40 + Math.random() * 15).toFixed(0) + '\xB0C';
    }, 2000);

    // RAM Usage Logic
    const tabRamHistory = [];
    const sysRamHistory = [];
    const maxRamHistory = 30;
    const totalDeviceRamGB = navigator.deviceMemory || 8;
    let simulatedSysRamMB = totalDeviceRamGB * 1024 * 0.6; // Start at 60% usage
    
    setInterval(() => {
        // 1. Tab RAM (Actual)
        let tabUsedMB = 0;
        if (performance && performance.memory) {
            tabUsedMB = performance.memory.usedJSHeapSize / (1024 * 1024);
        } else {
            const last = tabRamHistory.length > 0 ? tabRamHistory[tabRamHistory.length - 1] : 120;
            tabUsedMB = last + (Math.random() * 10 - 5);
            if (tabUsedMB < 50) tabUsedMB = 50;
        }
        
        tabRamHistory.push(tabUsedMB);
        if (tabRamHistory.length > maxRamHistory) tabRamHistory.shift();
        
        // 2. Sys RAM (Simulated)
        simulatedSysRamMB += (Math.random() * 100 - 50); // Fluctuate by +/- 50MB
        const maxSysMB = totalDeviceRamGB * 1024 * 0.95;
        const minSysMB = totalDeviceRamGB * 1024 * 0.3;
        if (simulatedSysRamMB > maxSysMB) simulatedSysRamMB = maxSysMB;
        if (simulatedSysRamMB < minSysMB) simulatedSysRamMB = minSysMB;
        
        sysRamHistory.push(simulatedSysRamMB);
        if (sysRamHistory.length > maxRamHistory) sysRamHistory.shift();
        
        // Draw Chart Function
        const drawChart = (canvasId, textId, history, isGB) => {
            const canvas = el(canvasId);
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            const w = canvas.width;
            const h = canvas.height;
            
            ctx.clearRect(0, 0, w, h);
            
            const maxVal = Math.max(...history, 100);
            const minVal = Math.max(0, Math.min(...history) - 50);
            const range = maxVal - minVal || 1;
            
            ctx.beginPath();
            ctx.moveTo(0, h);
            
            for (let i = 0; i < history.length; i++) {
                const x = (i / (maxRamHistory - 1)) * w;
                const y = h - (((history[i] - minVal) / range) * h);
                ctx.lineTo(x, y);
            }
            
            ctx.lineTo(w, h);
            ctx.closePath();
            
            ctx.fillStyle = '#E5E7EB';
            ctx.fill();
            
            ctx.beginPath();
            for (let i = 0; i < history.length; i++) {
                const x = (i / (maxRamHistory - 1)) * w;
                const y = h - (((history[i] - minVal) / range) * h);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1;
            ctx.stroke();
            
            const textEl = el(textId);
            if (textEl) {
                const currentVal = history[history.length - 1];
                if (isGB || currentVal > 1024) {
                    textEl.innerText = (currentVal / 1024).toFixed(2) + ' GB';
                } else {
                    textEl.innerText = currentVal.toFixed(0) + ' MB';
                }
            }
        };
        
        drawChart('ui-ram-canvas', 'ui-ram-text', tabRamHistory, false);
        drawChart('ui-sys-ram-canvas', 'ui-sys-ram-text', sysRamHistory, true);
    }, 2000);

    // --- 4. Core Logic & Custom Code Execution ---
    function formatPrice5Digits(price) {
        if (isNaN(price)) return "---";
        let s = price.toString();
        if (!s.includes('.')) s += '.0';
        let [intPart, decPart] = s.split('.');
        let totalDigits = intPart.length + decPart.length;
        if (totalDigits < 5) {
            decPart = decPart.padEnd(5 - intPart.length, '0');
        }
        return \`\${intPart}.\${decPart}\`;
    }

    function processTick(price) {
        state.livePrice = Number(price);
        if (isNaN(state.livePrice)) return;
        state.lastPriceTime = Date.now();
        
        const priceEl = el('ui-price');
        if (priceEl) {
            priceEl.innerText = formatPrice5Digits(state.livePrice);
        }
        
        const candleCountEl = el('ui-candle-count-0');
        if (candleCountEl) {
            candleCountEl.innerText = \`\${state.candles.length} Candles\`;
        }
        
        updateConnectionDot(true);
        
        
        let currentMinute = Math.floor(Date.now() / 60000) * 60; 
        if (state.candles.length > 0) {
            const lastTime = state.candles[state.candles.length - 1].time;
            if (currentMinute < lastTime) currentMinute = lastTime;
        }
        
        if (!state.currentCandle || state.currentCandle.time !== currentMinute) {
            if (state.currentCandle) {
                if (state.candles.length > 0 && state.candles[state.candles.length - 1].time === state.currentCandle.time) {
                    state.candles[state.candles.length - 1] = state.currentCandle;
                } else {
                    state.candles.push(state.currentCandle);
                }
                if (state.candles.length > 150) state.candles.shift();
            }
            state.currentCandle = { time: currentMinute, open: state.livePrice, high: state.livePrice, low: state.livePrice, close: state.livePrice };
        } else {
            state.currentCandle.close = state.livePrice;
            state.currentCandle.high = Math.max(state.currentCandle.high, state.livePrice);
            state.currentCandle.low = Math.min(state.currentCandle.low, state.livePrice);
        }
        
        if (tvSeries) {
            try { tvSeries.update(state.currentCandle); } catch(e) { console.error('tvSeries update error', e); }
        }
        if (isIframe) { window.parent.postMessage({ type: 'KAREN_STATUS', asset: state.activeAsset, signal: state.currentSignal, price: state.livePrice, macd: state.macd, candle: state.currentCandle, stoch: state.stoch, candleCount: state.candles.length }, '*'); }
    }

    function processHistoricalCandle(candleData, isBatch) {
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
                if (state.candles.length > 400) state.candles = state.candles.slice(-400);
                if (tvSeries) { try { tvSeries.setData(state.candles); } catch(e){} }
            }
        }
        
        if (!isBatch) {
            if (isIframe) { window.parent.postMessage({ type: 'KAREN_HISTORICAL', asset: state.activeAsset, candle: state.candles[state.candles.length-1] }, '*'); }
        }
    }

    function updateIndicators() {
        let allCandles = [...state.candles];
        if (state.currentCandle) {
            if (allCandles.length > 0 && allCandles[allCandles.length - 1].time === state.currentCandle.time) {
                allCandles[allCandles.length - 1] = state.currentCandle;
            } else {
                allCandles.push(state.currentCandle);
            }
        }
        
        // Ensure strictly ascending times
        allCandles = allCandles.filter((c, i, arr) => i === 0 || c.time > arr[i - 1].time);
        
        if (allCandles.length > 0) {
            const closes = allCandles.map(c => c.close);
            
            const { lines, signals, hists } = calculateMACDFull(closes, state.macdParams.fast, state.macdParams.slow, state.macdParams.sig);
            const stochData = calculateStochasticFull(allCandles, state.stochParams.k, state.stochParams.sk, state.stochParams.d);
            
            const curMacd = { line: lines[lines.length-1], signal: signals[signals.length-1], hist: hists[hists.length-1] };
            const curStoch = { k: stochData.k[stochData.k.length-1], d: stochData.d[stochData.d.length-1] };
            
            state.macd = curMacd;
            state.stoch = curStoch;
            
            // Swing High/Low Detection for MACD Memory
            if (lines.length >= 3) {
                    const prev2 = lines[lines.length - 3];
                    const prev1 = lines[lines.length - 2];
                    const curr = lines[lines.length - 1];
                    
                    if (prev1 > prev2 && prev1 > curr && prev1 > 0) {
                        // Swing High
                        if (!state.historicalHighs) state.historicalHighs = [];
                        if (!state.historicalHighs.includes(prev1)) {
                            state.historicalHighs.push(prev1);
                            if (state.historicalHighs.length > 500) state.historicalHighs.shift();
                        }
                    }
                    if (prev1 < prev2 && prev1 < curr && prev1 < 0) {
                        // Swing Low
                        if (!state.historicalLows) state.historicalLows = [];
                        if (!state.historicalLows.includes(prev1)) {
                            state.historicalLows.push(prev1);
                            if (state.historicalLows.length > 500) state.historicalLows.shift();
                        }
                    }
                }
                
                if (isIframe && state.fullRecalc) {
                    window.parent.postMessage({
                        type: 'KAREN_BATCH_HISTORICAL',
                        asset: state.activeAsset,
                        candles: allCandles,
                        macdLines: lines.map((v, i) => ({ time: allCandles[i].time, value: v })),
                        macdSignals: signals.map((v, i) => ({ time: allCandles[i].time, value: v })),
                        macdHists: hists.map((v, i) => ({ time: allCandles[i].time, value: v, color: v >= 0 ? '#111827' : '#9CA3AF' })),
                        stochKs: stochData.k.map((v, i) => ({ time: allCandles[i].time, value: v })),
                        stochDs: stochData.d.map((v, i) => ({ time: allCandles[i].time, value: v }))
                    }, '*');
                    state.fullRecalc = false;
                }

                // Update BOT LOGIC HISTORY
                state.macdHistory.unshift(curMacd);
                if (state.macdHistory.length > 400) state.macdHistory.pop();
                
                state.stochHistory.unshift(curStoch);
                if (state.stochHistory.length > 400) state.stochHistory.pop();
                
                const macdEl = el('ui-macd-val');
                if (macdEl) {
                    macdEl.innerText = \`\${state.macd.line.toFixed(2)} / \${state.macd.signal.toFixed(2)}\`;
                    macdEl.style.color = state.macd.line > state.macd.signal ? '#000000' : '#000000';
                }
                
                if (tvMacdLine) {
                    if (state.fullRecalc) {
                        tvMacdLine.setData(lines.map((v, i) => ({ time: allCandles[i].time, value: v })));
                        tvMacdSignal.setData(signals.map((v, i) => ({ time: allCandles[i].time, value: v })));
                        tvMacdHist.setData(hists.map((v, i) => ({ time: allCandles[i].time, value: v, color: v >= 0 ? '#111827' : '#9CA3AF' })));
                        
                        if (tvStochK) {
                            tvStochK.setData(stochData.k.map((v, i) => ({ time: allCandles[i].time, value: v })));
                            tvStochD.setData(stochData.d.map((v, i) => ({ time: allCandles[i].time, value: v })));
                        }
                        
                        state.fullRecalc = false;
                    } else {
                        const lastTime = allCandles[allCandles.length - 1].time;
                        try {
                            tvMacdLine.update({ time: lastTime, value: curMacd.line });
                            tvMacdSignal.update({ time: lastTime, value: curMacd.signal });
                            tvMacdHist.update({ time: lastTime, value: curMacd.hist, color: curMacd.hist >= 0 ? '#111827' : '#9CA3AF' });
                            
                            if (tvStochK) {
                                tvStochK.update({ time: lastTime, value: curStoch.k });
                                tvStochD.update({ time: lastTime, value: curStoch.d });
                            }
                        } catch(e) {
                            console.error('MACD update error', e);
                            state.fullRecalc = true; // Force recalc next time
                        }
                    }
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
            stoch: state.stoch,
            stochHistory: state.stochHistory,
            candles: state.candles,
            histState: state.histState,
            historicalHighs: state.historicalHighs || [],
            historicalLows: state.historicalLows || [],
            signal: (sig) => setSignal(sig),
            log: (msg, type) => addLog(msg, type),
            ring: (msg) => window.ring(msg),
            vibrate: (msg) => window.vibrate(msg),
            asset: state.activeAsset
        };

        try {
            let code = '';
            if (isIframe) {
                code = state.activeCode || '';
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
            addLog(\`Syntax Error: \${e.message}\`, 'error');
            setSignal('ERROR');
        }
    }

    // --- 7. UI INJECTION (Waits for DOM) ---
    function initUI() {
        console.log("DEBUG: initUI started");
        if (isIframe) {
            const overlay = document.createElement('div');
            overlay.style.cssText = 'position: fixed; top: 10px; left: 50%; transform: translateX(-50%); background: #3B82F6; color: white; padding: 10px 20px; border-radius: 20px; z-index: 999999; font-weight: bold; pointer-events: none; box-shadow: 0 4px 6px rgba(0,0,0,0.1); font-family: sans-serif;';
            overlay.innerText = '\u{1F446} Select an asset for this chart';
            document.body.appendChild(overlay);
            return; 
        }
        if (document.getElementById('karen-host')) {
            console.log("DEBUG: karen-host already exists");
            return;
        }

        const host = document.createElement('div');
        host.id = 'karen-host';
        host.style.cssText = 'position: fixed; z-index: 9999999; top: 20px; right: 20px;';
        document.body.appendChild(host);
        console.log("DEBUG: host appended");
        shadow = host.attachShadow({ mode: 'open' });
        console.log("DEBUG: shadow attached");
        shadow.innerHTML = \`
        <style>
          * { box-sizing: border-box; }
          :host { font-family: system-ui, -apple-system, sans-serif; }
          
          #minimized { display: none; align-items: center; gap: 8px; background: white; padding: 8px 16px; border-radius: 999px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: 1px solid #E5E7EB; cursor: move; user-select: none; touch-action: none; }
          .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #000000; box-shadow: 0 0 8px #000000; }
          .status-dot.disconnected { background: #9CA3AF; box-shadow: 0 0 8px #9CA3AF; }
          .expand-btn { background: #F3F4F6; border: none; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; cursor: pointer; margin-left: 8px; color: #4B5563; font-weight: bold; }
          
          #maximized { position: fixed; top: 0; left: 0; display: flex; width: 100vw; height: 93vh; max-width: 100vw; max-height: 93vh; background: #FAFAFA; border-radius: 0 0 12px 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-bottom: 1px solid #E5E7EB; flex-direction: column; overflow: hidden; }
          .header { background: white; padding: 12px 16px; border-bottom: 1px solid #E5E7EB; display: flex; justify-content: space-between; align-items: center; cursor: default; user-select: none; touch-action: none; }
          .header-title { font-weight: bold; font-size: 16px; display: flex; align-items: center; gap: 8px; color: #111827; }
          .collapse-btn { background: transparent; border: none; font-size: 20px; cursor: pointer; color: #6B7280; line-height: 1; }
          
          .content { padding: 12px; overflow-y: scroll; display: flex; flex-direction: column; gap: 12px; flex: 1; }
          
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
          .signal-circle-spinner.defence {
              animation: spin 3s linear infinite;
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
          .charts-grid { display: flex; flex-direction: column; gap: 8px; }
          :host(.fullscreen) #maximized { width: 100vw; height: 93vh; max-height: 93vh; border-radius: 0 0 12px 12px; border-bottom: 1px solid #E5E7EB; }
          :host(.fullscreen) .charts-grid { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 12px; height: 100%; }
          :host(.fullscreen) .content { max-height: calc(93vh - 50px); height: calc(93vh - 50px); }
          :host(.fullscreen) .tv-container { height: calc(100% - 120px); min-height: 200px; }
          :host(.fullscreen) .tv-container-small { height: 80px; }
          .chart-wrapper { display: flex; flex-direction: column; height: 100%; }
          
          :host(.dark) .card-title { color: #D1D5DB; }
          :host(.dark) .signal-circle-spinner { border-color: #374151; border-top-color: #F9FAFB; }
          :host(.dark) .signal-circle-text { color: #F9FAFB; }
        </style>

        <div id="minimized">
          <div class="status-dot disconnected" id="min-dot"></div>
          <span style="font-weight: 600; font-size: 13px; color: #111827;">KAREN & ARYAN</span>
          <button class="expand-btn" id="btn-expand">\u2197</button>
        </div>

        <div id="maximized">
          <div class="header" id="drag-header">
            <div class="header-title">
              <div class="status-dot disconnected" id="max-dot"></div>
              KAREN & ARYAN <span style="font-weight: normal; color: #9CA3AF; font-size: 12px;">v8.0</span>
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <button id="btn-theme" style="background: transparent; border: none; cursor: pointer; padding: 0; color: #6B7280;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
              </button>
              <button id="btn-music" style="background: transparent; border: none; cursor: pointer; padding: 0; color: #6B7280; margin-right: 20px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
              </button>
              <button class="collapse-btn" id="btn-collapse">\u2212</button>
            </div>
          </div>
          
          <div class="content">
            <div class="card">
              <div class="card-title" style="display: flex; justify-content: space-between;">
                <span>Live Data <span id="ui-asset-name">---</span></span>
                <span style="color: #000000; font-weight: bold; font-size: 14px; display: flex; align-items: center; gap: 4px;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span id="ui-session-time">00:00</span>
                </span>
              </div>
              <div style="display: flex; justify-content: space-around; align-items: center; padding: 10px 0;">                
                  <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                    <div style="font-size: 10px; font-weight: bold; color: #6B7280;">SIGNAL</div>
                    <div id="ui-signal-bars" style="display: flex; align-items: flex-end; gap: 4px; height: 30px;">
                      <div style="width: 6px; height: 6px; background: #111827; border-radius: 1px;"></div>
                      <div style="width: 6px; height: 12px; background: #111827; border-radius: 1px;"></div>
                      <div style="width: 6px; height: 18px; background: #111827; border-radius: 1px;"></div>
                      <div style="width: 6px; height: 24px; background: #D1D5DB; border-radius: 1px;"></div>
                      <div style="width: 6px; height: 30px; background: #D1D5DB; border-radius: 1px;"></div>
                    </div>
                  </div>
                  
                  <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                    <div style="font-size: 10px; font-weight: bold; color: #6B7280;">CPU</div>
                    <div id="ui-cpu-val" style="font-size: 16px; font-weight: bold;">--%</div>
                  </div>
                  <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                    <div style="font-size: 10px; font-weight: bold; color: #6B7280;">GPU</div>
                    <div id="ui-gpu-val" style="font-size: 16px; font-weight: bold;">--%</div>
                  </div>
                  <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                    <div style="font-size: 10px; font-weight: bold; color: #6B7280;">TEMP</div>
                    <div id="ui-temp-val" style="font-size: 16px; font-weight: bold;">--\xB0C</div>
                  </div>
                  
                  <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                    <div style="font-size: 10px; font-weight: bold; color: #6B7280;">RAM</div>
                    <div style="position: relative; width: 80px; height: 25px; border: 1px solid #E5E7EB; background: #FFF;">
                      <canvas id="ui-ram-canvas" width="80" height="25" style="display: block;"></canvas>
                      <div id="ui-ram-text" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 9px; font-weight: bold; color: #000; pointer-events: none;">--</div>
                    </div>
                  </div>
                  <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                    <div style="font-size: 10px; font-weight: bold; color: #6B7280;">SYS</div>
                    <div style="position: relative; width: 80px; height: 25px; border: 1px solid #E5E7EB; background: #FFF;">
                      <canvas id="ui-sys-ram-canvas" width="80" height="25" style="display: block;"></canvas>
                      <div id="ui-sys-ram-text" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 9px; font-weight: bold; color: #000; pointer-events: none;">--</div>
                    </div>
                  </div>
              </div>
            </div>
            
            <div class="charts-grid" id="charts-grid">
              <div class="card chart-wrapper" id="chart-wrapper-main">
                <div class="card-title">Main Chart (<span id="ui-asset-name-main">---</span>) <span id="ui-candle-count-0" style="float: right; font-size: 10px; color: #6B7280; font-weight: normal;">0 Candles</span></div>
                <div id="tv-chart" class="tv-container"></div>
                <div style="display: flex; gap: 8px; margin-top: 8px;">
                  <div style="flex: 1;">
                    <div class="card-title">MACD</div>
                    <div id="tv-macd" class="tv-container-small"></div>
                  </div>
                  <div style="flex: 1;">
                    <div class="card-title">STOCH</div>
                    <div id="tv-stoch" class="tv-container-small"></div>
                  </div>
                </div>
              </div>
              <div class="card chart-wrapper" id="chart-wrapper-1">
                <div class="card-title">Chart 2 (<span id="ui-asset-name-1">Setup Required</span>) <span id="ui-candle-count-1" style="float: right; font-size: 10px; color: #6B7280; font-weight: normal;">0 Candles</span></div>
                <div id="tv-chart-1" class="tv-container"></div>
                <div style="display: flex; gap: 8px; margin-top: 8px;">
                  <div style="flex: 1;">
                    <div class="card-title">MACD</div>
                    <div id="tv-macd-1" class="tv-container-small"></div>
                  </div>
                  <div style="flex: 1;">
                    <div class="card-title">STOCH</div>
                    <div id="tv-stoch-1" class="tv-container-small"></div>
                  </div>
                </div>
              </div>
              <div class="card chart-wrapper" id="chart-wrapper-2">
                <div class="card-title">Chart 3 (<span id="ui-asset-name-2">Setup Required</span>) <span id="ui-candle-count-2" style="float: right; font-size: 10px; color: #6B7280; font-weight: normal;">0 Candles</span></div>
                <div id="tv-chart-2" class="tv-container"></div>
                <div style="display: flex; gap: 8px; margin-top: 8px;">
                  <div style="flex: 1;">
                    <div class="card-title">MACD</div>
                    <div id="tv-macd-2" class="tv-container-small"></div>
                  </div>
                  <div style="flex: 1;">
                    <div class="card-title">STOCH</div>
                    <div id="tv-stoch-2" class="tv-container-small"></div>
                  </div>
                </div>
              </div>
              <div class="card chart-wrapper" id="chart-wrapper-3">
                <div class="card-title">Chart 4 (<span id="ui-asset-name-3">Setup Required</span>) <span id="ui-candle-count-3" style="float: right; font-size: 10px; color: #6B7280; font-weight: normal;">0 Candles</span></div>
                <div id="tv-chart-3" class="tv-container"></div>
                <div style="display: flex; gap: 8px; margin-top: 8px;">
                  <div style="flex: 1;">
                    <div class="card-title">MACD</div>
                    <div id="tv-macd-3" class="tv-container-small"></div>
                  </div>
                  <div style="flex: 1;">
                    <div class="card-title">STOCH</div>
                    <div id="tv-stoch-3" class="tv-container-small"></div>
                  </div>
                </div>
              </div>
            </div>

            <div class="card" style="display: flex; flex-direction: column; justify-content: center; align-items: center; margin-top: 8px;">
              <div class="card-title" style="width: 100%;">Alarm Status</div>
              <div style="display: flex; justify-content: space-around; width: 100%; flex-wrap: wrap; gap: 10px;">
                  <div style="display: flex; flex-direction: column; align-items: center;">
                      <div style="font-size: 10px; font-weight: bold; color: #6B7280; margin-bottom: 5px;">#Chart 1</div>
                      <div class="signal-circle-wrapper" style="width: 60px; height: 60px;">
                          <div class="signal-circle-spinner paused" id="ui-signal-spinner-0" style="border-width: 4px; animation-delay: 0s;"></div>
                          <div class="signal-circle-text" id="ui-signal-text-0" style="font-size: 10px;">PAUSED</div>
                      </div>
                  </div>
                  <div style="display: flex; flex-direction: column; align-items: center;">
                      <div style="font-size: 10px; font-weight: bold; color: #6B7280; margin-bottom: 5px;">#Chart 2</div>
                      <div class="signal-circle-wrapper" style="width: 60px; height: 60px;">
                          <div class="signal-circle-spinner paused" id="ui-signal-spinner-1" style="border-width: 4px; animation-delay: 0.2s;"></div>
                          <div class="signal-circle-text" id="ui-signal-text-1" style="font-size: 10px;">PAUSED</div>
                      </div>
                  </div>
                  <div style="display: flex; flex-direction: column; align-items: center;">
                      <div style="font-size: 10px; font-weight: bold; color: #6B7280; margin-bottom: 5px;">#Chart 3</div>
                      <div class="signal-circle-wrapper" style="width: 60px; height: 60px;">
                          <div class="signal-circle-spinner paused" id="ui-signal-spinner-2" style="border-width: 4px; animation-delay: 0.4s;"></div>
                          <div class="signal-circle-text" id="ui-signal-text-2" style="font-size: 10px;">PAUSED</div>
                      </div>
                  </div>
                  <div style="display: flex; flex-direction: column; align-items: center;">
                      <div style="font-size: 10px; font-weight: bold; color: #6B7280; margin-bottom: 5px;">#Chart 4</div>
                      <div class="signal-circle-wrapper" style="width: 60px; height: 60px;">
                          <div class="signal-circle-spinner paused" id="ui-signal-spinner-3" style="border-width: 4px; animation-delay: 0.6s;"></div>
                          <div class="signal-circle-text" id="ui-signal-text-3" style="font-size: 10px;">PAUSED</div>
                      </div>
                  </div>
              </div>
            </div>

            <div class="card" style="margin-top: 8px;">
              <div class="card-title" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center;" id="toggle-params">
                <span>Parameters</span> <span id="params-arrow">\u25BC</span>
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
                  <div style="font-size: 10px; color: #6B7280; font-weight: 600;">Stochastic (K, Smooth K, D)
                    <div style="display: flex; gap: 4px; margin-top: 4px;">
                      <input type="number" id="inp-stoch-k" value="14" class="cute-input" />
                      <input type="number" id="inp-stoch-sk" value="3" class="cute-input" />
                      <input type="number" id="inp-stoch-d" value="3" class="cute-input" />
                    </div>
                  </div>
                  <div style="font-size: 10px; color: #6B7280; font-weight: 600;">App Vertical Height
                    <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
                      <input type="range" id="inp-app-height" min="50" max="100" value="93" style="flex: 1; accent-color: #111827;" />
                      <span id="ui-app-height-val" style="font-size: 10px; font-weight: bold; color: #111827; width: 35px; text-align: right;">93%</span>
                    </div>
                  </div>
                </div>
                <div style="margin-top: 16px; border-top: 1px solid #E5E7EB; padding-top: 16px;">
                  <div style="font-size: 10px; color: #6B7280; font-weight: 600; margin-bottom: 8px;">MACD MEMORY DATA</div>
                  <div id="memory-data-list" style="display: flex; flex-direction: column; gap: 4px; max-height: 100px; overflow-y: auto; font-size: 10px; color: #374151;">
                    <!-- Memory items will be populated here -->
                  </div>
                  <div style="display: flex; gap: 4px; margin-top: 8px;">
                    <button id="btn-download-memory" class="btn btn-gray" style="flex: 1;">Download JSON</button>
                    <button id="btn-upload-memory" class="btn btn-gray" style="flex: 1;">Upload JSON</button>
                    <input type="file" id="inp-upload-memory" accept=".json" style="display: none;" />
                  </div>
                </div>
              </div>
            </div>
                
            <div class="card" style="display: flex; flex-direction: column; justify-content: center; align-items: center;">
              <div class="card-title" style="width: 100%; cursor: pointer; display: flex; justify-content: space-between; align-items: center;" id="toggle-telegram">
                <span>Telegram Settings</span> <span id="telegram-arrow">\u25BC</span>
              </div>
              <div id="telegram-container" style="display: none; flex-direction: column; width: 100%; gap: 8px; margin-top: 8px;">
                <div style="font-size: 10px; font-weight: bold; color: #6B7280;">GLOBAL BOT (All browsers)</div>
                <input type="text" id="tg-global-token" placeholder="Global Bot Token" class="cute-input" style="width: 100%;" />
                <input type="text" id="tg-global-chat" placeholder="Global Chat ID" class="cute-input" style="width: 100%;" />
                
                <div style="font-size: 10px; font-weight: bold; color: #6B7280; margin-top: 8px;">LOCAL BOT (This browser only)</div>
                <input type="text" id="tg-local-token" placeholder="Local Bot Token" class="cute-input" style="width: 100%;" />
                <input type="text" id="tg-local-chat" placeholder="Local Chat ID" class="cute-input" style="width: 100%;" />
                
                <div style="display: flex; gap: 8px; margin-top: 4px;">
                  <button class="btn btn-black" id="btn-save-tg" style="flex: 1; padding: 6px; font-size: 11px;">Save Telegram</button>
                  <button class="btn btn-black" id="btn-test-tg" style="flex: 1; padding: 6px; font-size: 11px; background: #DBEAFE; border-color: #DBEAFE; color: #000;">Test Telegram</button>
                </div>
              </div>
            </div>
            
            <div class="card">
              <div class="card-title" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center;" id="toggle-asset-bot">
                <span>Asset & Alarm Control</span> <span id="asset-bot-arrow">\u25BC</span>
              </div>
              <div id="asset-bot-container" style="display: none; margin-top: 8px;">
                <div style="margin-bottom: 8px;">
                  <select id="asset-select" class="cute-input" style="width: 100%;">
                    <option value="BTCUSD_OTC">BTC OTC</option>
                    <option value="DOGUSD_OTC">DOGE OTC</option>
                    <option value="EURUSD">EURUSD</option>
                    <option value="EURUSD_OTC">EURUSD OTC</option>
                    <option value="SOLUSD_OTC">SOL OTC</option>
                    <option value="XRPUSD_OTC">XRP OTC</option>
                    <option value="ETHUSD_OTC">ETH OTC</option>
                    <option value="LTCUSD_OTC">LTC OTC</option>
                    <option value="CRYPTO_X">CRYPTO IDX</option>
                    <option value="ASIA_X">ASIA IDX</option>
                    <option value="GBPUSD_OTC">GBPUSD OTC</option>
                    <option value="GBPUSD">GBPUSD</option>
                  </select>
                </div>
                <div class="bot-selector" style="margin-bottom: 8px;">
                  <button id="select-karen" class="active">KAREN</button>
                  <button id="select-aryan">ARYAN</button>
                </div>
                <button class="btn btn-black" id="btn-toggle" style="width: 100%; padding: 10px; margin-bottom: 8px;">\u25B6 START ALARM</button>
              </div>
            </div>

            <div class="card">
              <div class="card-title" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center;" id="toggle-scripts">
                <span>Modify Alarm Logic</span> <span id="scripts-arrow">\u25BC</span>
              </div>
              <div id="scripts-container" style="display: none; margin-top: 8px;">
                <div id="karen-code-container">
                  <div class="card-title"><span style="color: #111827;">KAREN's Logic</span></div>
                  <textarea id="karen-code" class="code-editor" spellcheck="false">
// === CONFIGURATION ===
const LOOKBACK = 400; // Change this to 350, 390, etc., for testing
const EXTREME_PERCENT = 0.90; // 90% of historical max/min (to enter Defence)
const RECOVERY_PERCENT = 0.80; // 80% of historical max/min (to exit Defence)

if (!ctx.candles || ctx.candles.length < 60) {
    ctx.signal("WAITING FOR DATA (" + (ctx.candles ? ctx.candles.length : 0) + "/60)");
    return;
}

// === DYNAMIC EXTREME CALCULATION ===
const historyLength = Math.min(ctx.macdHistory.length, LOOKBACK);
if (historyLength < 60) return;

// IMPORT MEMORY LOGIC
const memKey = 'KAREN_MACD_' + ctx.asset;
if (!window.karenState || !window.karenState.memoryLoaded) {
    window.karenState = window.karenState || {};
    const saved = localStorage.getItem(memKey);
    if (saved) {
        const parsed = JSON.parse(saved);
        window.karenState.savedHighs = parsed.highs || [];
        window.karenState.savedLows = parsed.lows || [];
        window.karenState.importTime = Date.now();
    } else {
        window.karenState.savedHighs = [];
        window.karenState.savedLows = [];
    }
    window.karenState.memoryLoaded = true;
}

if (window.karenState.importTime && Date.now() - window.karenState.importTime < 2000) {
    ctx.signal("IMPORTING");
    return; // Hold the IMPORTING signal for 2 seconds
}

// Mix current session highs/lows with saved highs/lows
const allHighs = [...new Set([...window.karenState.savedHighs, ...ctx.historicalHighs])];
const allLows = [...new Set([...window.karenState.savedLows, ...ctx.historicalLows])];

// Save back to memory if there are new ones
if (allHighs.length > window.karenState.savedHighs.length || allLows.length > window.karenState.savedLows.length) {
    window.karenState.savedHighs = allHighs;
    window.karenState.savedLows = allLows;
    localStorage.setItem(memKey, JSON.stringify({ highs: allHighs, lows: allLows }));
}

// Calculate max and min from all mixed highs and lows
let maxMacd = allHighs.length > 0 ? Math.max(...allHighs) : 10;
let minMacd = allLows.length > 0 ? Math.min(...allLows) : -10;

if (maxMacd < 10) maxMacd = 10;
if (minMacd > -10) minMacd = -10;

const upperExtreme = maxMacd * EXTREME_PERCENT;
const lowerExtreme = minMacd * EXTREME_PERCENT;
const upperRecovery = maxMacd * RECOVERY_PERCENT;
const lowerRecovery = minMacd * RECOVERY_PERCENT;

// === KAREN'S STATE ===
window.karenState.mode = window.karenState.mode || 'NORMAL';

const macdLine = ctx.macd.line;

// === 1. MODE TRANSITIONS & ALERTS ===
if (window.karenState.mode === 'NORMAL') {
    if (macdLine <= lowerExtreme) {
        window.karenState.mode = 'DEFENCE_DOWN';
        ctx.ring("\u{1F6A8} \u201E\u201E" + ctx.asset + "\u201E\u201E... MACD went under " + lowerExtreme.toFixed(2) + ". Entering DEFENCE DOWN.");
    } else if (macdLine >= upperExtreme) {
        window.karenState.mode = 'DEFENCE_UP';
        ctx.ring("\u{1F6A8} \u201E\u201E" + ctx.asset + "\u201E\u201E... MACD went over " + upperExtreme.toFixed(2) + ". Entering DEFENCE UP.");
    }
} else if (window.karenState.mode === 'DEFENCE_DOWN') {
    if (macdLine >= lowerRecovery) {
        window.karenState.mode = 'NORMAL';
        ctx.log("MACD recovered to " + lowerRecovery.toFixed(2) + ". Exiting DEFENCE DOWN.", "info");
    }
} else if (window.karenState.mode === 'DEFENCE_UP') {
    if (macdLine <= upperRecovery) {
        window.karenState.mode = 'NORMAL';
        ctx.log("MACD recovered to " + upperRecovery.toFixed(2) + ". Exiting DEFENCE UP.", "info");
    }
}

// === 2. UPDATE STATE & UI ===
if (window.karenState.mode === 'NORMAL') {
    ctx.signal("NORMAL");
} else if (window.karenState.mode === 'DEFENCE_DOWN') {
    ctx.signal("DEFENCE DOWN");
} else {
    ctx.signal("DEFENCE UP");
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
                <div style="display: flex; gap: 8px; margin-top: 8px;">
                  <button class="btn btn-gray" id="btn-save-scripts" style="flex: 1;">Save Scripts</button>
                  <button class="btn btn-black" id="btn-reset-scripts" style="flex: 1; background: #FCE7F3; border-color: #FCE7F3; color: #000;">Reset</button>
                </div>
              </div>
            </div>
            
            <div class="card" id="video-card" style="display: none;">
              <div class="card-title">Anti-Sleep Video</div>
              <video id="bg-video" loop playsinline style="width: 100%; border-radius: 8px; border: 1px solid #E5E7EB; margin-top: 8px;">
                <source id="bg-video-source" src="" type="video/mp4">
              </video>
            </div>

            <div class="card" id="multi-chart-card" style="margin-top: 8px;">
              <div class="card-title" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center;" id="toggle-multi-chart">
                <span>Multi-Chart Dashboard</span> <span id="multi-chart-arrow">\u25BC</span>
              </div>
              <div id="multi-chart-container" style="display: none; margin-top: 8px;">
                <div style="font-size: 11px; color: #6B7280; margin-bottom: 8px;">
                  Run up to 3 extra assets in the frontend.
                </div>
                <button class="btn btn-primary" id="btn-launch-server" style="width: 100%; margin-bottom: 8px;">Launch Server</button>
                <div id="asset-selector" style="display: none; flex-direction: column; gap: 8px; margin-bottom: 8px;">
                  <div style="font-size: 11px; color: #6B7280;">Select up to 3 assets:</div>
                  <div id="asset-list" style="display: flex; flex-direction: column; gap: 4px; max-height: 150px; overflow-y: auto; background: #F9FAFB; padding: 4px; border-radius: 4px; border: 1px solid #E5E7EB;"></div>
                  <button class="btn btn-primary" id="btn-launch-charts" style="width: 100%; background: #10B981;" disabled>Launch Charts</button>
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card-title" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center;" id="toggle-logs">
                <span>Execution Logs</span> <span id="logs-arrow">\u25BC</span>
              </div>
              <div class="logs" id="ui-logs" style="display: none;"></div>
            </div>

            <div id="iframe-grid" style="display: none; flex-direction: column; gap: 10px; margin-top: 10px;"></div>
          </div>
        </div>
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
        document.addEventListener('mousemove', onDragMove);
        document.addEventListener('mouseup', onDragEnd);
        el('minimized').addEventListener('touchstart', onDragStart, { passive: false });
        document.addEventListener('touchmove', onDragMove, { passive: false });
        document.addEventListener('touchend', onDragEnd);

        // Buttons
        el('btn-theme').addEventListener('click', () => {
            isDarkMode = !isDarkMode;
            if (isDarkMode) {
                shadow.host.classList.add('dark');
                if (tvChart) tvChart.applyOptions({ layout: { background: { type: 'solid', color: '#111827' }, textColor: '#D1D5DB' } });
                if (tvSeries) tvSeries.applyOptions({ upColor: '#F9FAFB', downColor: '#6B7280', borderDownColor: '#6B7280', borderUpColor: '#F9FAFB', wickDownColor: '#6B7280', wickUpColor: '#F9FAFB' });
                if (tvMacdChart) tvMacdChart.applyOptions({ layout: { background: { type: 'solid', color: '#111827' }, textColor: '#D1D5DB' } });
                if (tvMacdLine) tvMacdLine.applyOptions({ color: '#F9FAFB' });
                if (tvMacdSignal) tvMacdSignal.applyOptions({ color: '#6B7280' });
                if (window.multiCharts) {
                    Object.values(window.multiCharts).forEach(mc => {
                        mc.chart.applyOptions({ layout: { background: { type: 'solid', color: '#111827' }, textColor: '#D1D5DB' }, rightPriceScale: { borderColor: '#374151' } });
                        mc.series.applyOptions({ upColor: '#F9FAFB', downColor: '#6B7280', borderDownColor: '#6B7280', borderUpColor: '#F9FAFB', wickDownColor: '#6B7280', wickUpColor: '#F9FAFB' });
                        mc.macdChart.applyOptions({ layout: { background: { type: 'solid', color: '#111827' }, textColor: '#D1D5DB' } });
                        mc.macdLine.applyOptions({ color: '#F9FAFB' });
                        mc.macdSignal.applyOptions({ color: '#6B7280' });
                    });
                }
            } else {
                shadow.host.classList.remove('dark');
                if (tvChart) tvChart.applyOptions({ layout: { background: { type: 'solid', color: '#FFFFFF' }, textColor: '#374151' } });
                if (tvSeries) tvSeries.applyOptions({ upColor: '#111827', downColor: '#9CA3AF', borderDownColor: '#9CA3AF', borderUpColor: '#111827', wickDownColor: '#9CA3AF', wickUpColor: '#111827' });
                if (tvMacdChart) tvMacdChart.applyOptions({ layout: { background: { type: 'solid', color: '#FFFFFF' }, textColor: '#374151' } });
                if (tvMacdLine) tvMacdLine.applyOptions({ color: '#111827' });
                if (tvMacdSignal) tvMacdSignal.applyOptions({ color: '#9CA3AF' });
                if (window.multiCharts) {
                    Object.values(window.multiCharts).forEach(mc => {
                        mc.chart.applyOptions({ layout: { background: { type: 'solid', color: '#FFFFFF' }, textColor: '#374151' }, rightPriceScale: { borderColor: '#E5E7EB' } });
                        mc.series.applyOptions({ upColor: '#111827', downColor: '#9CA3AF', borderDownColor: '#9CA3AF', borderUpColor: '#111827', wickDownColor: '#9CA3AF', wickUpColor: '#111827' });
                        mc.macdChart.applyOptions({ layout: { background: { type: 'solid', color: '#FFFFFF' }, textColor: '#374151' } });
                        mc.macdLine.applyOptions({ color: '#111827' });
                        mc.macdSignal.applyOptions({ color: '#9CA3AF' });
                    });
                }
            }
        });
        el('btn-collapse').addEventListener('click', () => { el('maximized').style.display = 'none'; el('minimized').style.display = 'flex'; });
        
        el('btn-expand').addEventListener('click', () => { el('minimized').style.display = 'none'; el('maximized').style.display = 'flex'; });

        const assetSelect = el('asset-select');
        if (assetSelect) {
            assetSelect.value = state.selectedAsset;
            assetSelect.addEventListener('change', (e) => {
                if (state.isRunning) {
                    addLog('Cannot switch asset while bot is running!', 'error');
                    e.target.value = state.selectedAsset; // Revert
                    return;
                }
                state.selectedAsset = e.target.value;
                addLog('Asset switched to ' + e.target.options[e.target.selectedIndex].text, 'info');
            });
        }

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
                arrow.innerText = '\u25B2';
            } else {
                container.style.display = 'none';
                arrow.innerText = '\u25BC';
            }
        });

        el('toggle-scripts').addEventListener('click', () => {
            const container = el('scripts-container');
            const arrow = el('scripts-arrow');
            if (container.style.display === 'none') {
                container.style.display = 'block';
                arrow.innerText = '\u25B2';
            } else {
                container.style.display = 'none';
                arrow.innerText = '\u25BC';
            }
        });

        el('toggle-params').addEventListener('click', () => {
            const container = el('params-container');
            const arrow = el('params-arrow');
            if (container.style.display === 'none') {
                container.style.display = 'block';
                arrow.innerText = '\u25B2';
                
                // Populate Memory Data
                const memoryList = el('memory-data-list');
                if (memoryList) {
                    memoryList.innerHTML = '';
                    let hasData = false;
                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (key && key.startsWith('KAREN_MACD_')) {
                            hasData = true;
                            const assetName = key.replace('KAREN_MACD_', '');
                            const data = JSON.parse(localStorage.getItem(key));
                            const item = document.createElement('div');
                            item.style.display = 'flex';
                            item.style.justifyContent = 'space-between';
                            item.style.padding = '4px';
                            item.style.background = '#F9FAFB';
                            item.style.borderRadius = '4px';
                            item.innerHTML = \`<span>\${assetName}</span> <span>Max: \${data.max.toFixed(2)} | Min: \${data.min.toFixed(2)}</span>\`;
                            memoryList.appendChild(item);
                        }
                    }
                    if (!hasData) {
                        memoryList.innerHTML = '<div style="text-align: center; color: #9CA3AF; padding: 8px;">No memory data saved yet.</div>';
                    }
                }
            } else {
                container.style.display = 'none';
                arrow.innerText = '\u25BC';
            }
        });

        const btnDownloadMemory = el('btn-download-memory');
        if (btnDownloadMemory) {
            btnDownloadMemory.addEventListener('click', () => {
                const memoryData = {};
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith('KAREN_MACD_')) {
                        memoryData[key] = JSON.parse(localStorage.getItem(key));
                    }
                }
                const blob = new Blob([JSON.stringify(memoryData, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'karen_macd_memory.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            });
        }

        const btnUploadMemory = el('btn-upload-memory');
        const inpUploadMemory = el('inp-upload-memory');
        if (btnUploadMemory && inpUploadMemory) {
            btnUploadMemory.addEventListener('click', () => {
                inpUploadMemory.click();
            });
            inpUploadMemory.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const data = JSON.parse(event.target.result);
                        let count = 0;
                        for (const key in data) {
                            if (key.startsWith('KAREN_MACD_')) {
                                localStorage.setItem(key, JSON.stringify(data[key]));
                                count++;
                            }
                        }
                        addLog(\`Imported \${count} memory records!\`, 'info');
                        // Refresh the list if it's open
                        const container = el('params-container');
                        if (container && container.style.display === 'block') {
                            el('toggle-params').click();
                            setTimeout(() => el('toggle-params').click(), 50);
                        }
                    } catch (err) {
                        addLog('Failed to parse memory JSON', 'error');
                    }
                };
                reader.readAsText(file);
                e.target.value = '';
            });
        }

        el('toggle-telegram').addEventListener('click', () => {
            const container = el('telegram-container');
            const arrow = el('telegram-arrow');
            if (container.style.display === 'none') {
                container.style.display = 'flex';
                arrow.innerText = '\u25B2';
            } else {
                container.style.display = 'none';
                arrow.innerText = '\u25BC';
            }
        });

        el('toggle-multi-chart').addEventListener('click', () => {
            const container = el('multi-chart-container');
            const arrow = el('multi-chart-arrow');
            if (container.style.display === 'none') {
                container.style.display = 'block';
                arrow.innerText = '\u25B2';
            } else {
                container.style.display = 'none';
                arrow.innerText = '\u25BC';
            }
        });

        el('toggle-logs').addEventListener('click', () => {
            const container = el('ui-logs');
            const arrow = el('logs-arrow');
            if (container.style.display === 'none') {
                container.style.display = 'block';
                arrow.innerText = '\u25B2';
            } else {
                container.style.display = 'none';
                arrow.innerText = '\u25BC';
            }
        });

        el('btn-toggle').addEventListener('click', () => {
            state.isRunning = !state.isRunning;
            el('btn-toggle').innerHTML = state.isRunning ? '\u25A0 STOP ALARM' : '\u25B6 START ALARM';
            el('btn-toggle').style.background = state.isRunning ? '#111827' : '#111827';
            setSignal(state.isRunning ? 'WAIT' : 'PAUSED');
            addLog(state.isRunning ? \`\${state.activeBot} Started\` : \`\${state.activeBot} Stopped\`, 'info');
            
            if (state.isRunning) {
                evaluateLogic();
            }
            
            // Broadcast start/stop to all minion iframes
            const activeCode = state.activeBot === 'KAREN' ? el('karen-code').value : el('aryan-code').value;
            const iframes = shadow.querySelectorAll('#iframe-grid iframe');
            iframes.forEach(iframe => {
                iframe.contentWindow.postMessage({
                    type: 'KAREN_TOGGLE_BOT',
                    isRunning: state.isRunning,
                    code: activeCode
                }, '*');
            });
        });

        // Scripts Logic
        const karenCode = el('karen-code');
        const aryanCode = el('aryan-code');

        // Force load new default scripts for this update
        localStorage.removeItem('karenScript');
        // localStorage.removeItem('aryanScript');
        
        const savedKaren = localStorage.getItem('karenScript');
        if (savedKaren) karenCode.value = savedKaren;
        
        const savedAryan = localStorage.getItem('aryanScript');
        if (savedAryan) aryanCode.value = savedAryan;
        
        
        if (el('btn-reset-scripts')) {
            el('btn-reset-scripts').addEventListener('click', () => {
                localStorage.removeItem('karenScript');
                localStorage.removeItem('aryanScript');
                addLog('Scripts reset to default! Please reload the page.', 'info');
                setTimeout(() => window.location.reload(), 1500);
            });
        }

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

        const btnLaunchServer = el('btn-launch-server');
        const assetSelector = el('asset-selector');
        const assetList = el('asset-list');
        const btnLaunchCharts = el('btn-launch-charts');
        let selectedAssetsForMinions = [];

        if (btnLaunchServer) {
            btnLaunchServer.addEventListener('click', () => {
                btnLaunchServer.style.display = 'none';
                assetSelector.style.display = 'flex';
                
                assetList.innerHTML = '';
                const availableAssets = ['BTCUSD_OTC', 'DOGUSD_OTC', 'EURUSD', 'EURUSD_OTC', 'SOLUSD_OTC', 'XRPUSD_OTC', 'ETHUSD_OTC', 'LTCUSD_OTC', 'CRYPTO_X', 'ASIA_X', 'GBPUSD_OTC', 'GBPUSD'];
                
                if (availableAssets.length === 0) {
                    assetList.innerHTML = '<div style="font-size: 11px; color: #EF4444; padding: 4px;">No available assets found. Please wait for the engine to scan assets.</div>';
                    return;
                }

                availableAssets.forEach(asset => {
                    const label = document.createElement('label');
                    label.style.cssText = 'display: flex; align-items: center; gap: 8px; font-size: 12px; color: #374151; cursor: pointer; padding: 4px; border-radius: 4px;';
                    label.innerHTML = \`<input type="checkbox" value="\${asset}" class="asset-checkbox"> \${asset}\`;
                    
                    const checkbox = label.querySelector('input');
                    checkbox.addEventListener('change', () => {
                        if (checkbox.checked) {
                            if (selectedAssetsForMinions.length >= 3) {
                                checkbox.checked = false;
                                return;
                            }
                            selectedAssetsForMinions.push(asset);
                        } else {
                            selectedAssetsForMinions = selectedAssetsForMinions.filter(a => a !== asset);
                        }
                        
                        btnLaunchCharts.disabled = selectedAssetsForMinions.length === 0;
                        btnLaunchCharts.innerText = \`Launch Charts (\${selectedAssetsForMinions.length}/3)\`;
                    });
                    
                    assetList.appendChild(label);
                });
            });
        }

        if (btnLaunchCharts) {
            btnLaunchCharts.addEventListener('click', () => {
                assetSelector.style.display = 'none';
                const grid = el('iframe-grid');
                grid.innerHTML = '';
                grid.style.display = 'flex';
                
                const aryanCodeEl = el('aryan-code');
                if (aryanCodeEl) {
                    localStorage.setItem('aryanScript', aryanCodeEl.value);
                }
                
                selectedAssetsForMinions.forEach((asset, i) => {
                    const nameEl = el('ui-asset-name-' + (i + 1));
                    if (nameEl) nameEl.innerText = asset;
                    
                    if (window.minionCharts && window.minionCharts[i + 1]) {
                        window.minionCharts[i + 1].asset = asset;
                    }
                    
                    const container = document.createElement('div');
                    container.style.cssText = 'position: relative; width: 100%; margin-bottom: 15px;';
                    
                    const label = document.createElement('div');
                    label.style.cssText = 'position: absolute; top: -10px; left: 10px; background: #fff; padding: 0 8px; font-size: 12px; font-weight: bold; color: #374151; z-index: 2; border: 1px solid #E5E7EB; border-radius: 4px; display: flex; align-items: center; gap: 8px;';
                    
                    const labelText = document.createElement('span');
                    labelText.id = 'minion-label-text-' + (i + 1);
                    labelText.innerText = '#Chart ' + (i + 2) + ' (' + asset + ')';
                    label.appendChild(labelText);
                    
                    const changeBtn = document.createElement('button');
                    changeBtn.id = 'minion-change-btn-' + (i + 1);
                    changeBtn.innerText = 'Change Asset (Stale)';
                    changeBtn.style.cssText = 'font-size: 10px; padding: 2px 6px; background: #FEE2E2; color: #EF4444; border: 1px solid #EF4444; border-radius: 4px; cursor: pointer; display: none;';
                    changeBtn.onclick = () => {
                        const currentAsset = window.minionCharts[i + 1].asset || asset;
                        const newAsset = prompt('Server seems stale. Enter new asset name (e.g. BTCUSD_OTC):', currentAsset);
                        if (newAsset && newAsset !== currentAsset) {
                            iframe.src = window.location.origin + window.location.pathname + '?minion=' + (i + 1) + '&asset=' + encodeURIComponent(newAsset) + '&autoAsset=' + encodeURIComponent(newAsset) + '&running=' + state.isRunning;
                            labelText.innerText = '#Chart ' + (i + 2) + ' (' + newAsset + ')';
                            changeBtn.style.display = 'none';
                            window.minionLastUpdate = window.minionLastUpdate || {};
                            window.minionLastUpdate[i + 1] = Date.now();
                            window.minionCharts[i + 1].asset = newAsset;
                            const nameEl = el('ui-asset-name-' + (i + 1));
                            if (nameEl) nameEl.innerText = newAsset;
                        }
                    };
                    label.appendChild(changeBtn);
                    
                    const iframe = document.createElement('iframe');
                    iframe.src = window.location.origin + window.location.pathname + '?minion=' + (i + 1) + '&asset=' + encodeURIComponent(asset) + '&autoAsset=' + encodeURIComponent(asset) + '&running=' + state.isRunning;
                    iframe.style.cssText = 'position: relative; width: 100%; height: 300px; border: 1px solid #E5E7EB; border-radius: 8px; opacity: 1; pointer-events: auto; z-index: 1;';
                    iframe.id = 'minion-iframe-' + (i + 1);
                    
                    container.appendChild(label);
                    container.appendChild(iframe);
                    grid.appendChild(container);
                });
                
                const statusDiv = document.createElement('div');
                statusDiv.style.cssText = 'text-align: center; font-size: 12px; color: #10B981; font-weight: bold; margin-bottom: 8px;';
                statusDiv.innerText = 'Running in Frontend \u2705';
                el('multi-chart-card').appendChild(statusDiv);
            });
        }

        // Anti-Sleep Video Logic
        const video = el('bg-video');
        const videoSource = el('bg-video-source');
        const videoCard = el('video-card');
        const btnMusic = el('btn-music');
        let isVideoPlaying = false;

        // Load local video URL from loader.js
        const metaUrl = document.querySelector('meta[name="karen-ext-url"]');
        if (metaUrl && metaUrl.content) {
            video.src = metaUrl.content + 'video.mp4';
            video.load();
        } else {
            // Fallback to online video if extension attribute is missing
            video.src = 'https://www.w3schools.com/html/mov_bbb.mp4';
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
        const forceRecalc = () => { 
            state.lastCalcTime = 0; 
            state.fullRecalc = true; 
            updateIndicators(); 
            const iframes = shadow.querySelectorAll('#iframe-grid iframe');
            iframes.forEach(iframe => {
                iframe.contentWindow.postMessage({
                    type: 'KAREN_UPDATE_PARAMS',
                    macdParams: state.macdParams,
                    stochParams: state.stochParams
                }, '*');
            });
        };
        
        // Load saved parameters
        const savedMacdF = localStorage.getItem('macdF');
        if (savedMacdF) { el('inp-macd-f').value = savedMacdF; state.macdParams.fast = parseInt(savedMacdF); }
        const savedMacdS = localStorage.getItem('macdS');
        if (savedMacdS) { el('inp-macd-s').value = savedMacdS; state.macdParams.slow = parseInt(savedMacdS); }
        const savedMacdSig = localStorage.getItem('macdSig');
        if (savedMacdSig) { el('inp-macd-sig').value = savedMacdSig; state.macdParams.sig = parseInt(savedMacdSig); }

        const savedStochK = localStorage.getItem('stochK');
        if (savedStochK) { el('inp-stoch-k').value = savedStochK; state.stochParams.k = parseInt(savedStochK); }
        const savedStochSk = localStorage.getItem('stochSk');
        if (savedStochSk) { el('inp-stoch-sk').value = savedStochSk; state.stochParams.sk = parseInt(savedStochSk); }
        const savedStochD = localStorage.getItem('stochD');
        if (savedStochD) { el('inp-stoch-d').value = savedStochD; state.stochParams.d = parseInt(savedStochD); }

        const savedTgGlobalToken = localStorage.getItem('tgGlobalToken') || '';
        const savedTgGlobalChat = localStorage.getItem('tgGlobalChat') || '';
        const savedTgLocalToken = localStorage.getItem('tgLocalToken') || '';
        const savedTgLocalChat = localStorage.getItem('tgLocalChat') || '';

        if (el('tg-global-token')) el('tg-global-token').value = savedTgGlobalToken;
        if (el('tg-global-chat')) el('tg-global-chat').value = savedTgGlobalChat;
        if (el('tg-local-token')) el('tg-local-token').value = savedTgLocalToken;
        if (el('tg-local-chat')) el('tg-local-chat').value = savedTgLocalChat;

        if (el('btn-save-tg')) {
            el('btn-save-tg').addEventListener('click', () => {
                localStorage.setItem('tgGlobalToken', el('tg-global-token').value);
                localStorage.setItem('tgGlobalChat', el('tg-global-chat').value);
                localStorage.setItem('tgLocalToken', el('tg-local-token').value);
                localStorage.setItem('tgLocalChat', el('tg-local-chat').value);
                addLog('Telegram settings saved!', 'info');
            });
        }
        if (el('btn-test-tg')) {
            el('btn-test-tg').addEventListener('click', () => {
                const globalToken = el('tg-global-token').value;
                const globalChat = el('tg-global-chat').value;
                const localToken = el('tg-local-token').value;
                const localChat = el('tg-local-chat').value;
                
                const sendTg = (token, chat, type) => {
                    if (!token || !chat) return;
                    fetch(\`https://api.telegram.org/bot\${token}/sendMessage\`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ chat_id: chat, text: "\u2705 TEST MESSAGE from " + type + " BOT (" + state.selectedAsset + ")" })
                    }).then(res => {
                        if (res.ok) addLog(type + ' Telegram Test Sent!', 'info');
                        else addLog(type + ' Telegram Test Failed!', 'error');
                    }).catch(e => addLog(type + ' Telegram Error: ' + e.message, 'error'));
                };
                
                if (globalToken && globalChat) sendTg(globalToken, globalChat, "GLOBAL");
                if (localToken && localChat) sendTg(localToken, localChat, "LOCAL");
                if (!globalToken && !localToken) addLog('Please enter Telegram details first!', 'error');
            });
        }

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

        el('inp-stoch-k').addEventListener('change', (e) => { 
            const val = parseInt(e.target.value) || 14;
            state.stochParams.k = val; 
            localStorage.setItem('stochK', val);
            forceRecalc(); 
        });
        el('inp-stoch-sk').addEventListener('change', (e) => { 
            const val = parseInt(e.target.value) || 3;
            state.stochParams.sk = val; 
            localStorage.setItem('stochSk', val);
            forceRecalc(); 
        });
        el('inp-stoch-d').addEventListener('change', (e) => { 
            const val = parseInt(e.target.value) || 3;
            state.stochParams.d = val; 
            localStorage.setItem('stochD', val);
            forceRecalc(); 
        });

        const savedAppHeight = localStorage.getItem('appHeight');
        if (savedAppHeight) { 
            const h = parseInt(savedAppHeight);
            if (el('inp-app-height')) el('inp-app-height').value = h;
            if (el('ui-app-height-val')) el('ui-app-height-val').innerText = h + '%';
            if (el('maximized')) {
                el('maximized').style.height = h + 'vh';
                el('maximized').style.maxHeight = h + 'vh';
            }
        }

        if (el('inp-app-height')) {
            el('inp-app-height').addEventListener('input', (e) => {
                const val = parseInt(e.target.value) || 93;
                if (el('ui-app-height-val')) el('ui-app-height-val').innerText = val + '%';
                if (el('maximized')) {
                    el('maximized').style.height = val + 'vh';
                    el('maximized').style.maxHeight = val + 'vh';
                }
                localStorage.setItem('appHeight', val);
            });
        }

        // Init TV
        function initTradingView() {
            if (!window.LightweightCharts) {
                setTimeout(initTradingView, 500);
                return;
            }
            
            try {
                const resizeObserver = new ResizeObserver(entries => {
                    for (let entry of entries) {
                        const { width, height } = entry.contentRect;
                        if (entry.target.chartInstance) {
                            entry.target.chartInstance.applyOptions({ width, height });
                        }
                    }
                });

                // Initialize minionCharts
                window.minionCharts = {};
                for(let i=1; i<=3; i++) {
                    const cContainer = el('tv-chart-'+i);
                    const mContainer = el('tv-macd-'+i);
                    const sContainer = el('tv-stoch-'+i);
                    if (cContainer && mContainer && sContainer) {
                        const mChart = window.LightweightCharts.createChart(cContainer, {
                            width: cContainer.clientWidth,
                            height: cContainer.clientHeight || 180,
                            layout: { background: { type: 'solid', color: '#FFFFFF' }, textColor: '#374151' },
                            grid: { vertLines: { color: '#F3F4F6' }, horzLines: { color: '#F3F4F6' } },
                            crosshair: { mode: window.LightweightCharts.CrosshairMode.Normal },
                            rightPriceScale: { borderColor: '#E5E7EB' },
                            localization: { timeFormatter: (timestamp) => new Date(timestamp * 1000).toLocaleString() },
                            timeScale: { borderColor: '#E5E7EB', timeVisible: true, secondsVisible: false, tickMarkFormatter: (time) => new Date(time * 1000).toLocaleTimeString() },
                        });
                        cContainer.chartInstance = mChart;
                        resizeObserver.observe(cContainer);
                        
                        const mSeries = mChart.addCandlestickSeries({
                            upColor: '#111827', downColor: '#9CA3AF', borderDownColor: '#9CA3AF', borderUpColor: '#111827', wickDownColor: '#9CA3AF', wickUpColor: '#111827',
                        });
                        
                        const mMacdChart = window.LightweightCharts.createChart(mContainer, {
                            width: mContainer.clientWidth,
                            height: 80,
                            layout: { background: { type: 'solid', color: '#FFFFFF' }, textColor: '#374151' },
                            grid: { vertLines: { color: '#F3F4F6' }, horzLines: { color: '#F3F4F6' } },
                            rightPriceScale: { borderColor: '#E5E7EB' },
                            localization: { timeFormatter: (timestamp) => new Date(timestamp * 1000).toLocaleString() },
                            timeScale: { visible: false },
                        });
                        const mMacdHist = mMacdChart.addHistogramSeries({ color: '#111827' });
                        const mMacdLine = mMacdChart.addLineSeries({ color: '#111827', lineWidth: 2 });
                        const mMacdSignal = mMacdChart.addLineSeries({ color: '#9CA3AF', lineWidth: 2 });
                        mContainer.chartInstance = mMacdChart;
                        resizeObserver.observe(mContainer);
                        
                        const mStochChart = window.LightweightCharts.createChart(sContainer, {
                            width: sContainer.clientWidth,
                            height: 80,
                            layout: { background: { type: 'solid', color: '#FFFFFF' }, textColor: '#374151' },
                            grid: { vertLines: { color: '#F3F4F6' }, horzLines: { color: '#F3F4F6' } },
                            rightPriceScale: { borderColor: '#E5E7EB' },
                            localization: { timeFormatter: (timestamp) => new Date(timestamp * 1000).toLocaleString() },
                            timeScale: { visible: false },
                        });
                        const mStochK = mStochChart.addLineSeries({ color: '#3B82F6', lineWidth: 2 });
                        const mStochD = mStochChart.addLineSeries({ color: '#EF4444', lineWidth: 2 });
                        sContainer.chartInstance = mStochChart;
                        resizeObserver.observe(sContainer);
                        
                        mChart.timeScale().subscribeVisibleLogicalRangeChange(logicalRange => {
                            if (logicalRange) {
                                mMacdChart.timeScale().setVisibleLogicalRange(logicalRange);
                                mStochChart.timeScale().setVisibleLogicalRange(logicalRange);
                            }
                        });
                        
                        window.minionCharts[i] = {
                            asset: null,
                            chart: mChart,
                            series: mSeries,
                            macdChart: mMacdChart,
                            macdHist: mMacdHist,
                            macdLine: mMacdLine,
                            macdSignal: mMacdSignal,
                            stochChart: mStochChart,
                            stochK: mStochK,
                            stochD: mStochD
                        };
                    }
                }

                // LIGHT THEME CONFIG
                const chartContainer = el('tv-chart');
                tvChart = window.LightweightCharts.createChart(chartContainer, {
                    width: chartContainer.clientWidth,
                    height: chartContainer.clientHeight || 180,
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
                chartContainer.chartInstance = tvChart;
                resizeObserver.observe(chartContainer);

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
                macdContainer.chartInstance = tvMacdChart;
                resizeObserver.observe(macdContainer);

                const stochContainer = el('tv-stoch');
                tvStochChart = window.LightweightCharts.createChart(stochContainer, {
                    width: stochContainer.clientWidth,
                    height: 80,
                    layout: { background: { type: 'solid', color: '#FFFFFF' }, textColor: '#374151' },
                    grid: { vertLines: { color: '#F3F4F6' }, horzLines: { color: '#F3F4F6' } },
                    rightPriceScale: { borderColor: '#E5E7EB' },
                    localization: {
                        timeFormatter: (timestamp) => new Date(timestamp * 1000).toLocaleString()
                    },
                    timeScale: { visible: false },
                });
                tvStochK = tvStochChart.addLineSeries({ color: '#3B82F6', lineWidth: 2 });
                tvStochD = tvStochChart.addLineSeries({ color: '#EF4444', lineWidth: 2 });
                stochContainer.chartInstance = tvStochChart;
                resizeObserver.observe(stochContainer);

                tvChart.timeScale().subscribeVisibleLogicalRangeChange(logicalRange => {
                    if (logicalRange) {
                        tvMacdChart.timeScale().setVisibleLogicalRange(logicalRange);
                        tvStochChart.timeScale().setVisibleLogicalRange(logicalRange);
                    }
                });

                if (state.candles.length > 0) {
                    state.candles = state.candles.filter((c, i, arr) => i === 0 || c.time > arr[i - 1].time);
                    tvSeries.setData(state.candles);
                    state.fullRecalc = true;
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
        const isRunningParam = new URLSearchParams(window.location.search).get('running');
        state.isRunning = isRunningParam === 'true';
        setSignal(state.isRunning ? 'WAIT' : 'PAUSED');
    }
    
    window.addEventListener('message', (e) => {
        if (!e.data || !e.data.type) return;
        
        if (e.data.type === 'KAREN_TOGGLE_BOT') {
            if (isIframe) {
                state.isRunning = e.data.isRunning;
                if (e.data.code) state.activeCode = e.data.code;
                setSignal(state.isRunning ? 'WAIT' : 'PAUSED');
                addLog(state.isRunning ? \`Started via Master\` : \`Stopped via Master\`, 'info');
                if (state.isRunning) {
                    evaluateLogic();
                }
            }
        }
        else if (e.data.type === 'KAREN_UPDATE_PARAMS') {
            if (isIframe) {
                if (e.data.macdParams) state.macdParams = e.data.macdParams;
                if (e.data.stochParams) state.stochParams = e.data.stochParams;
                state.lastCalcTime = 0;
                state.fullRecalc = true;
                updateIndicators();
            }
        }
    });

    if (!isIframe) {
        window.minionLastUpdate = window.minionLastUpdate || {};
        
        // Security Guard Logic
        window.history.pushState({ page: 1 }, "", "");
        window.history.pushState({ page: 2 }, "", "");

        window.addEventListener('popstate', (e) => {
            if (state.isRunning) {
                window.history.pushState({ page: 2 }, "", ""); // Stay on page
                showSecurityGuard();
            }
        });

        function showSecurityGuard() {
            if (document.getElementById('security-guard-overlay')) return;
            
            const overlay = document.createElement('div');
            overlay.id = 'security-guard-overlay';
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.95)';
            overlay.style.zIndex = '10000';
            overlay.style.display = 'flex';
            overlay.style.flexDirection = 'column';
            overlay.style.alignItems = 'center';
            overlay.style.justifyContent = 'center';
            overlay.style.color = 'white';
            overlay.style.fontFamily = 'monospace';

            const digits = [Math.floor(Math.random() * 10), Math.floor(Math.random() * 10), Math.floor(Math.random() * 10)];
            const shuffled = [...digits].sort(() => Math.random() - 0.5);
            let currentIndex = 0;

            const title = document.createElement('h2');
            title.innerText = 'SECURITY GUARD';
            title.style.color = '#EF4444';
            title.style.marginBottom = '10px';
            
            const desc = document.createElement('p');
            desc.innerText = \`To exit, tap these numbers in order:\\n\\n\${digits.join('  -  ')}\`;
            desc.style.textAlign = 'center';
            desc.style.marginBottom = '40px';
            desc.style.fontSize = '18px';

            const btnContainer = document.createElement('div');
            btnContainer.style.display = 'flex';
            btnContainer.style.gap = '15px';

            shuffled.forEach(num => {
                const btn = document.createElement('button');
                btn.innerText = num;
                btn.style.padding = '20px 30px';
                btn.style.fontSize = '24px';
                btn.style.background = '#1F2937';
                btn.style.color = 'white';
                btn.style.border = '2px solid #374151';
                btn.style.borderRadius = '8px';
                btn.style.cursor = 'pointer';
                
                btn.onclick = () => {
                    if (num === digits[currentIndex]) {
                        btn.style.background = '#10B981';
                        btn.style.borderColor = '#059669';
                        currentIndex++;
                        if (currentIndex === 3) {
                            state.isRunning = false;
                            document.body.removeChild(overlay);
                            window.history.back();
                        }
                    } else {
                        btn.style.background = '#EF4444';
                        btn.style.borderColor = '#DC2626';
                        setTimeout(() => {
                            document.body.removeChild(overlay);
                            showSecurityGuard(); // Reset
                        }, 500);
                    }
                };
                btnContainer.appendChild(btn);
            });

            const cancelBtn = document.createElement('button');
            cancelBtn.innerText = 'CANCEL';
            cancelBtn.style.marginTop = '40px';
            cancelBtn.style.padding = '10px 20px';
            cancelBtn.style.background = 'transparent';
            cancelBtn.style.color = '#9CA3AF';
            cancelBtn.style.border = 'none';
            cancelBtn.style.cursor = 'pointer';
            cancelBtn.onclick = () => {
                document.body.removeChild(overlay);
            };

            overlay.appendChild(title);
            overlay.appendChild(desc);
            overlay.appendChild(btnContainer);
            overlay.appendChild(cancelBtn);
            document.body.appendChild(overlay);
        }
        
        // Listen for messages from Headless Iframes
        window.addEventListener('message', (e) => {
            if (!e.data || !e.data.type) return;
            
            const asset = e.data.asset;
            if (asset) {
                const idx = getMinionIndexForAsset(asset);
                if (idx) {
                    window.minionLastUpdate[idx] = Date.now();
                    const changeBtn = el('minion-change-btn-' + idx);
                    if (changeBtn) changeBtn.style.display = 'none';
                }
            }
            
            if (e.data.type === 'KAREN_LOG') {
                addLog('[' + e.data.asset + '] ' + e.data.msg, e.data.logType);
            }
            else if (e.data.type === 'KAREN_ALARM') {
                window.ring('[' + e.data.asset + '] ' + e.data.msg);
                window.vibrate('[' + e.data.asset + '] ' + e.data.msg);
                addLog('[' + e.data.asset + '] ALARM TRIGGERED: ' + e.data.msg, 'custom');
            }
            else if (e.data.type === 'KAREN_HISTORICAL') { updateMultiChartHistorical(e.data.asset, e.data.candle); }
            else if (e.data.type === 'KAREN_BATCH_HISTORICAL') { updateMultiChartBatch(e.data.asset, e.data); }
            else if (e.data.type === 'KAREN_STATUS') {
                updateMultiChartStatus(e.data.asset, e.data.signal, e.data.price, e.data.macd, e.data.candle, e.data.stoch);
            }
        });
        
        setInterval(() => {
            for (let i = 1; i <= 3; i++) {
                if (window.minionCharts && window.minionCharts[i] && window.minionCharts[i].asset) {
                    const lastUpdate = window.minionLastUpdate[i] || 0;
                    if (Date.now() - lastUpdate > 5 * 60 * 1000) { // 5 minutes
                        const changeBtn = el('minion-change-btn-' + i);
                        if (changeBtn) changeBtn.style.display = 'inline-block';
                    }
                }
            }
        }, 10000);
    } else {
        console.log("KAREN BOT: Running in Headless Mode for iframe");
        addLog("Headless Bot Started", "info");
    }
    
    function getMinionIndexForAsset(asset) {
        if (!window.minionCharts) return null;
        for(let i=1; i<=3; i++) {
            if (window.minionCharts[i] && window.minionCharts[i].asset === asset) return i;
        }
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

    function updateMultiChartBatch(asset, data) {
        const idx = getMinionIndexForAsset(asset);
        if (!idx) return;
        const mc = window.minionCharts[idx];
        if (mc) {
            if (mc.series && data.candles) mc.series.setData(data.candles);
            if (mc.macdLine && data.macdLines) mc.macdLine.setData(data.macdLines);
            if (mc.macdSignal && data.macdSignals) mc.macdSignal.setData(data.macdSignals);
            if (mc.macdHist && data.macdHists) mc.macdHist.setData(data.macdHists);
            if (mc.stochK && data.stochKs) mc.stochK.setData(data.stochKs);
            if (mc.stochD && data.stochDs) mc.stochD.setData(data.stochDs);
        }
    }

    function updateMultiChartStatus(asset, signal, price, macd, candle, stoch, candleCount) {
        if (!asset) return;
        const idx = getMinionIndexForAsset(asset);
        if (!idx) return;
        
        const textEl = el('ui-signal-text-' + idx);
        const spinnerEl = el('ui-signal-spinner-' + idx);
        const priceEl = el('ui-price-m' + idx);
        const candleCountEl = el('ui-candle-count-' + idx);
        
        if (textEl && signal) {
            textEl.innerText = signal;
        }
        
        if (priceEl && price) {
            priceEl.innerText = \`C\${idx + 1}: \${formatPrice5Digits(price)}\`;
        }
        
        if (candleCountEl && candleCount !== undefined) {
            candleCountEl.innerText = \`\${candleCount} Candles\`;
        }
        
        if (spinnerEl && signal) {
            if (!state.isRunning || signal.includes('WAIT') || signal === 'PAUSED' || signal === 'ERROR') {
                spinnerEl.className = 'signal-circle-spinner paused';
                spinnerEl.style.borderColor = '#E5E7EB';
                spinnerEl.style.borderTopColor = '#111827';
            } else if (signal.includes('DEFENCE')) {
                spinnerEl.className = 'signal-circle-spinner defence';
                spinnerEl.style.borderColor = '#FEF3C7';
                spinnerEl.style.borderTopColor = '#F59E0B';
            } else if (signal === 'NORMAL') {
                spinnerEl.className = 'signal-circle-spinner spinning';
                spinnerEl.style.borderColor = '#E5E7EB';
                spinnerEl.style.borderTopColor = '#111827';
            } else {
                spinnerEl.className = 'signal-circle-spinner spinning';
                if (signal === 'UP' || signal.includes('UPWARD')) {
                    spinnerEl.style.borderColor = '#DBEAFE'; // Pale Blue
                    spinnerEl.style.borderTopColor = '#3B82F6'; // Blue
                } else if (signal === 'DOWN' || signal.includes('DOWNWARD')) {
                    spinnerEl.style.borderColor = '#FCE7F3'; // Pale Pink
                    spinnerEl.style.borderTopColor = '#EC4899'; // Pink
                }
            }
        }

        const mc = window.minionCharts[idx];
        if (mc) {
            if (candle && mc.series) {
                mc.series.update(candle);
            }
            if (macd && mc.macdHist && mc.macdLine && mc.macdSignal) {
                const time = candle ? candle.time : Math.floor(Date.now() / 1000);
                try {
                    mc.macdHist.update({ time: time, value: macd.hist, color: macd.hist >= 0 ? '#111827' : '#9CA3AF' });
                    mc.macdLine.update({ time: time, value: macd.line });
                    mc.macdSignal.update({ time: time, value: macd.signal });
                } catch (e) {
                    console.error("MACD update error:", e);
                }
            }
            if (stoch && mc.stochK && mc.stochD) {
                const time = candle ? candle.time : Math.floor(Date.now() / 1000);
                try {
                    mc.stochK.update({ time: time, value: stoch.k });
                    mc.stochD.update({ time: time, value: stoch.d });
                } catch (e) {
                    console.error('Stoch update error in minion', e);
                }
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
`;
export default function App() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [videoData, setVideoData] = useState(null);
  const [isReadingVideo, setIsReadingVideo] = useState(false);
  const handleVideoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setVideoData(null);
      return;
    }
    setIsReadingVideo(true);
    try {
      const buffer = await file.arrayBuffer();
      setVideoData({ buffer, name: file.name });
    } catch (err) {
      console.error("Video read error:", err);
      alert("Failed to read video file. Please try again or select a different file.");
      setVideoData(null);
    }
    setIsReadingVideo(false);
  };
  const downloadExtension = async () => {
    if (!videoData) {
      alert("Please select your video.mp4 and wait for it to load!");
      return;
    }
    setIsDownloading(true);
    try {
      const zip = new JSZip();
      zip.file("manifest.json", EXTENSION_MANIFEST);
      zip.file("rules.json", `[
  {
    "id": 1,
    "priority": 1,
    "action": {
      "type": "modifyHeaders",
      "responseHeaders": [
        { "header": "x-frame-options", "operation": "remove" },
        { "header": "content-security-policy", "operation": "remove" }
      ]
    },
    "condition": {
      "urlFilter": "olymptrade.com",
      "resourceTypes": ["sub_frame", "main_frame", "xmlhttprequest", "websocket"]
    }
  }
]`);
      zip.file("loader.js", EXTENSION_LOADER_JS);
      zip.file("bot.js", EXTENSION_BOT_JS);
      zip.file("video.mp4", videoData.buffer);
      zip.file("README.txt", "Your custom video has been automatically packaged!");
      const tvRes = await fetch("https://unpkg.com/lightweight-charts@4.1.1/dist/lightweight-charts.standalone.production.js");
      const tvCode = await tvRes.text();
      zip.file("tv.js", tvCode);
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "KAREN_ARYAN_Alarm_v17.0.zip");
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to package extension: " + (error instanceof Error ? error.message : String(error)));
    }
    setIsDownloading(false);
  };
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-zinc-50 text-zinc-900 font-sans flex flex-col items-center justify-center p-6", children: /* @__PURE__ */ jsxs("div", { className: "max-w-2xl w-full flex flex-col items-center text-center gap-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "w-24 h-24 bg-white border border-zinc-200 rounded-3xl flex items-center justify-center shadow-xl relative", children: [
      /* @__PURE__ */ jsx(Sparkles, { className: "w-6 h-6 text-pink-500 absolute -top-2 -right-2 animate-pulse" }),
      /* @__PURE__ */ jsx(LayoutTemplate, { className: "w-12 h-12 text-black" })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs("h1", { className: "text-4xl font-bold tracking-tight mb-4", children: [
        "KAREN\u{1F338} & ARYAN\u26A1 ",
        /* @__PURE__ */ jsx("span", { className: "text-zinc-400 font-normal", children: "v17.0" })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-lg text-zinc-500 max-w-lg mx-auto leading-relaxed", children: "The ultimate trading ALARM! Now featuring a clean black-and-white UI, MACD-only logic, and big notifications!" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-white border border-zinc-200 rounded-3xl p-8 w-full text-left flex flex-col gap-6 shadow-sm", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2", children: "Major Upgrades in v17.0" }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4", children: [
        /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(Sparkles, { className: "w-5 h-5 text-purple-600" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h4", { className: "font-bold text-zinc-900 text-lg", children: "Alarm Mode" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-zinc-500 mt-1", children: "Removed auto-trading and backtesting. The app now acts as a pure alarm, ringing and vibrating with a big notification when your strategy conditions are met!" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4", children: [
        /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(LayoutTemplate, { className: "w-5 h-5 text-emerald-600" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h4", { className: "font-bold text-zinc-900 text-lg", children: "Clean UI & Circle Signal" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-zinc-500 mt-1", children: "Simplified the interface to a sleek black-and-white design. The signal is now a beautiful spinning circle that pauses when waiting for conditions." })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-purple-50 border border-purple-100 rounded-3xl p-6 w-full text-left shadow-sm mb-2", children: [
      /* @__PURE__ */ jsxs("h4", { className: "font-bold text-purple-900 mb-2 flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Film, { className: "w-5 h-5" }),
        "Step 1: Attach Your Video"
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-purple-700 mb-4", children: "Select your John Wick video here. We will automatically package it inside the ZIP file!" }),
      /* @__PURE__ */ jsx("div", { className: "space-y-4", children: /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("label", { className: "block text-xs font-bold text-purple-800 mb-1", children: [
          "Video File (mp4) ",
          isReadingVideo && /* @__PURE__ */ jsx("span", { className: "text-purple-500 animate-pulse ml-2", children: "Reading..." })
        ] }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "file",
            accept: "video/mp4",
            onChange: handleVideoChange,
            className: "block w-full text-sm text-purple-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-purple-600 file:text-white hover:file:bg-purple-700 cursor-pointer"
          }
        ),
        videoData && /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-purple-600 mt-1", children: [
          "\u2713 ",
          videoData.name,
          " loaded"
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: downloadExtension,
        disabled: isDownloading || isReadingVideo,
        className: "flex items-center gap-3 px-8 py-4 bg-black hover:bg-zinc-800 disabled:bg-zinc-400 text-white rounded-2xl font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-1",
        children: [
          isDownloading ? /* @__PURE__ */ jsx("div", { className: "w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" }) : /* @__PURE__ */ jsx(Download, { className: "w-6 h-6" }),
          isDownloading ? "Packaging v17.0..." : "Step 2: Download KAREN & ARYAN v17.0"
        ]
      }
    ),
    /* @__PURE__ */ jsx("p", { className: "text-sm text-zinc-500 mt-4 font-medium", children: "Install in Kiwi Browser \u2192 Open Olymp Trade \u2192 Enjoy the Magic!" })
  ] }) });
}
