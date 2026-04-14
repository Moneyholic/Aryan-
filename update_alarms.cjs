const fs = require('fs');
let content = fs.readFileSync('./new_bot_content.js', 'utf8');

const targetStr = `    window.ring = function(msg) {
        console.log('KAREN: Ringing...');
        const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
        audio.play();
        showAlarmOverlay(msg || "ALARM TRIGGERED!");
    };

    window.vibrate = function(msg) {
        console.log('KAREN: Vibrating...');
        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
        }
        showAlarmOverlay(msg || "VIBRATION TRIGGERED!");
    };`;

const replacementStr = `    window.ring = function(msg) {
        console.log('KAREN: Ringing...');
        // Loud alarm sound
        const audio = new Audio('https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg');
        audio.play();
        showAlarmOverlay(msg || "ALARM TRIGGERED!");
    };

    window.vibrate = function(msg) {
        console.log('KAREN: Vibrating...');
        if (navigator.vibrate) {
            // Long vibration pattern
            navigator.vibrate([1000, 500, 1000, 500, 1000, 500, 1000]);
        }
        showAlarmOverlay(msg || "VIBRATION TRIGGERED!");
    };`;

content = content.replace(targetStr, replacementStr);

fs.writeFileSync('./new_bot_content.js', content);
console.log('Done');
