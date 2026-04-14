const fs = require('fs');
let code = fs.readFileSync('bot_extracted.js', 'utf8');

// 1. Remove ui-multi-status and move iframe-grid below Execution Logs
const oldHTML = `              <button class="btn btn-primary" id="btn-hide-multi" style="width: 100%; margin-bottom: 8px; display: none; background: #10B981;">2. Hide & Run in Background</button>
              <div id="iframe-grid" style="display: none; flex-direction: column; gap: 10px; margin-bottom: 10px;"></div>
              <div id="ui-multi-status" style="display: flex; flex-direction: column;"></div>
            </div>

            <div class="card">
              <div class="card-title">Execution Logs</div>
              <div class="logs" id="ui-logs"></div>
            </div>`;

const newHTML = `              <button class="btn btn-primary" id="btn-hide-multi" style="width: 100%; margin-bottom: 8px; display: none; background: #10B981;">2. Run Minions in Frontend</button>
            </div>

            <div class="card">
              <div class="card-title">Execution Logs</div>
              <div class="logs" id="ui-logs"></div>
            </div>

            <div id="iframe-grid" style="display: none; flex-direction: column; gap: 10px; margin-top: 10px;"></div>`;

code = code.replace(oldHTML, newHTML);

// 2. Update btn-hide-multi logic
const oldBtnHideLogic = `        const btnHide = el('btn-hide-multi');
        if (btnHide) {
            btnHide.addEventListener('click', () => {
                const grid = el('iframe-grid');
                const iframes = grid.querySelectorAll('iframe');
                iframes.forEach(iframe => {
                    iframe.style.position = 'absolute';
                    iframe.style.top = '0';
                    iframe.style.left = '0';
                    iframe.style.width = '10px';
                    iframe.style.height = '10px';
                    iframe.style.opacity = '0.01';
                    iframe.style.pointerEvents = 'none';
                    iframe.style.zIndex = '-1';
                    document.body.appendChild(iframe);
                });
                grid.style.display = 'none';
                btnHide.innerText = 'Running in Background ✅';
            });
        }`;

const newBtnHideLogic = `        const btnHide = el('btn-hide-multi');
        if (btnHide) {
            btnHide.addEventListener('click', () => {
                const grid = el('iframe-grid');
                const iframes = grid.querySelectorAll('iframe');
                iframes.forEach(iframe => {
                    // Keep them in the grid, just make them visible and functional
                    iframe.style.width = '100%';
                    iframe.style.height = '300px';
                    iframe.style.border = '1px solid #E5E7EB';
                    iframe.style.borderRadius = '8px';
                    iframe.style.opacity = '1';
                    iframe.style.pointerEvents = 'auto';
                });
                grid.style.display = 'flex';
                btnHide.innerText = 'Running in Frontend ✅';
            });
        }`;

code = code.replace(oldBtnHideLogic, newBtnHideLogic);

fs.writeFileSync('bot_extracted.js', code);
console.log("Updated bot_extracted.js for v13.0");
