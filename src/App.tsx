import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Square, Crosshair, Terminal, Activity, Code, Download, Settings, Bell, Bot } from 'lucide-react';
import { MACD, RSI } from 'technicalindicators';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ComposedChart } from 'recharts';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// Silent audio to keep the tab alive
const SILENT_AUDIO = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";

// Default Pine-Script-like logic for Karen
const KAREN_CODE = `// Bot: Karen (Aggressive Scalper)
// Variables:
// - price: [prev, current]
// - macd: { line: [prev, current], signal: [prev, current], hist: [prev, current] }
// - rsi: [prev, current]
// - crossover(a, b), crossunder(a, b)

// Buy when MACD crosses above Signal AND RSI is below 40
if (crossover(macd.line, macd.signal) && rsi[1] < 40) {
  return 'BUY';
}

// Sell when MACD crosses below Signal AND RSI is above 60
if (crossunder(macd.line, macd.signal) && rsi[1] > 60) {
  return 'SELL';
}

return null; // No signal
`;

// Default Pine-Script-like logic for Aryan
const ARYAN_CODE = `// Bot: Aryan (Conservative Trend Follower)
// Variables:
// - price: [prev, current]
// - macd: { line: [prev, current], signal: [prev, current], hist: [prev, current] }
// - rsi: [prev, current]
// - crossover(a, b), crossunder(a, b)

// Buy only when MACD is deep below zero and crosses up
let isDeepOversold = macd.line[1] < -0.05;
if (crossover(macd.line, macd.signal) && isDeepOversold && rsi[1] < 30) {
  return 'BUY';
}

// Sell only when MACD is high above zero and crosses down
let isDeepOverbought = macd.line[1] > 0.05;
if (crossunder(macd.line, macd.signal) && isDeepOverbought && rsi[1] > 70) {
  return 'SELL';
}

return null; // No signal
`;

const EXTENSION_MANIFEST = `{
  "manifest_version": 3,
  "name": "Olymp Trade Sniper",
  "version": "2.0",
  "description": "Extracts live data and clicks floating buttons.",
  "permissions": ["activeTab", "scripting"],
  "host_permissions": ["*://*.olymptrade.com/*"],
  "content_scripts": [
    {
      "matches": ["*://*.olymptrade.com/*"],
      "js": ["content.js"],
      "run_at": "document_end"
    }
  ]
}`;

