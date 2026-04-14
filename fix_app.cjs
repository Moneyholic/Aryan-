const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /'<div style="color: #6B7280; width: 30%; text-align: right;">\\\(\) \{[\s\S]*?\}\n \+ \(price \? price\.toFixed\(2\) : '--'\) \+ '<\/div>';/;

const match = code.match(regex);
if (match) {
    const correctLine = "'<div style=\"color: #6B7280; width: 30%; text-align: right;\">$' + (price ? price.toFixed(2) : '--') + '</div>';";
    code = code.replace(regex, correctLine);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Fixed App.tsx successfully!");
} else {
    console.log("Could not find the corrupted block with regex.");
}
