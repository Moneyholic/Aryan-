// loader.js - Passes extension data to the MAIN world
console.log("KAREN & ARYAN: Loader script running...");
const videoUrl = chrome.runtime.getURL("video.mp4");
document.documentElement.setAttribute("data-extension-video-url", videoUrl);
document.documentElement.setAttribute("data-extension-app-url", window.location.origin);

// Inject tv.js and bot.js into the MAIN world
function injectScript(file) {
    console.log("KAREN & ARYAN: Attempting to inject " + file);
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL(file);
    script.async = false;
    script.onload = function() {
        console.log("KAREN & ARYAN: Successfully injected " + file);
        this.remove();
    };
    script.onerror = function() {
        console.error("KAREN & ARYAN: Failed to inject " + file);
    };
    (document.head || document.documentElement).appendChild(script);
}

injectScript('tv.js');
injectScript('bot.js');