// We will inject the WS_URL dynamically before zipping
const EXTENSION_CONTENT_JS_TEMPLATE = `// content.js
console.log("Sniper Extension Loaded v2.0");

// 1. Silent Audio to keep tab alive
const audio = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=");
audio.loop = true;
document.body.addEventListener('click', () => audio.play(), { once: true });

// 2. Connect to Jarvis App WebSocket
const WS_URL = "{{WS_URL}}";
let ws;

function connectWS() {
  console.log("Connecting to Jarvis at: " + WS_URL);
  ws = new WebSocket(WS_URL);
  
  ws.onopen = () => console.log("Connected to Jarvis!");
  ws.onclose = () => setTimeout(connectWS, 3000);
  
  // 5. Listen for Commands from Jarvis
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'DEPLOY_SNIPER') {
        injectCrosshairs();
      } else if (data.type === 'EXECUTE_TRADE') {
        executeClick(data.action);
      }
    } catch (e) {}
  };
}

connectWS();

// 3. Inject Draggable Crosshairs
function injectCrosshairs() {
  if (document.getElementById('sniper-buy')) return;

  const createCrosshair = (id, color, text, top, left) => {
    const el = document.createElement('div');
    el.id = id;
    el.style.cssText = 'position: fixed; top: ' + top + 'px; left: ' + left + 'px; width: 60px; height: 60px; background: ' + color + '; border: 2px solid white; border-radius: 8px; color: white; font-weight: bold; display: flex; align-items: center; justify-content: center; z-index: 999999; cursor: move; opacity: 0.8; font-size: 12px; text-align: center; box-shadow: 0 0 15px ' + color + ';';
    el.innerText = text;
    document.body.appendChild(el);

    let isDragging = false, startX, startY, initialX, initialY;
    el.addEventListener('mousedown', (e) => {
      isDragging = true; startX = e.clientX; startY = e.clientY;
      initialX = el.offsetLeft; initialY = el.offsetTop;
    });
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      el.style.left = (initialX + e.clientX - startX) + 'px';
      el.style.top = (initialY + e.clientY - startY) + 'px';
    });
    document.addEventListener('mouseup', () => isDragging = false);
    return el;
  };

  createCrosshair('sniper-buy', 'rgba(16, 185, 129, 0.7)', 'TARGET\\nBUY', 200, 100);
  createCrosshair('sniper-sell', 'rgba(239, 68, 68, 0.7)', 'TARGET\\nSELL', 200, 200);
}

function executeClick(action) {
  const targetId = action === 'BUY' ? 'sniper-buy' : 'sniper-sell';
  const targetEl = document.getElementById(targetId);
  
  if (targetEl) {
    targetEl.style.display = 'none';
    const rect = targetEl.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const elementUnder = document.elementFromPoint(x, y);
    
    if (elementUnder) {
      const clickEvent = new MouseEvent('click', { view: window, bubbles: true, cancelable: true, clientX: x, clientY: y });
      elementUnder.dispatchEvent(clickEvent);
      console.log('Executed ' + action + ' at ' + x + ', ' + y);
    }
    targetEl.style.display = 'flex';
  }
}

// 4. Intercept WebSocket for Price Data
const originalSend = WebSocket.prototype.send;
WebSocket.prototype.send = function(data) {
  originalSend.apply(this, arguments);
};

const OriginalWebSocket = window.WebSocket;
window.WebSocket = function(url, protocols) {
  const wsInstance = new OriginalWebSocket(url, protocols);
  wsInstance.addEventListener('message', function(event) {
    if (typeof event.data === 'string' && event.data.includes('price')) {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.price && ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'PRICE_UPDATE', price: parsed.price }));
        }
      } catch (e) {}
    }
  });
  return wsInstance;
};

// Test simulation if not connected to real Olymp Trade WS
setInterval(() => {
  if (ws && ws.readyState === WebSocket.OPEN && !window.location.host.includes('olymptrade')) {
    const simulatedPrice = 64000 + (Math.random() * 100 - 50);
    ws.send(JSON.stringify({ type: 'PRICE_UPDATE', price: simulatedPrice }));
  }
}, 1000);
`;

// Helper to play a notification beep
const playNotificationTone = (type: 'BUY' | 'SELL') => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Higher pitch for BUY, lower for SELL
    osc.frequency.value = type === 'BUY' ? 880 : 440;
    osc.type = 'sine';
    
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {
    console.error("Audio play failed", e);
  }
};

type ChartDataPoint = {
  time: string;
  price: number;
  macdLine?: number;
  macdSignal?: number;
  macdHist?: number;
  rsi?: number;
};

