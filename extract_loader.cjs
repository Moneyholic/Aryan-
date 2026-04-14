const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');

const extract = () => {
  const matchLoader = content.match(/const EXTENSION_LOADER_JS = `([\s\S]*?)`;\n\nconst EXTENSION_BOT_JS/);
  if (matchLoader) {
    let js = matchLoader[1].replace(/\\`/g, '`').replace(/\\\$/g, '$');
    fs.writeFileSync('loader_extracted.js', js);
    console.log("Extracted loader.js");
  } else {
    console.log("Not found loader");
  }
};
extract();
