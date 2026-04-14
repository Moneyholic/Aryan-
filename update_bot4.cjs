const fs = require('fs');
let botCode = fs.readFileSync('bot_extracted.js', 'utf8');

const ringOld = `    window.ring = function(msg) {
        if (isIframe) {
            window.parent.postMessage({ type: 'KAREN_ALARM', asset: state.activeAsset, msg: msg }, '*');
            return;
        }
        console.log('KAREN: Ringing...');
        const audio = new Audio('https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg');
        audio.play().catch(e => console.log('Audio play blocked', e));
        showAlarmOverlay(msg || "ALARM TRIGGERED!");
        
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
                body: JSON.stringify({ chat_id: chat, text: "🚨 " + (msg || "ALARM TRIGGERED!") })
            }).catch(e => console.error("Telegram Error:", e));
        };

        sendTg(globalToken, globalChat);
        sendTg(localToken, localChat);
    };`;

const ringNew = `    window.ring = function(msg) {
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
                body: JSON.stringify({ chat_id: chat, text: "🚨 " + finalMsg })
            }).catch(e => console.error("Telegram Error:", e));
        };

        sendTg(globalToken, globalChat);
        sendTg(localToken, localChat);
    };`;

botCode = botCode.replace(ringOld, ringNew);
fs.writeFileSync('bot_extracted.js', botCode);
console.log("Updated window.ring");
