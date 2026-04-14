const fs = require('fs');
let code = fs.readFileSync('bot_extracted.js', 'utf8');

// Replace macdParams with macd in KAREN_STATUS
code = code.replace(/macd: state\.macdParams/g, 'macd: state.macd');

const oldHeader = /header\.innerHTML = '<div style="font-weight: 700; color: #111827; width: 30%;">'.*?<\/div>';/s;
const newHeader = `
            header.innerHTML = '<div style="font-weight: 700; color: #111827; width: 25%;">' + asset + '</div>' +
                '<div style="color: ' + signalColor + '; font-weight: 700; width: 30%; text-align: center;">' + signal + '</div>' +
                '<div style="color: #6B7280; width: 25%; text-align: center; font-size: 12px;">' + (macd && macd.line ? 'MACD: ' + macd.line.toFixed(2) : '') + '</div>' +
                '<div style="color: #6B7280; width: 20%; text-align: right; font-weight: 600;">$' + (price ? price.toFixed(2) : '--') + '</div>';
`;

if (code.match(oldHeader)) {
    code = code.replace(oldHeader, newHeader.trim());
    fs.writeFileSync('bot_extracted.js', code);
    console.log("Updated MACD logic.");
} else {
    console.log("Could not find header logic.");
}
