const fs = require('fs');
let content = fs.readFileSync('./new_bot_content.js', 'utf8');

const targetStr = `        ctx.ring("BUY SIGNAL!");
        window.karenState = { last: 'BUY', time: now };
    }
} else if (ctx.macd.line < ctx.macd.signal) {
    ctx.signal("SELL ALARM");
    if (window.karenState.last !== 'SELL' || (now - window.karenState.time > 10000)) {
        ctx.log("MACD Crossunder! Vibrating.", "KAREN");
        ctx.vibrate("SELL SIGNAL!");`;

const replacementStr = `        ctx.ring("MACD WENT EXTREME LOW/BUY ZONE!");
        window.karenState = { last: 'BUY', time: now };
    }
} else if (ctx.macd.line < ctx.macd.signal) {
    ctx.signal("SELL ALARM");
    if (window.karenState.last !== 'SELL' || (now - window.karenState.time > 10000)) {
        ctx.log("MACD Crossunder! Vibrating.", "KAREN");
        ctx.vibrate("MACD WENT EXTREME HIGH/SELL ZONE!");`;

content = content.replace(targetStr, replacementStr);

fs.writeFileSync('./new_bot_content.js', content);
console.log('Done');
