const fs = require('fs');
const code = fs.readFileSync('bot_evaluated.js', 'utf8');

const identifiers = new Set();
const regex = /\b[a-zA-Z_][a-zA-Z0-9_]*\b/g;
let match;
while ((match = regex.exec(code)) !== null) {
    identifiers.add(match[0]);
}

const globals = new Set(['window', 'document', 'console', 'setTimeout', 'setInterval', 'clearInterval', 'clearTimeout', 'fetch', 'localStorage', 'chrome', 'LightweightCharts', 'Audio', 'MutationObserver', 'URL', 'Blob', 'btoa', 'atob', 'Math', 'Date', 'parseFloat', 'parseInt', 'isNaN', 'Event', 'CustomEvent', 'navigator', 'alert', 'requestAnimationFrame', 'cancelAnimationFrame', 'Array', 'String', 'Number', 'Boolean', 'Object', 'Function', 'RegExp', 'Error', 'JSON', 'Promise', 'Map', 'Set', 'WeakMap', 'WeakSet', 'Symbol', 'Proxy', 'Reflect', 'Intl', 'WebAssembly', 'SharedArrayBuffer', 'Atomics', 'BigInt', 'globalThis', 'Infinity', 'NaN', 'undefined', 'null', 'true', 'false', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default', 'break', 'continue', 'return', 'function', 'var', 'let', 'const', 'class', 'extends', 'super', 'this', 'new', 'delete', 'typeof', 'void', 'in', 'instanceof', 'try', 'catch', 'finally', 'throw', 'with', 'debugger', 'yield', 'await', 'export', 'import', 'async', 'of']);

const undefinedVars = [];
for (const id of identifiers) {
    if (!globals.has(id)) {
        // Simple check, not perfect but helps
        if (!code.includes('function ' + id) && !code.includes('let ' + id) && !code.includes('const ' + id) && !code.includes('var ' + id) && !code.includes(id + ':') && !code.includes('.' + id)) {
            undefinedVars.push(id);
        }
    }
}
console.log(undefinedVars);
