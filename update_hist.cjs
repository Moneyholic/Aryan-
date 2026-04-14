const fs = require('fs');
let content = fs.readFileSync('./new_bot_content.js', 'utf8');

const targetStr = `            const macdEl = el('ui-macd-val');
            if (macdEl) {
                macdEl.innerText = \`\${state.macd.line.toFixed(2)} / \${state.macd.signal.toFixed(2)}\`;
                macdEl.style.color = state.macd.line > state.macd.signal ? '#000000' : '#000000';
            }`;

const replacementStr = `            const macdEl = el('ui-macd-val');
            if (macdEl) {
                macdEl.innerText = \`\${state.macd.line.toFixed(2)} / \${state.macd.signal.toFixed(2)}\`;
                macdEl.style.color = state.macd.line > state.macd.signal ? '#000000' : '#000000';
            }
            
            // Histogram Sideways Logic
            let histState = "NORMAL";
            if (state.macdHistory.length >= 5) {
                const recentHists = state.macdHistory.slice(0, 5).map(m => m.hist);
                const maxH = Math.max(...recentHists);
                const minH = Math.min(...recentHists);
                const range = Math.abs(maxH - minH);
                
                const recentLines = state.macdHistory.slice(0, 50).map(m => Math.abs(m.line));
                const maxLine = Math.max(...recentLines, 0.0001);
                
                if (range < maxLine * 0.05) {
                    histState = "SIDEWAYS";
                }
            }
            state.histState = histState;
            
            const histEl = el('ui-hist-state');
            if (histEl) {
                histEl.innerText = histState;
                histEl.style.color = histState === 'SIDEWAYS' ? '#F59E0B' : '#10B981';
            }`;

content = content.replace(targetStr, replacementStr);

fs.writeFileSync('./new_bot_content.js', content);
console.log('Done');
