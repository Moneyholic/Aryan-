const fs = require('fs');
let code = fs.readFileSync('bot_extracted.js', 'utf8');

const newBtnLogic = `
        el('btn-test-multi').addEventListener('click', () => {
            let assetsToOpen = [];
            if (state.ignoredAssets && state.ignoredAssets.size > 0) {
                assetsToOpen = Array.from(state.ignoredAssets).slice(0, 3);
            } else {
                assetsToOpen = ['EURUSD_OTC', 'GBPUSD_OTC', 'USDJPY_OTC'];
            }
            
            // Save current script to localStorage so iframes can read it
            const aryanCodeEl = el('aryan-code');
            if (aryanCodeEl) {
                localStorage.setItem('aryanScript', aryanCodeEl.value);
            }
            
            assetsToOpen.forEach((asset, index) => {
                // Immediately create the chart UI so the user sees it
                updateMultiChartStatus(asset, 'INITIALIZING...', null, null, null);
                
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
`;

// Replace the old btn-test-multi listener
const oldBtnRegex = /el\('btn-test-multi'\)\.addEventListener\('click', \(\) => \{[\s\S]*?btn\.style\.background = '#10B981';\n\s*\}\);/;
if (code.match(oldBtnRegex)) {
    code = code.replace(oldBtnRegex, newBtnLogic.trim());
    fs.writeFileSync('bot_extracted.js', code);
    console.log("Updated btn-test-multi logic.");
} else {
    console.log("Could not find btn-test-multi logic.");
}
