const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');

// We can just require ts-node or evaluate it
const extract = () => {
  const match = content.match(/const EXTENSION_BOT_JS = `([\s\S]*?)`;\n\nexport default function App/);
  if (match) {
    // Unescape backticks and dollars
    let js = match[1].replace(/\\`/g, '`').replace(/\\\$/g, '$');
    fs.writeFileSync('bot_extracted.js', js);
    console.log("Extracted bot.js");
  } else {
    console.log("Not found bot");
  }

  const matchLoader = content.match(/const EXTENSION_LOADER_JS = `([\s\S]*?)`;\n\nconst EXTENSION_TV_JS/);
  if (matchLoader) {
    let js = matchLoader[1].replace(/\\`/g, '`').replace(/\\\$/g, '$');
    fs.writeFileSync('loader_extracted.js', js);
    console.log("Extracted loader.js");
  }

  const matchTV = content.match(/const EXTENSION_TV_JS = `([\s\S]*?)`;\n\nconst EXTENSION_BOT_JS/);
  if (matchTV) {
    let js = matchTV[1].replace(/\\`/g, '`').replace(/\\\$/g, '$');
    fs.writeFileSync('tv_extracted.js', js);
    console.log("Extracted tv.js");
  }
};
extract();
