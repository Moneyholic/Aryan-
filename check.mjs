import fs from 'fs';

let text = fs.readFileSync('temp_bot.js', 'utf-8');
const unescaped = text.replace(/\\`/g, '`').replace(/\\\$/g, '$');
fs.writeFileSync('temp_bot_final.js', unescaped);

try {
  new Function(unescaped);
  console.log("Syntax is OK");
} catch(e) {
  console.error("Syntax Error: ", e.message);
}
