const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /'<div style="color: #6B7280; width: 20%; text-align: right; font-weight: 600;">\\\(\) \{/;

if (code.match(regex)) {
    const replacement = "'<div style=\"color: #6B7280; width: 20%; text-align: right; font-weight: 600;\">$' + (price ? price.toFixed(2) : '--') + '</div>';\n" +
"        }\n\n" +
"        if (candle && window.multiCharts[asset] && window.multiCharts[asset].series) {\n" +
"            try {\n" +
"                window.multiCharts[asset].series.update(candle);\n" +
"            } catch (e) {\n" +
"                console.error(\"Chart update error:\", e);\n" +
"                addLog(\"Chart error: \" + e.message, \"error\");\n" +
"            }\n" +
"        }\n" +
"    }\n\n" +
"    if (document.readyState === 'loading') {\n" +
"        document.addEventListener('DOMContentLoaded', initUI);\n" +
"    } else {\n" +
"        initUI();\n" +
"    }\n" +
"}\n" +
"})();`\n\n" +
"export default function App() {";

    code = code.replace(regex, replacement);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Fixed App.tsx successfully!");
} else {
    console.log("Could not find the corrupted block with regex.");
}
