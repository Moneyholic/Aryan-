const js = require("@eslint/js");
module.exports = [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        clearTimeout: "readonly",
        fetch: "readonly",
        localStorage: "readonly",
        chrome: "readonly",
        LightweightCharts: "readonly",
        Audio: "readonly",
        MutationObserver: "readonly",
        URL: "readonly",
        Blob: "readonly",
        btoa: "readonly",
        atob: "readonly",
        Math: "readonly",
        Date: "readonly",
        parseFloat: "readonly",
        parseInt: "readonly",
        isNaN: "readonly",
        Event: "readonly",
        CustomEvent: "readonly",
        navigator: "readonly",
        alert: "readonly",
        requestAnimationFrame: "readonly",
        cancelAnimationFrame: "readonly"
      }
    },
    rules: {
      "no-unused-vars": "off",
      "no-undef": "error"
    }
  }
];