export default function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [activeBot, setActiveBot] = useState<'KAREN' | 'ARYAN'>('KAREN');
  
  const [bots, setBots] = useState({
    KAREN: KAREN_CODE,
    ARYAN: ARYAN_CODE
  });

  // Settings
  const [macdSettings, setMacdSettings] = useState({ fast: 12, slow: 26, signal: 9 });
  const [rsiSettings, setRsiSettings] = useState({ period: 14 });

  // Data
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [rawPrices, setRawPrices] = useState<number[]>([]);
  
  // Logs
  const [logs, setLogs] = useState<{ time: string, bot: string, msg: string, type: 'info' | 'signal' | 'exec' }[]>([]);
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string, type: 'info' | 'signal' | 'exec' = 'info') => {
    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), bot: activeBot, msg, type }].slice(-100));
  };

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const connectWebSocket = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = protocol + '//' + window.location.host;
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      setIsConnected(true);
      addLog('Connected to Jarvis WebSocket Server', 'info');
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'PRICE_UPDATE') {
          handlePriceUpdate(data.price);
        }
      } catch (e) {}
    };
    
    ws.onclose = () => {
      setIsConnected(false);
      addLog('Disconnected. Reconnecting...', 'info');
      setTimeout(connectWebSocket, 3000);
    };
    wsRef.current = ws;
  };

  useEffect(() => {
    connectWebSocket();
    return () => { if (wsRef.current) wsRef.current.close(); };
  }, []);

  const handlePriceUpdate = (newPrice: number) => {
    setRawPrices(prev => {
      const updated = [...prev, newPrice].slice(-200); // Keep 200 ticks
      calculateAndStore(updated);
      return updated;
    });
  };

  const calculateAndStore = (prices: number[]) => {
    if (prices.length < Math.max(macdSettings.slow, rsiSettings.period) + 1) {
      // Not enough data yet, just store price
      setChartData(prev => [...prev, { time: new Date().toLocaleTimeString(), price: prices[prices.length - 1] }].slice(-100));
      return;
    }

    try {
      // Calculate RSI
      const rsiResult = RSI.calculate({ values: prices, period: rsiSettings.period });
      
      // Calculate MACD
      const macdResult = MACD.calculate({
        values: prices,
        fastPeriod: macdSettings.fast,
        slowPeriod: macdSettings.slow,
        signalPeriod: macdSettings.signal,
        SimpleMAOscillator: false,
        SimpleMASignal: false
      });

      const currentPrice = prices[prices.length - 1];
      const currentRsi = rsiResult[rsiResult.length - 1];
      const currentMacd = macdResult[macdResult.length - 1];

      const newDataPoint: ChartDataPoint = {
        time: new Date().toLocaleTimeString(),
        price: currentPrice,
        macdLine: currentMacd?.MACD,
        macdSignal: currentMacd?.signal,
        macdHist: currentMacd?.histogram,
        rsi: currentRsi
      };

      setChartData(prev => {
        const newChart = [...prev, newDataPoint].slice(-100);
        
        // Run logic if bot is running and we have at least 2 data points for crossover logic
        if (isRunning && newChart.length >= 2) {
          evaluateLogic(newChart);
        }
        
        return newChart;
      });
    } catch (e) {
      console.error("Indicator calculation error", e);
    }
  };

  const evaluateLogic = (data: ChartDataPoint[]) => {
    const curr = data[data.length - 1];
    const prev = data[data.length - 2];

    // Ensure we have all data
    if (curr.macdLine === undefined || prev.macdLine === undefined) return;

    // Build the context variables for the user's code
    const context = {
      price: [prev.price, curr.price],
      macd: {
        line: [prev.macdLine, curr.macdLine],
        signal: [prev.macdSignal, curr.macdSignal],
        hist: [prev.macdHist, curr.macdHist]
      },
      rsi: [prev.rsi || 50, curr.rsi || 50],
      crossover: (a: number[], b: number[]) => a[0] < b[0] && a[1] > b[1],
      crossunder: (a: number[], b: number[]) => a[0] > b[0] && a[1] < b[1]
    };

    try {
      // eslint-disable-next-line no-new-func
      const logicFn = new Function('price', 'macd', 'rsi', 'crossover', 'crossunder', bots[activeBot]);
      const signal = logicFn(context.price, context.macd, context.rsi, context.crossover, context.crossunder);

      if (signal === 'BUY' || signal === 'SELL') {
        addLog(`[SIGNAL] ${signal} condition met!`, 'signal');
        executeTrade(signal);
      }
    } catch (e: any) {
      addLog(`Logic Error: ${e.message}`, 'info');
      setIsRunning(false);
    }
  };

  const executeTrade = (action: 'BUY' | 'SELL') => {
    playNotificationTone(action);
    addLog(`[EXECUTE] Fired ${action} to Extension`, 'exec');
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'EXECUTE_TRADE', action: action }));
    }
  };

  const deploySniper = () => {
    addLog('Deploying Sniper Crosshairs to Tab 1...', 'info');
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'DEPLOY_SNIPER' }));
    }
  };

  const downloadExtension = async () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = protocol + '//' + window.location.host;
    const contentJs = EXTENSION_CONTENT_JS_TEMPLATE.replace('{{WS_URL}}', wsUrl);

    const zip = new JSZip();
    zip.file("manifest.json", EXTENSION_MANIFEST);
    zip.file("content.js", contentJs);
    
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "OlympTradeSniper_v2.zip");
    addLog('Extension .zip downloaded successfully.', 'info');
  };

  const toggleBot = () => {
    if (!isRunning) {
      if (audioRef.current) audioRef.current.play().catch(() => {});
      addLog(`${activeBot} Started. Listening for signals...`, 'info');
    } else {
      addLog(`${activeBot} Stopped.`, 'info');
    }
    setIsRunning(!isRunning);
  };

  const simulatePriceTick = () => {
    const lastPrice = rawPrices.length > 0 ? rawPrices[rawPrices.length - 1] : 64000;
    const simulatedPrice = lastPrice + (Math.random() * 20 - 10);
    handlePriceUpdate(simulatedPrice);
  };

  // UI Theme Colors
  const colors = {
    bg: '#FAFAFA',
    panel: '#FFFFFF',
    border: '#E5E7EB',
    text: '#111827',
    textMuted: '#6B7280',
    primary: '#000000',
    buy: '#10B981',
    sell: '#EF4444',
    macdLine: '#3B82F6',
    macdSignal: '#F59E0B',
    rsiLine: '#8B5CF6'
  };

  const currentData = chartData[chartData.length - 1] || { price: 0, rsi: 0, macdLine: 0, macdSignal: 0, macdHist: 0 };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans flex flex-col">
      <audio ref={audioRef} src={SILENT_AUDIO} loop />

      {/* Header */}
      <header className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <Activity className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Jarvis <span className="text-zinc-400 font-normal">Command Center</span></h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-600 bg-zinc-100 px-3 py-1.5 rounded-full">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
          <button 
            onClick={downloadExtension}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Download Extension.zip
          </button>
          <button 
            onClick={deploySniper}
            className="flex items-center gap-2 px-4 py-2 bg-black hover:bg-zinc-800 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Crosshair className="w-4 h-4" />
            Deploy Sniper
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 overflow-hidden">
        
        {/* Left Column: Charts & Data (7 columns) */}
        <div className="lg:col-span-7 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
          
          {/* Price & Settings Row */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Bitcoin OTC Live</h2>
              <div className="text-4xl font-bold tracking-tight mb-4">
                ${currentData.price ? currentData.price.toFixed(2) : '---.--'}
              </div>
              <button onClick={simulatePriceTick} className="text-xs text-zinc-500 hover:text-black underline decoration-zinc-300 underline-offset-4">
                Simulate Tick (Test)
              </button>
            </div>

            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col justify-center">
              <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Indicator Settings</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-500 block mb-1">MACD (Fast, Slow, Sig)</label>
                  <div className="flex gap-1">
                    <input type="number" value={macdSettings.fast} onChange={e => setMacdSettings({...macdSettings, fast: +e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded px-2 py-1 text-sm outline-none focus:border-black" />
                    <input type="number" value={macdSettings.slow} onChange={e => setMacdSettings({...macdSettings, slow: +e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded px-2 py-1 text-sm outline-none focus:border-black" />
                    <input type="number" value={macdSettings.signal} onChange={e => setMacdSettings({...macdSettings, signal: +e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded px-2 py-1 text-sm outline-none focus:border-black" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 block mb-1">RSI Period</label>
                  <input type="number" value={rsiSettings.period} onChange={e => setRsiSettings({...rsiSettings, period: +e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded px-2 py-1 text-sm outline-none focus:border-black" />
                </div>
              </div>
            </div>
          </div>

          {/* Charts Container */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col gap-6 flex-1 min-h-[600px]">
            
            {/* Price Chart */}
            <div className="h-1/3 flex flex-col">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Price Action</h3>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="time" hide />
                    <YAxis domain={['auto', 'auto']} orientation="right" tick={{fontSize: 10, fill: '#9CA3AF'}} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                    <Line type="monotone" dataKey="price" stroke="#000000" strokeWidth={2} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* MACD Chart */}
            <div className="h-1/3 flex flex-col">
              <div className="flex justify-between items-end mb-2">
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">MACD ({macdSettings.fast}, {macdSettings.slow}, {macdSettings.signal})</h3>
                <div className="flex gap-3 text-xs font-mono">
                  <span className="text-blue-500">MACD: {currentData.macdLine?.toFixed(2) || '--'}</span>
                  <span className="text-amber-500">SIG: {currentData.macdSignal?.toFixed(2) || '--'}</span>
                  <span className={currentData.macdHist && currentData.macdHist > 0 ? 'text-emerald-500' : 'text-red-500'}>
                    HIST: {currentData.macdHist?.toFixed(2) || '--'}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="time" hide />
                    <YAxis orientation="right" tick={{fontSize: 10, fill: '#9CA3AF'}} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                    <Bar dataKey="macdHist" fill="#10B981" isAnimationActive={false}>
                      {chartData.map((entry, index) => (
                        <cell key={`cell-${index}`} fill={entry.macdHist && entry.macdHist > 0 ? '#10B981' : '#EF4444'} />
                      ))}
                    </Bar>
                    <Line type="monotone" dataKey="macdLine" stroke="#3B82F6" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                    <Line type="monotone" dataKey="macdSignal" stroke="#F59E0B" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* RSI Chart */}
            <div className="h-1/3 flex flex-col">
              <div className="flex justify-between items-end mb-2">
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">RSI ({rsiSettings.period})</h3>
                <div className="text-xs font-mono font-medium text-violet-500">
                  {currentData.rsi?.toFixed(2) || '--'}
                </div>
              </div>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="time" hide />
                    <YAxis domain={[0, 100]} ticks={[0, 30, 50, 70, 100]} orientation="right" tick={{fontSize: 10, fill: '#9CA3AF'}} axisLine={false} tickLine={false} />
                    <ReferenceLine y={70} stroke="#EF4444" strokeDasharray="3 3" opacity={0.5} />
                    <ReferenceLine y={50} stroke="#9CA3AF" strokeDasharray="3 3" opacity={0.5} />
                    <ReferenceLine y={30} stroke="#10B981" strokeDasharray="3 3" opacity={0.5} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                    <Line type="monotone" dataKey="rsi" stroke="#8B5CF6" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Bot Logic & Logs (5 columns) */}
        <div className="lg:col-span-5 flex flex-col gap-6 h-full">
          
          {/* Bot Selector & Editor */}
          <div className="bg-white border border-zinc-200 rounded-2xl flex flex-col flex-1 shadow-sm overflow-hidden">
            <div className="flex border-b border-zinc-200">
              <button 
                onClick={() => setActiveBot('KAREN')}
                className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeBot === 'KAREN' ? 'bg-zinc-50 text-black border-b-2 border-black' : 'text-zinc-500 hover:bg-zinc-50'}`}
              >
                <Bot className="w-4 h-4" /> Karen
              </button>
              <button 
                onClick={() => setActiveBot('ARYAN')}
                className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeBot === 'ARYAN' ? 'bg-zinc-50 text-black border-b-2 border-black' : 'text-zinc-500 hover:bg-zinc-50'}`}
              >
                <Bot className="w-4 h-4" /> Aryan
              </button>
            </div>
            
            <div className="p-4 bg-zinc-50 border-b border-zinc-200 flex justify-between items-center">
              <div className="text-xs text-zinc-500 font-mono">
                Editing logic for: <span className="font-bold text-black">{activeBot}</span>
              </div>
              <button
                onClick={toggleBot}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all shadow-sm ${
                  isRunning 
                    ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' 
                    : 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                {isRunning ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                {isRunning ? 'STOP BOT' : 'START BOT'}
              </button>
            </div>

            <div className="flex-1 relative">
              <Editor
                height="100%"
                defaultLanguage="javascript"
                theme="light"
                value={bots[activeBot]}
                onChange={(val) => setBots({...bots, [activeBot]: val || ''})}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  fontFamily: "'JetBrains Mono', monospace",
                  padding: { top: 16 },
                  scrollBeyondLastLine: false,
                  lineNumbersMinChars: 3,
                }}
              />
              {isRunning && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-10">
                  <div className="bg-black text-white px-6 py-3 rounded-full flex items-center gap-3 shadow-xl text-sm font-medium">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    {activeBot} is running. Logic locked.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Execution Logs */}
          <div className="bg-white border border-zinc-200 rounded-2xl flex flex-col h-64 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-200 flex items-center gap-2 bg-zinc-50">
              <Terminal className="w-4 h-4 text-zinc-400" />
              <h3 className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">Execution Logs</h3>
            </div>
            <div className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-3 custom-scrollbar">
              {logs.length === 0 && <div className="text-zinc-400 text-center mt-4">No logs yet. Start the bot.</div>}
              {logs.map((log, i) => (
                <div key={i} className="flex gap-3 leading-relaxed">
                  <span className="text-zinc-400 whitespace-nowrap">[{log.time}]</span>
                  <span className="text-zinc-500 font-bold">[{log.bot}]</span>
                  <span className={`
                    ${log.type === 'info' ? 'text-zinc-600' : ''}
                    ${log.type === 'signal' ? 'text-blue-600 font-medium' : ''}
                    ${log.type === 'exec' ? 'text-emerald-600 font-bold' : ''}
                  `}>
                    {log.msg}
                  </span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>

        </div>
      </main>
      
      {/* Add some custom scrollbar styling globally */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #E5E7EB; border-radius: 10px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background-color: #D1D5DB; }
      `}} />
    </div>
  );
}

