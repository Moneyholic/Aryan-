const fs = require('fs');
let content = fs.readFileSync('./new_bot_content.js', 'utf8');

// 1. Update macdHistory length
content = content.replace(
    'if (state.macdHistory.length > 200) state.macdHistory.pop();',
    'if (state.macdHistory.length > 400) state.macdHistory.pop();'
);

// 2. Replace aryan-code content
const targetStr = `<textarea id="aryan-code" class="code-editor" spellcheck="false">
// --- ARYAN CUSTOM ALARM LOGIC ---
if (!ctx.candles || ctx.candles.length < 60) {
    ctx.signal("WAITING FOR DATA (" + (ctx.candles ? ctx.candles.length : 0) + "/60)");
    return;
}

// 1. Initialize custom memory state
window.myBotState = window.myBotState || {
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

// 3. Simple MACD Crossover/Crossunder
if (ctx.macd.line > ctx.macd.signal) {
    ctx.signal("BUY ALARM");
    if (isNewCycle) {
        ctx.log("MACD Crossover! Executing ALARM!");
        ctx.ring("BUY ALARM!");
    }
} else if (ctx.macd.line < ctx.macd.signal) {
    ctx.signal("SELL ALARM");
    if (isNewCycle) {
        ctx.log("MACD Crossunder! Executing ALARM!");
        ctx.ring("SELL ALARM!");
    }
} else {
    ctx.signal("WAIT");
}
                  </textarea>`;

const replacementStr = `<textarea id="aryan-code" class="code-editor" spellcheck="false">
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
                  </textarea>`;

content = content.replace(targetStr, replacementStr);

fs.writeFileSync('./new_bot_content.js', content);
console.log('Done');
