const fs = require('fs');
let content = fs.readFileSync('./new_bot_content.js', 'utf8');

const targetHtml = `            <div class="card" id="video-card" style="display: none;">
              <div class="card-title">Anti-Sleep Video</div>
              <video id="bg-video" loop playsinline style="width: 100%; border-radius: 8px; border: 1px solid #E5E7EB; margin-top: 8px;">
                <source id="bg-video-source" src="" type="video/mp4">
              </video>
            </div>`;

const replacementHtml = `            <div class="card" id="video-card" style="display: none;">
              <div class="card-title">Anti-Sleep Video</div>
              <video id="bg-video" loop playsinline style="width: 100%; border-radius: 8px; border: 1px solid #E5E7EB; margin-top: 8px;">
                <source id="bg-video-source" src="" type="video/mp4">
              </video>
            </div>

            <div class="card" id="multi-chart-card" style="margin-top: 8px;">
              <div class="card-title">Multi-Chart Test</div>
              <div style="font-size: 11px; color: #6B7280; margin-bottom: 8px;">
                Ignored Assets Found: <span id="ui-ignored-count" style="font-weight: 600; color: #111827;">0</span>
              </div>
              <button class="btn btn-primary" id="btn-test-multi" style="width: 100%;">Open 3 Hidden Charts</button>
            </div>`;

content = content.replace(targetHtml, replacementHtml);

const targetJs = `        // Anti-Sleep Video Logic`;

const replacementJs = `        // Multi-Chart Test Logic
        setInterval(() => {
            const countEl = el('ui-ignored-count');
            if (countEl && state.ignoredAssets) {
                countEl.innerText = state.ignoredAssets.size;
            }
        }, 1000);

        el('btn-test-multi').addEventListener('click', () => {
            if (!state.ignoredAssets || state.ignoredAssets.size === 0) {
                alert("No ignored assets found yet! Wait for the broker to send background data.");
                return;
            }
            const assetsToOpen = Array.from(state.ignoredAssets).slice(0, 3);
            assetsToOpen.forEach((asset, index) => {
                const iframe = document.createElement('iframe');
                iframe.src = window.location.origin + window.location.pathname + '?asset=' + asset;
                iframe.style.width = '10px';
                iframe.style.height = '10px';
                iframe.style.position = 'absolute';
                iframe.style.top = '0';
                iframe.style.left = '0';
                iframe.style.opacity = '0.01';
                iframe.style.pointerEvents = 'none';
                iframe.style.zIndex = '-1';
                document.body.appendChild(iframe);
                addLog(\`Injected hidden chart for \${asset}\`, 'info');
            });
            const btn = el('btn-test-multi');
            btn.innerText = "Injected 3 Charts!";
            btn.disabled = true;
            btn.style.background = '#10B981';
        });

        // Anti-Sleep Video Logic`;

content = content.replace(targetJs, replacementJs);

fs.writeFileSync('./new_bot_content.js', content);
console.log('Done');
